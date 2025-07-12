import { takeEvery, call, put, select } from 'redux-saga/effects';
import { getDatabase } from '@react-native-firebase/database';
import {
  fetchChatsRequest,
  fetchChatsSuccess,
  fetchChatsFailure,
  fetchGlobalChatroomsRequest,
  fetchGlobalChatroomsSuccess,
  fetchGlobalChatroomsFailure,
} from '../slices/chatSlice';
import { RootState } from '../store';

function* handleFetchChats(): Generator<any, void, any> {
  try {
    const user = yield select((state: RootState) => state.auth.user);

    if (!user?.uid) {
      throw new Error('User not found');
    }

    const userId: string = yield select(
      (state: RootState) => state.auth.user?.uid,
    );

    const db = getDatabase();

    // Try to fetch chats with error handling
    let snapshot;
    try {
      snapshot = yield call([db.ref('chats'), 'once'], 'value');
    } catch (firebaseError: any) {
      // Return empty chats for now instead of failing
      yield put(fetchChatsSuccess([]));
      return;
    }

    const data = snapshot.val() || {};

    let userChats: import('../slices/chatSlice').Chat[] = Object.entries(data)
      .filter(([_, chat]: any) => chat?.participants?.[userId])
      .map(([id, chat]: any) => ({
        id,
        contactName: chat.contactName || 'Unknown',
        lastMessage: chat.lastMessage || '',
        timestamp: chat.timestamp || 0,
        unreadCount: chat.unreadCount?.[userId] || 0,
        type: 'private' as 'private',
      }));

    // For each chat, always fetch the latest message and use its text/timestamp
    for (let i = 0; i < userChats.length; i++) {
      const chat = userChats[i];
      const messagesSnap = yield call(
        [
          db
            .ref(`messages/${chat.id}`)
            .orderByChild('timestamp')
            .limitToLast(1),
          'once',
        ],
        'value',
      );
      const messagesData = messagesSnap.val();
      if (messagesData) {
        const lastMsg = Object.values(messagesData)[0] as any;
        chat.lastMessage = lastMsg.text || '';
        chat.timestamp = lastMsg.timestamp || 0;
      }
    }

    yield put(fetchChatsSuccess(userChats));
  } catch (error: any) {
    yield put(fetchChatsFailure(error.message));
  }
}

function* handleFetchGlobalChatrooms(): Generator<any, void, any> {
  try {
    const user = yield select((state: RootState) => state.auth.user);

    if (!user?.uid) {
      throw new Error('User not found');
    }

    const db = getDatabase();

    // Try to fetch chatrooms with error handling
    let snapshot;
    try {
      snapshot = yield call([db.ref('chatroom'), 'once'], 'value');
    } catch (firebaseError: any) {
      // Return empty chatrooms for now instead of failing
      yield put(fetchGlobalChatroomsSuccess([]));
      return;
    }

    const data = snapshot.val() || {};

    const rooms = Object.values(data).map((room: any) => ({
      ...room,
      contactName: room.name || 'Global',
      unreadCount: 0,
      type: 'global' as 'global',
    }));

    yield put(fetchGlobalChatroomsSuccess(rooms));
  } catch (error: any) {
    yield put(fetchGlobalChatroomsFailure(error.message));
  }
}

export function* chatSaga() {
  yield takeEvery(fetchChatsRequest.type, handleFetchChats);
  yield takeEvery(fetchGlobalChatroomsRequest.type, handleFetchGlobalChatrooms);
}
