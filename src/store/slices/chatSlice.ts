import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Chat {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

interface ChatState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
  activeChat: string | null; // Track which chat is currently active
}

const initialState: ChatState = {
  chats: [
    {
      id: '1',
      contactName: 'Alice Johnson',
      lastMessage: 'Hey! How are you doing?',
      timestamp: Date.now() - 300000, // 5 minutes ago
      unreadCount: 2,
    },
    {
      id: '2',
      contactName: 'Bob Smith',
      lastMessage: 'See you tomorrow!',
      timestamp: Date.now() - 3600000, // 1 hour ago
      unreadCount: 0,
    },
    {
      id: '3',
      contactName: 'Charlie Brown',
      lastMessage: 'Thanks for the help!',
      timestamp: Date.now() - 86400000, // 1 day ago
      unreadCount: 1,
    },
  ],
  loading: false,
  error: null,
  activeChat: null,
};

const chatSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    fetchChatsRequest: state => {
      state.loading = true;
      state.error = null;
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
    updateChatLastMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        message: string;
        timestamp: number;
      }>,
    ) => {
      const chat = state.chats.find(c => c.id === action.payload.chatId);
      if (chat) {
        chat.lastMessage = action.payload.message;
        chat.timestamp = action.payload.timestamp;

        // Sort chats by timestamp (most recent first)
        state.chats.sort((a, b) => b.timestamp - a.timestamp);
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        // Only increment if this chat is not currently active
        if (state.activeChat !== action.payload) {
          chat.unreadCount += 1;
        }
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === action.payload);
      if (chat) {
        chat.unreadCount = 0;
      }
    },
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChat = action.payload;
      // Mark active chat as read
      if (action.payload) {
        const chat = state.chats.find(c => c.id === action.payload);
        if (chat) {
          chat.unreadCount = 0;
        }
      }
    },
    receiveNewMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        message: string;
        timestamp: number;
        senderId: string;
      }>,
    ) => {
      const { chatId, message, timestamp, senderId } = action.payload;
      const chat = state.chats.find(c => c.id === chatId);

      if (chat) {
        chat.lastMessage = message;
        chat.timestamp = timestamp;

        // Only increment unread count if:
        // 1. The message is not from the current user (assuming you have current user info)
        // 2. The chat is not currently active
        if (state.activeChat !== chatId) {
          chat.unreadCount += 1;
        }

        // Sort chats by timestamp (most recent first)
        state.chats.sort((a, b) => b.timestamp - a.timestamp);
      }
    },
  },
});

export const {
  fetchChatsRequest,
  fetchChatsSuccess,
  fetchChatsFailure,
  updateChatLastMessage,
  incrementUnreadCount,
  markAsRead,
  setActiveChat,
  receiveNewMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
