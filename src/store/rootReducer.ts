// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import messageReducer from './slices/messageSlice';
import networkReducer from './slices/networkSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  chats: chatReducer,
  messages: messageReducer,
  // network: networkReducer,
});
