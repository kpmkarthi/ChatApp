import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface MessageState {
  messages: { [chatId: string]: Message[] };
  pendingMessages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: MessageState = {
  messages: {},
  pendingMessages: [],
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    fetchMessagesRequest: (state, action: PayloadAction<string>) => {
      state.loading = true;
      state.error = null;
    },
    fetchMessagesSuccess: (
      state,
      action: PayloadAction<{ chatId: string; messages: Message[] }>,
    ) => {
      // Only update if we don't have messages for this chat or if the new messages are different
      const { chatId, messages } = action.payload;
      const existingMessages = state.messages[chatId] || [];

      // Merge existing messages with new ones, avoiding duplicates
      const messageMap = new Map();

      // Add existing messages first
      existingMessages.forEach(msg => {
        messageMap.set(msg.id, msg);
      });

      // Add new messages, overwriting any duplicates
      messages.forEach(msg => {
        messageMap.set(msg.id, msg);
      });

      // Convert back to array and sort by timestamp
      state.messages[chatId] = Array.from(messageMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      state.loading = false;
      state.error = null;
    },
    fetchMessagesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    sendMessageRequest: (
      state,
      action: PayloadAction<{ chatId: string; text: string; senderId: string }>,
    ) => {
      const { chatId, text, senderId } = action.payload;
      const message: Message = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId,
        senderId,
        text,
        timestamp: Date.now(),
        status: 'sending',
      };

      // Initialize messages array for this chat if it doesn't exist
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      // Add the message to the chat
      state.messages[chatId] = [...state.messages[chatId], message];

      // Add to pending messages
      state.pendingMessages = [...state.pendingMessages, message];
    },
    sendMessageSuccess: (
      state,
      action: PayloadAction<{
        messageId: string;
        chatId: string;
        serverMessageId?: string;
      }>,
    ) => {
      const { messageId, chatId, serverMessageId } = action.payload;
      const messages = state.messages[chatId];

      if (messages) {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          // Update the message status
          messages[messageIndex] = {
            ...messages[messageIndex],
            status: 'sent',
            // Update with server ID if provided
            ...(serverMessageId && { id: serverMessageId }),
          };
        }
      }

      // Remove from pending messages
      state.pendingMessages = state.pendingMessages.filter(
        m => m.id !== messageId,
      );
    },
    sendMessageFailure: (
      state,
      action: PayloadAction<{ messageId: string; chatId: string }>,
    ) => {
      const { messageId, chatId } = action.payload;
      const messages = state.messages[chatId];

      if (messages) {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = {
            ...messages[messageIndex],
            status: 'failed',
          };
        }
      }
    },
    receiveMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const { chatId } = message;

      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      // Check if message already exists to avoid duplicates
      const existingMessage = state.messages[chatId].find(
        m => m.id === message.id,
      );

      if (!existingMessage) {
        // Add new message and sort by timestamp
        state.messages[chatId] = [...state.messages[chatId], message].sort(
          (a, b) => a.timestamp - b.timestamp,
        );
      }
    },
    updateMessageStatus: (
      state,
      action: PayloadAction<{
        messageId: string;
        chatId: string;
        status: Message['status'];
      }>,
    ) => {
      const { messageId, chatId, status } = action.payload;
      const messages = state.messages[chatId];

      if (messages) {
        const messageIndex = messages.findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          messages[messageIndex] = {
            ...messages[messageIndex],
            status,
          };
        }
      }
    },
    retryPendingMessages: state => {
      // This will be handled by saga
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (state.messages[chatId]) {
        delete state.messages[chatId];
      }
    },
  },
});

export const {
  fetchMessagesRequest,
  fetchMessagesSuccess,
  fetchMessagesFailure,
  sendMessageRequest,
  sendMessageSuccess,
  sendMessageFailure,
  receiveMessage,
  updateMessageStatus,
  retryPendingMessages,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
