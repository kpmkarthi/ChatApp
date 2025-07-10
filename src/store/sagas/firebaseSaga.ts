// src/store/sagas/firebaseSaga.ts
import {
  takeEvery,
  put,
  call,
  select,
  fork,
  take,
  cancel,
} from 'redux-saga/effects';
import { Task } from 'redux-saga';
import { PayloadAction } from '@reduxjs/toolkit';
import { eventChannel, EventChannel } from 'redux-saga';
import { RootState } from '../store';
import firebaseService from '../../services/firebaseService';
import {
  fetchChatsRequest,
  fetchChatsSuccess,
  fetchChatsFailure,
  updateChatLastMessage,
  markAsRead,
  Chat,
} from '../slices/chatSlice';
import {
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  receiveMessage,
  updateMessageStatus,
  retryPendingMessages,
  Message,
} from '../slices/messageSlice';

// Channel for real-time chat updates
function createChatChannel(userId: string): EventChannel<Chat[]> {
  return eventChannel(emit => {
    firebaseService.listenToUserChats(userId, (chats: Chat[]) => {
      emit(chats);
    });

    // Return unsubscribe function
    return () => {
      firebaseService.stopListeningToUserChats(userId);
    };
  });
}

// Channel for real-time message updates
function createMessageChannel(chatId: string): EventChannel<Message[]> {
  return eventChannel(emit => {
    firebaseService.listenToMessages(chatId, (messages: Message[]) => {
      emit(messages);
    });

    // Return unsubscribe function
    return () => {
      firebaseService.stopListeningToMessages(chatId);
    };
  });
}

// Saga for fetching chats
function* fetchChatsSaga() {
  try {
    const state: RootState = yield select();
    const userId = state.auth.user?.id;

    if (!userId) {
      yield put(fetchChatsFailure('User not authenticated'));
      return;
    }

    // Initialize user chats if needed
    yield call(firebaseService.initializeUserChats, userId);

    // Get initial chats
    const chats: Chat[] = yield call(firebaseService.getUserChats, userId);
    yield put(fetchChatsSuccess(chats));

    // Start listening to real-time updates
    const chatChannel: EventChannel<Chat[]> = yield call(
      createChatChannel,
      userId,
    );

    while (true) {
      const chats: Chat[] = yield take(chatChannel);
      yield put(fetchChatsSuccess(chats));
    }
  } catch (error) {
    yield put(
      fetchChatsFailure(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    );
  }
}

// Saga for fetching messages
function* fetchMessagesSaga(action: PayloadAction<string>) {
  try {
    const chatId = action.payload;

    // Start listening to real-time message updates
    const messageChannel: EventChannel<Message[]> = yield call(
      createMessageChannel,
      chatId,
    );

    while (true) {
      const messages: Message[] = yield take(messageChannel);
      yield put(fetchMessagesSuccess({ chatId, messages }));
    }
  } catch (error) {
    yield put(
      fetchMessagesFailure(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    );
  }
}

// Saga for sending messages
function* sendMessageSaga(
  action: PayloadAction<{ chatId: string; text: string; senderId: string }>,
) {
  try {
    const { chatId, text, senderId } = action.payload;

    // Send message to Firebase
    const messageId: string = yield call(firebaseService.sendMessage, {
      chatId,
      text,
      senderId,
      status: 'sending',
    });

    yield put(sendMessageSuccess({ messageId, chatId }));

    // Update chat last message
    yield put(
      updateChatLastMessage({
        chatId,
        message: text,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    // Handle the temporary message that was added optimistically
    const state: RootState = yield select();
    const messages = state.messages.messages[action.payload.chatId] || [];
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.status === 'sending') {
      yield put(
        sendMessageFailure({
          messageId: lastMessage.id,
          chatId: action.payload.chatId,
        }),
      );
    }
  }
}

// Saga for marking messages as read
function* markAsReadSaga(action: PayloadAction<string>) {
  try {
    const chatId = action.payload;
    const state: RootState = yield select();
    const userId = state.auth.user?.id;

    if (userId) {
      yield call(firebaseService.markMessagesAsRead, chatId, userId);
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Saga for retrying pending messages
function* retryPendingMessagesSaga() {
  try {
    const state: RootState = yield select();
    const { pendingMessages } = state.messages;

    for (const message of pendingMessages) {
      try {
        const messageId: string = yield call(firebaseService.sendMessage, {
          chatId: message.chatId,
          text: message.text,
          senderId: message.senderId,
          status: 'sending',
        });

        yield put(sendMessageSuccess({ messageId, chatId: message.chatId }));
      } catch (error) {
        yield put(
          sendMessageFailure({
            messageId: message.id,
            chatId: message.chatId,
          }),
        );
      }
    }
  } catch (error) {
    console.error('Error retrying pending messages:', error);
  }
}

// Saga for updating message status
function* updateMessageStatusSaga(
  action: PayloadAction<{
    messageId: string;
    chatId: string;
    status: Message['status'];
  }>,
) {
  try {
    const { messageId, chatId, status } = action.payload;
    yield call(firebaseService.updateMessageStatus, chatId, messageId, status);
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}

// Root saga for Firebase operations
export function* firebaseSaga() {
  yield takeEvery(fetchChatsRequest.type, fetchChatsSaga);
  yield takeEvery(fetchMessagesRequest.type, fetchMessagesSaga);
  yield takeEvery(sendMessageRequest.type, sendMessageSaga);
  yield takeEvery(markAsRead.type, markAsReadSaga);
  yield takeEvery(retryPendingMessages.type, retryPendingMessagesSaga);
  yield takeEvery(updateMessageStatus.type, updateMessageStatusSaga);
}

export default firebaseSaga;
