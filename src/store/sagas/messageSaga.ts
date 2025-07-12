import { takeEvery, call, put, select } from 'redux-saga/effects';
import { getDatabase } from '@react-native-firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  retryFailedMessage,
  clearPendingMessages,
  Message,
} from '../slices/messageSlice';
import { updateLastMessage, incrementUnreadCount } from '../slices/chatSlice';
import { fetchChatsRequest } from '../slices/chatSlice';

const OFFLINE_QUEUE_KEY = 'offline_message_queue';

function simpleUniqueId() {
  return (
    'msg-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).substr(2, 9)
  );
}

function* handleSendMessage(
  action: ReturnType<typeof sendMessageRequest>,
): Generator<any, void, any> {
  try {
    const { chatId, text, senderId } = action.payload;

    const messageId = simpleUniqueId();
    const timestamp = Date.now();

    const message: Message = {
      id: messageId,
      chatId,
      text,
      senderId,
      timestamp,
      status: 'sent',
    };

    // Check network status from Redux
    const isConnected: boolean = yield select(
      state => state.network.isConnected,
    );

    if (!isConnected) {
      // Store message in AsyncStorage queue for offline sync
      const queueRaw = yield call(
        [AsyncStorage, AsyncStorage.getItem],
        OFFLINE_QUEUE_KEY,
      );
      const queue = queueRaw ? JSON.parse(queueRaw) : [];
      queue.push(message);
      yield call(
        [AsyncStorage, AsyncStorage.setItem],
        OFFLINE_QUEUE_KEY,
        JSON.stringify(queue),
      );

      // Message is already added to pendingMessages in the reducer
      // No need to dispatch sendMessageSuccess since we're offline
      return;
    }

    // Online: send to Firebase
    if (!senderId) {
      throw new Error('No sender ID provided');
    }

    const db = getDatabase();

    try {
      yield call([db.ref(`messages/${chatId}/${messageId}`), 'set'], message);
      yield call([db.ref(`chatroom/${chatId}`), 'update'], {
        lastMessage: text,
        timestamp,
      });
      yield call([db.ref(`chats/${chatId}`), 'update'], {
        lastMessage: text,
        timestamp,
      });

      // Dispatch success to clear pending message
      yield put(sendMessageSuccess({ chatId, message }));
      yield put(
        updateLastMessage({
          chatId,
          text,
          timestamp,
          senderId,
          currentUserId: senderId,
        }),
      );
      yield put(fetchChatsRequest());
    } catch (firebaseError: any) {
      // If Firebase fails, message stays in pendingMessages
      yield put(
        sendMessageFailure({
          chatId: action.payload.chatId,
          error: firebaseError.message,
        }),
      );
    }
  } catch (error: any) {
    yield put(
      sendMessageFailure({
        chatId: action.payload.chatId,
        error: error.message,
      }),
    );
  }
}

function* syncOfflineMessages(): Generator<any, void, any> {
  const isConnected: boolean = yield select(state => state.network.isConnected);
  if (!isConnected) return;

  const queueRaw = yield call(
    [AsyncStorage, AsyncStorage.getItem],
    OFFLINE_QUEUE_KEY,
  );
  const queue = queueRaw ? JSON.parse(queueRaw) : [];

  if (queue.length === 0) return;

  for (const message of queue) {
    try {
      const db = getDatabase();
      yield call(
        [db.ref(`messages/${message.chatId}/${message.id}`), 'set'],
        message,
      );
      yield call([db.ref(`chatroom/${message.chatId}`), 'update'], {
        lastMessage: message.text,
        timestamp: message.timestamp,
      });
      yield call([db.ref(`chats/${message.chatId}`), 'update'], {
        lastMessage: message.text,
        timestamp: message.timestamp,
      });

      yield put(
        updateLastMessage({
          chatId: message.chatId,
          text: message.text,
          timestamp: message.timestamp,
          senderId: message.senderId,
          currentUserId: message.senderId,
        }),
      );
    } catch (error) {
      // If sending fails, keep in queue
      continue;
    }
  }

  // Clear queue after successful sync
  yield call([AsyncStorage, AsyncStorage.removeItem], OFFLINE_QUEUE_KEY);

  // Clear pending messages for all chats after successful sync
  const pendingMessages: Message[] = yield select(
    state => state.messages.pendingMessages,
  );
  const chatIds = [...new Set(pendingMessages.map(msg => msg.chatId))];

  for (const chatId of chatIds) {
    yield put(clearPendingMessages(chatId));
  }
}

function* handleNetworkChange(): Generator<any, void, any> {
  yield call(syncOfflineMessages);
}

function* handleFetchMessages(
  action: ReturnType<typeof fetchMessagesRequest>,
): Generator<any, void, any> {
  try {
    const chatId = action.payload;
    const db = getDatabase();
    const snapshot = yield call(
      [db.ref(`messages/${chatId}`), 'once'],
      'value',
    );
    const data = snapshot.val() || {};
    const messages = Object.values(data) as Message[];

    yield put(fetchMessagesSuccess({ chatId, messages }));
  } catch (error: any) {
    yield put(
      fetchMessagesFailure({ chatId: action.payload, error: error.message }),
    );
  }
}

function* handleRetryFailedMessage(
  action: ReturnType<typeof retryFailedMessage>,
): Generator<any, void, any> {
  try {
    const { messageId, chatId } = action.payload;

    // Get the pending message
    const pendingMessages: Message[] = yield select(
      state => state.messages.pendingMessages,
    );
    const message = pendingMessages.find(msg => msg.id === messageId);

    if (message) {
      // Retry sending the message
      yield put(
        sendMessageRequest({
          chatId: message.chatId,
          text: message.text,
          senderId: message.senderId,
        }),
      );
    }
  } catch (error: any) {
    // Handle retry error
  }
}

// New saga to handle unread message tracking
function* handleNewMessage(): Generator<any, void, any> {
  try {
    const user = yield select(state => state.auth.user);
    const currentUserId = user?.uid;

    if (!currentUserId) return;

    // Listen for new messages from Firebase
    const db = getDatabase();
    const messagesRef = db.ref('messages');

    messagesRef.on('child_added', snapshot => {
      const chatId = snapshot.key;
      const messageData = snapshot.val();

      if (chatId && messageData && messageData.senderId !== currentUserId) {
        // Increment unread count for messages from other users
        put(incrementUnreadCount(chatId));
      }
    });
  } catch (error) {
    // Handle error
  }
}

export function* messageSaga(): Generator<any, void, any> {
  yield takeEvery(sendMessageRequest.type, handleSendMessage);
  yield takeEvery(fetchMessagesRequest.type, handleFetchMessages);
  yield takeEvery(retryFailedMessage.type, handleRetryFailedMessage);
  // Listen for network reconnection to sync offline messages
  yield takeEvery('network/setConnectionStatus', handleNetworkChange);
  // Start listening for new messages
  yield call(handleNewMessage);
}
