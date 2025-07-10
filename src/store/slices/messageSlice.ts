import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  status: 'sent' | 'failed';
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
      const tempMessage: Message = {
        id: `local-${Date.now()}`,
        text,
        senderId,
        timestamp: Date.now(),
        status: 'sent',
        chatId,
      };
      state.pendingMessages.push(tempMessage);
    },
    sendMessageSuccess: (
      state,
      action: PayloadAction<{ chatId: string; message: Message }>,
    ) => {
      const { chatId, message } = action.payload;
      state.messages[chatId] = [...(state.messages[chatId] || []), message];
      state.pendingMessages = state.pendingMessages.filter(
        msg => msg.id !== message.id,
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
      state.messages[action.payload.chatId] = action.payload.messages;
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
} = messageSlice.actions;

export default messageSlice.reducer;
