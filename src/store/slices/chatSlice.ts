import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Chat {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  pendingCount: number; // New field for pending messages
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
      state.loading = true;
    },
    fetchGlobalChatroomsSuccess: (state, action: PayloadAction<Chat[]>) => {
      state.globalChatrooms = action.payload;
      state.loading = false;
    },
    fetchGlobalChatroomsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateLastMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        text: string;
        timestamp: number;
        senderId?: string; // Add senderId to determine if it's from current user
        currentUserId?: string; // Add currentUserId to compare with senderId
      }>,
    ) => {
      const { chatId, text, timestamp, senderId, currentUserId } =
        action.payload;

      // Update in chats array
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        const currentChat = state.chats[chatIndex];
        const isFromCurrentUser = senderId === currentUserId;

        state.chats[chatIndex] = {
          ...currentChat,
          lastMessage: text,
          timestamp,
          // Increment unread count only if message is from someone else
          unreadCount: isFromCurrentUser
            ? currentChat.unreadCount
            : currentChat.unreadCount + 1,
        };
      }

      // Update in globalChatrooms array
      const globalChatIndex = state.globalChatrooms.findIndex(
        c => c.id === chatId,
      );
      if (globalChatIndex !== -1) {
        const currentGlobalChat = state.globalChatrooms[globalChatIndex];
        const isFromCurrentUser = senderId === currentUserId;

        state.globalChatrooms[globalChatIndex] = {
          ...currentGlobalChat,
          lastMessage: text,
          timestamp,
          // Increment unread count only if message is from someone else
          unreadCount: isFromCurrentUser
            ? currentGlobalChat.unreadCount
            : currentGlobalChat.unreadCount + 1,
        };
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;

      // Update in chats array
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          unreadCount: 0,
        };
      }

      // Update in globalChatrooms array
      const globalChatIndex = state.globalChatrooms.findIndex(
        c => c.id === chatId,
      );
      if (globalChatIndex !== -1) {
        state.globalChatrooms[globalChatIndex] = {
          ...state.globalChatrooms[globalChatIndex],
          unreadCount: 0,
        };
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;

      // Update in chats array
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          unreadCount: state.chats[chatIndex].unreadCount + 1,
        };
      }

      // Update in globalChatrooms array
      const globalChatIndex = state.globalChatrooms.findIndex(
        c => c.id === chatId,
      );
      if (globalChatIndex !== -1) {
        state.globalChatrooms[globalChatIndex] = {
          ...state.globalChatrooms[globalChatIndex],
          unreadCount: state.globalChatrooms[globalChatIndex].unreadCount + 1,
        };
      }
    },
    updatePendingCount: (
      state,
      action: PayloadAction<{ chatId: string; pendingCount: number }>,
    ) => {
      const { chatId, pendingCount } = action.payload;

      // Update in chats array
      const chatIndex = state.chats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex] = {
          ...state.chats[chatIndex],
          pendingCount,
        };
      }

      // Update in globalChatrooms array
      const globalChatIndex = state.globalChatrooms.findIndex(
        c => c.id === chatId,
      );
      if (globalChatIndex !== -1) {
        state.globalChatrooms[globalChatIndex] = {
          ...state.globalChatrooms[globalChatIndex],
          pendingCount,
        };
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
  incrementUnreadCount,
  updatePendingCount,
} = chatSlice.actions;

export default chatSlice.reducer;
