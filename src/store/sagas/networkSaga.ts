import {
  takeEvery,
  call,
  put,
  delay,
  select,
  fork,
  take,
} from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { EventChannel, eventChannel } from 'redux-saga';
import {
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  receiveMessage,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  retryPendingMessages,
  Message,
} from '../slices/messageSlice';
import {
  updateChatLastMessage,
  incrementUnreadCount,
} from '../slices/chatSlice';
import { RootState } from '../store';

// Mock message data
const mockMessages: { [chatId: string]: Message[] } = {
  '1': [
    {
      id: '1',
      chatId: '1',
      senderId: '2',
      text: 'Hey! How are you doing?',
      timestamp: Date.now() - 300000,
      status: 'read',
    },
    {
      id: '2',
      chatId: '1',
      senderId: '1',
      text: "I'm doing great! Thanks for asking.",
      timestamp: Date.now() - 240000,
      status: 'sent',
    },
  ],
  '2': [
    {
      id: '3',
      chatId: '2',
      senderId: '3',
      text: 'See you tomorrow!',
      timestamp: Date.now() - 3600000,
      status: 'read',
    },
  ],
  '3': [
    {
      id: '4',
      chatId: '3',
      senderId: '4',
      text: 'Thanks for the help!',
      timestamp: Date.now() - 86400000,
      status: 'read',
    },
  ],
};

// Mock API calls
function* mockFetchMessages(chatId: string) {
  yield delay(500); // Simulate network delay
  return mockMessages[chatId] || [];
}

function* mockSendMessage(message: Message) {
  yield delay(Math.random() * 2000 + 500); // Simulate network delay

  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Network error');
  }

  return { success: true };
}

// Mock real-time message channel
function createMockWebSocketChannel(): EventChannel<Message> {
  return eventChannel(emitter => {
    const mockResponses = [
      'That sounds great!',
      'I agree with you.',
      'Let me think about it.',
      'Sure, no problem!',
      'Thanks for letting me know.',
      "I'll get back to you soon.",
    ];

    const interval = setInterval(() => {
      // Randomly send messages to simulate real-time chat
      if (Math.random() < 0.3) {
        const chatIds = ['1', '2', '3'];
        const randomChatId =
          chatIds[Math.floor(Math.random() * chatIds.length)];
        const randomResponse =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];

        const message: Message = {
          id: Date.now().toString(),
          chatId: randomChatId,
          senderId:
            randomChatId === '1' ? '2' : randomChatId === '2' ? '3' : '4',
          text: randomResponse,
          timestamp: Date.now(),
          status: 'delivered',
        };

        emitter(message);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  });
}

function* handleFetchMessages(action: PayloadAction<string>) {
  try {
    const chatId = action.payload;
    const messages = yield call(mockFetchMessages, chatId);
    yield put(fetchMessagesSuccess({ chatId, messages }));
  } catch (error) {
    yield put(fetchMessagesFailure(error.message));
  }
}

function* handleSendMessage(
  action: PayloadAction<{ chatId: string; text: string; senderId: string }>,
) {
  const { chatId, text, senderId } = action.payload;

  // Get the message from state
  const state: RootState = yield select();
  const messages = state.messages.messages[chatId] || [];
  const message = messages[messages.length - 1];

  if (!message) return;

  try {
    // Check network status
    const networkState: RootState['network'] = yield select(
      state => state.network,
    );

    if (!networkState.isConnected) {
      throw new Error('No network connection');
    }

    yield call(mockSendMessage, message);
    yield put(sendMessageSuccess({ messageId: message.id, chatId }));

    // Update chat last message
    yield put(
      updateChatLastMessage({
        chatId,
        message: text,
        timestamp: message.timestamp,
      }),
    );
  } catch (error) {
    yield put(sendMessageFailure({ messageId: message.id, chatId }));
  }
}

function* handleReceiveMessage(message: Message) {
  yield put(receiveMessage(message));
  yield put(
    updateChatLastMessage({
      chatId: message.chatId,
      message: message.text,
      timestamp: message.timestamp,
    }),
  );
  yield put(incrementUnreadCount(message.chatId));
}

function* handleRetryPendingMessages() {
  const state: RootState = yield select();
  const pendingMessages = state.messages.pendingMessages;

  for (const message of pendingMessages) {
    yield put(
      sendMessageRequest({
        chatId: message.chatId,
        text: message.text,
        senderId: message.senderId,
      }),
    );
  }
}

function* watchWebSocket() {
  const channel = yield call(createMockWebSocketChannel);

  try {
    while (true) {
      const message = yield take(channel);
      yield fork(handleReceiveMessage, message);
    }
  } catch (error) {
    console.error('WebSocket error:', error);
  }
}

export function* networkSaga() {
  yield fork(watchWebSocket);
  yield takeEvery(fetchMessagesRequest.type, handleFetchMessages);
  yield takeEvery(sendMessageRequest.type, handleSendMessage);
  yield takeEvery(retryPendingMessages.type, handleRetryPendingMessages);
}
