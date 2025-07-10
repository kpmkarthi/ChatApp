// import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// export interface User {
//   id: string;
//   email: string;
//   username: string;
// }

// interface AuthState {
//   isAuthenticated: boolean;
//   user: User | null;
//   loading: boolean;
//   error: string | null;
// }

// const initialState: AuthState = {
//   isAuthenticated: false,
//   user: null,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     loginRequest: (
//       state,
//       action: PayloadAction<{ email: string; password: string }>,
//     ) => {
//       state.loading = true;
//       state.error = null;
//     },
//     loginSuccess: (state, action: PayloadAction<User>) => {
//       state.isAuthenticated = true;
//       state.user = action.payload;
//       state.loading = false;
//       state.error = null;
//     },
//     loginFailure: (state, action: PayloadAction<string>) => {
//       state.isAuthenticated = false;
//       state.user = null;
//       state.loading = false;
//       state.error = action.payload;
//     },
//     registerRequest: (
//       state,
//       action: PayloadAction<{
//         email: string;
//         password: string;
//         username: string;
//       }>,
//     ) => {
//       console.log(state, action.type);

//       state.loading = true;
//       state.error = null;
//     },
//     registerSuccess: (state, action: PayloadAction<User>) => {
//       state.isAuthenticated = true;
//       state.user = action.payload;
//       state.loading = false;
//       state.error = null;
//     },
//     registerFailure: (state, action: PayloadAction<string>) => {
//       state.isAuthenticated = false;
//       state.user = null;
//       state.loading = false;
//       state.error = action.payload;
//     },
//     logout: state => {
//       state.isAuthenticated = false;
//       state.user = null;
//       state.loading = false;
//       state.error = null;
//     },
//     checkAuthState: state => {
//       state.loading = true;
//     },
//     setAuthState: (
//       state,
//       action: PayloadAction<{ isAuthenticated: boolean; user: User | null }>,
//     ) => {
//       state.isAuthenticated = action.payload.isAuthenticated;
//       state.user = action.payload.user;
//       state.loading = false;
//       state.error = null;
//     },
//     clearError: state => {
//       state.error = null;
//     },
//   },
// });

// export const {
//   loginRequest,
//   loginSuccess,
//   loginFailure,
//   registerRequest,
//   registerSuccess,
//   registerFailure,
//   logout,
//   checkAuthState,
//   setAuthState,
//   clearError,
// } = authSlice.actions;

// export default authSlice.reducer;

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
} = authSlice.actions;

export default authSlice.reducer;
