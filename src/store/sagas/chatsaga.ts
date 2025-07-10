import { takeEvery, call, put, select } from 'redux-saga/effects';
import { getDatabase, ref, get } from '@react-native-firebase/database';
import {
  fetchChatsRequest,
  fetchChatsSuccess,
  fetchChatsFailure,
  fetchGlobalChatroomsRequest,
  fetchGlobalChatroomsSuccess,
  fetchGlobalChatroomsFailure,
} from '../slices/chatSlice';
import { RootState } from '../store';
{
  console.log('-------------------');
}
function* handleFetchChats() {
  try {
    const userId: string = yield select(
      (state: RootState) => state.auth.user?.email,
    );
    const snapshot = yield call(
      [getDatabase(), getDatabase().ref('chats').once],
      'value',
    );
    const data = snapshot.val() || {};

    const userChats = Object.entries(data)
      .filter(([_, chat]: any) => chat?.participants?.[userId])
      .map(([id, chat]: any) => ({
        id,
        contactName: chat.contactName || 'Unknown',
        lastMessage: chat.lastMessage || '',
        timestamp: chat.timestamp || 0,
        unreadCount: chat.unreadCount?.[userId] || 0,
        type: 'private',
      }));

    yield put(fetchChatsSuccess(userChats));
  } catch (error: any) {
    yield put(fetchChatsFailure(error.message));
  }
}

function* handleFetchGlobalChatrooms() {
  try {
    console.log('🔁 Fetching global chatrooms');
    const db = getDatabase();
    const chatroomsRef = ref(db, 'chatroom');

    // ✅ correct call syntax
    const snapshot = yield call(get, chatroomsRef);

    const data = snapshot.val() || {};

    const rooms = Object.values(data).map((room: any) => ({
      ...room,
      contactName: room.name || 'Global',
      unreadCount: 0,
      type: 'global',
    }));

    yield put(fetchGlobalChatroomsSuccess(rooms));
  } catch (error: any) {
    console.error('🔥 Error fetching chatrooms:', error.message);
    yield put(fetchGlobalChatroomsFailure(error.message));
  }
}

export function* chatSaga() {
  yield takeEvery(fetchChatsRequest.type, handleFetchChats);
  yield takeEvery(fetchGlobalChatroomsRequest.type, handleFetchGlobalChatrooms);
}
