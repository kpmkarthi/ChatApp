// src/store/slices/networkSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnectionTime: number | null;
  connectionError: string | null;
}

const initialState: NetworkState = {
  isConnected: true,
  isReconnecting: false,
  lastConnectionTime: null,
  connectionError: null,
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastConnectionTime = Date.now();
        state.isReconnecting = false;
        state.connectionError = null;
      }
    },
    connectionLost: state => {
      state.isConnected = false;
      state.isReconnecting = false;
      state.connectionError = 'Connection lost';
    },
    connectionRestored: state => {
      state.isConnected = true;
      state.isReconnecting = false;
      state.lastConnectionTime = Date.now();
      state.connectionError = null;
    },
    setReconnecting: (state, action: PayloadAction<boolean>) => {
      state.isReconnecting = action.payload;
    },
    setConnectionError: (state, action: PayloadAction<string | null>) => {
      state.connectionError = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  connectionLost,
  connectionRestored,
  setReconnecting,
  setConnectionError,
} = networkSlice.actions;

export default networkSlice.reducer;
