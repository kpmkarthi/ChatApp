import { takeEvery, call, put } from 'redux-saga/effects';
import getDatabase from '@react-native-firebase/database';
import { v4 as uuidv4 } from 'uuid';
import {
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  retryFailedMessage,
  Message,
} from '../slices/messageSlice';
import { updateLastMessage } from '../slices/chatSlice';

function* handleSendMessage(action: ReturnType<typeof sendMessageRequest>) {
  try {
    const { chatId, text, senderId } = action.payload;
    const messageId = uuidv4();
    const timestamp = Date.now();
    {
      console.log('[[[[[[[------------[[[[[[[[[');
    }
    const message: Message = {
      id: messageId,
      chatId,
      text,
      senderId,
      timestamp,
      status: 'sent',
    };
    console.log('/////', message);

    yield call(
      [getDatabase(), getDatabase().ref(`messages/${chatId}/${messageId}`).set],
      message,
    );

    yield call(
      [getDatabase(), getDatabase().ref(`chatroom/${chatId}`).update],
      {
        lastMessage: text,
        timestamp,
      },
    );

    yield call([getDatabase(), getDatabase().ref(`chats/${chatId}`).update], {
      lastMessage: text,
      timestamp,
    });

    yield put(sendMessageSuccess({ chatId, message }));
    yield put(updateLastMessage({ chatId, text, timestamp }));
  } catch (error: any) {
    yield put(
      sendMessageFailure({
        chatId: action.payload.chatId,
        error: error.message,
      }),
    );
  }
}

function* handleFetchMessages(action: ReturnType<typeof fetchMessagesRequest>) {
  try {
    const chatId = action.payload;
    const snapshot = yield call(
      [getDatabase(), getDatabase().ref(`messages/${chatId}`).once],
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
) {
  // You can implement retry logic here if needed
}

export function* messageSaga() {
  yield takeEvery(sendMessageRequest.type, handleSendMessage);
  yield takeEvery(fetchMessagesRequest.type, handleFetchMessages);
  yield takeEvery(retryFailedMessage.type, handleRetryFailedMessage);
}
