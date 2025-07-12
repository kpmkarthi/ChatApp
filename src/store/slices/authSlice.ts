import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any;
  profile: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    registerRequest: (
      state,
      action: PayloadAction<{
        username: string;
        email: string;
        password: string;
      }>,
    ) => {
      state.loading = true;
    },
    registerSuccess: state => {
      state.loading = false;
      state.isAuthenticated = true;
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    loginRequest: (
      state,
      action: PayloadAction<{ email: string; password: string }>,
    ) => {
      console.log(action, 'authsliceeeee');
      state.loading = true;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ user: any; profile: any }>,
    ) => {
      state.loading = false;
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.isAuthenticated = true;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearError: state => {
      state.error = null;
    },
    logout: state => {
      state.user = null;
      state.profile = null;
      state.loading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  registerRequest,
  registerSuccess,
  registerFailure,
  loginRequest,
  loginSuccess,
  loginFailure,
  clearError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
