import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
}

const initialState: NetworkState = {
  isConnected: true,
  connectionType: 'wifi',
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkStatus: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        connectionType: string | null;
      }>,
    ) => {
      state.isConnected = action.payload.isConnected;
      state.connectionType = action.payload.connectionType;
    },
    networkConnected: state => {
      state.isConnected = true;
    },
    networkDisconnected: state => {
      state.isConnected = false;
    },
  },
});

export const { setNetworkStatus, networkConnected, networkDisconnected } =
  networkSlice.actions;

export default networkSlice.reducer;
