import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Chat {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  type?: 'global' | 'private';
}

interface ChatState {
  chats: Chat[];
  globalChatrooms: Chat[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  globalChatrooms: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    fetchChatsRequest: state => {
      {
        console.log(' feting data list');
      }
      state.loading = true;
    },
    fetchChatsSuccess: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
      state.loading = false;
      state.error = null;
    },
    fetchChatsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchGlobalChatroomsRequest: state => {
      console.log('loballllllll');
      state.loading = true;
    },
    fetchGlobalChatroomsSuccess: (state, action: PayloadAction<Chat[]>) => {
      console.log('pppppiiiiiiiiiii');

      state.globalChatrooms = action.payload;
      state.loading = false;
    },
    fetchGlobalChatroomsFailure: (state, action: PayloadAction<string>) => {
      console.log(']]]]]]]]]]]]]]');

      state.loading = false;
      state.error = action.payload;
    },
    updateLastMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        text: string;
        timestamp: number;
      }>,
    ) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessage = action.payload.text;
        chat.timestamp = action.payload.timestamp;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
  },
});

export const {
  fetchChatsRequest,
  fetchChatsSuccess,
  fetchChatsFailure,
  fetchGlobalChatroomsRequest,
  fetchGlobalChatroomsSuccess,
  fetchGlobalChatroomsFailure,
  updateLastMessage,
  markAsRead,
} = chatSlice.actions;

export default chatSlice.reducer;
