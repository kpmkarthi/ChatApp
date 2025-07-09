import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import messageSlice from './slices/messageSlice';
import networkSlice from './slices/networkSlice';

export const rootReducer = combineReducers({
  auth: authSlice,
  chats: chatSlice,
  messages: messageSlice,
  network: networkSlice,
});
