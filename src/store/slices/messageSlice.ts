import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: 'sent' | 'failed' | 'pending';
  chatId: string;
}

interface MessagesState {
  messages: Record<string, Message[]>;
  pendingMessages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  messages: {},
  pendingMessages: [],
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    sendMessageRequest: (
      state,
      action: PayloadAction<{ chatId: string; text: string; senderId: string }>,
    ) => {
      const { chatId, text, senderId } = action.payload;
      const pendingMessage: Message = {
        id: `pending_${Date.now()}_${Math.random()}`,
        text,
        senderId,
        timestamp: Date.now(),
        status: 'pending',
        chatId,
      };

      // Add to pending messages for offline tracking
      state.pendingMessages.push(pendingMessage);
    },
    sendMessageSuccess: (
      state,
      action: PayloadAction<{ chatId: string; message: Message }>,
    ) => {
      const { chatId, message } = action.payload;
      // Check if message already exists to prevent duplicates
      const existingMessage = state.messages[chatId]?.find(
        msg => msg.id === message.id,
      );
      if (!existingMessage) {
        const currentMessages = state.messages[chatId] || [];
        // Create a completely new messages object to avoid mutations
        state.messages = {
          ...state.messages,
          [chatId]: [...currentMessages, message],
        };
      }
      // Clean up pending messages
      state.pendingMessages = state.pendingMessages.filter(
        msg => msg.id !== message.id && msg.text !== message.text,
      );
    },
    sendMessageFailure: (
      state,
      action: PayloadAction<{ chatId: string; error: string }>,
    ) => {
      state.error = action.payload.error;
    },
    fetchMessagesRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
    },
    fetchMessagesSuccess: (
      state,
      action: PayloadAction<{ chatId: string; messages: Message[] }>,
    ) => {
      const { chatId, messages } = action.payload;

      // Create a completely new messages object to avoid mutations
      state.messages = {
        ...state.messages,
        [chatId]: messages,
      };

      // Clean up pending messages that are now confirmed
      state.pendingMessages = state.pendingMessages.filter(pendingMsg => {
        return !messages.some(
          confirmedMsg =>
            confirmedMsg.text === pendingMsg.text &&
            confirmedMsg.senderId === pendingMsg.senderId &&
            Math.abs(confirmedMsg.timestamp - pendingMsg.timestamp) < 5000, // Within 5 seconds
        );
      });

      state.loading = false;
    },
    fetchMessagesFailure: (
      state,
      action: PayloadAction<{ chatId: string; error: string }>,
    ) => {
      state.loading = false;
      state.error = action.payload.error;
    },
    retryFailedMessage: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string }>,
    ) => {
      const { chatId, messageId } = action.payload;
      const message = state.pendingMessages.find(m => m.id === messageId);
      if (message) {
        // retry logic placeholder
      }
    },
    clearPendingMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      state.pendingMessages = state.pendingMessages.filter(
        msg => msg.chatId !== chatId,
      );
    },
  },
});

export const {
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  retryFailedMessage,
  clearPendingMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
