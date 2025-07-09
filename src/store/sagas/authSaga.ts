import { takeEvery, call, put, delay } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
} from '../slices/authSlice';

// Mock API calls
function* mockLoginAPI(username: string, password: string) {
  yield delay(1000); // Simulate network delay

  // Mock validation
  if (username === 'test' && password === 'test') {
    return {
      id: '1',
      username: 'test',
      email: 'test@example.com',
    };
  }

  throw new Error('Invalid credentials');
}

function* mockRegisterAPI(username: string, email: string, password: string) {
  yield delay(1000); // Simulate network delay

  // Mock validation
  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (!email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return {
    id: Date.now().toString(),
    username,
    email,
  };
}

function* handleLogin(
  action: PayloadAction<{ username: string; password: string }>,
) {
  try {
    const { username, password } = action.payload;
    const user = yield call(mockLoginAPI, username, password);
    yield put(loginSuccess(user));
  } catch (error) {
    yield put(loginFailure(error.message));
  }
}

function* handleRegister(
  action: PayloadAction<{ username: string; email: string; password: string }>,
) {
  try {
    const { username, email, password } = action.payload;
    const user = yield call(mockRegisterAPI, username, email, password);
    yield put(registerSuccess(user));
  } catch (error) {
    yield put(registerFailure(error.message));
  }
}

export function* authSaga() {
  yield takeEvery(loginRequest.type, handleLogin);
  yield takeEvery(registerRequest.type, handleRegister);
}
