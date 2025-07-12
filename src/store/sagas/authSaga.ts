import { call, put, takeLatest } from 'redux-saga/effects';
import auth from '@react-native-firebase/auth';
import { getDatabase } from '@react-native-firebase/database';

import {
  loginRequest,
  loginSuccess,
  loginFailure,
  registerRequest,
  registerSuccess,
  registerFailure,
} from '../slices/authSlice';
import { firebaseAuth, database } from '../../config/firebase';

function* handleRegister(action: ReturnType<typeof registerRequest>) {
  {
    console.log('pppp');
  }
  try {
    const { email, password, username } = action.payload;
    const userCredential = yield call(
      [auth(), 'createUserWithEmailAndPassword'],
      email,
      password,
    );

    const user = userCredential.user;

    // Save user info to Realtime Database
    yield call([database.ref(`users/${user.uid}`), 'set'], {
      username,
      email,
      createdAt: new Date().toISOString(),
    });

    yield put(registerSuccess());
  } catch (error: any) {
    console.log('Register error:', error);
    yield put(registerFailure(error.message));
  }
}
console.log('oer');

function* handleLogin(action: ReturnType<typeof loginRequest>) {
  try {
    const { email, password } = action.payload;
    const userCredential = yield call(
      [auth(), 'signInWithEmailAndPassword'],
      email,
      password,
    );

    const user = userCredential.user;

    // Optionally fetch user profile from RTDB
    const snapshot = yield call(
      [database.ref(`users/${user.uid}`), 'once'],
      'value',
    );
    const userProfile = snapshot.exists() ? snapshot.val() : {};

    yield put(loginSuccess({ user, profile: userProfile }));
  } catch (error: any) {
    console.log('Login error:', error);
    yield put(loginFailure(error.message));
  }
}

export function* authSaga() {
  yield takeLatest(registerRequest.type, handleRegister);
  yield takeLatest(loginRequest.type, handleLogin);
}

// import { call, put, takeLatest } from 'redux-saga/effects';
// import {
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
// } from 'firebase/auth';
// import { ref, set, get } from 'firebase/database';
// import {
//   registerRequest,
//   registerSuccess,
//   registerFailure,
//   loginRequest,
//   loginSuccess,
//   loginFailure,
// } from '../slices/authSlice';
// import { auth, database } from '../../config/firebase';
// {
//   console.log('register saga global');
// }

// function* handleRegister(action: ReturnType<typeof registerRequest>) {
//   {
//     console.log('register saga');
//   }
//   try {
//     console.log('Saga Triggered: Register');
//     const { email, password, username } = action.payload;
//     const userCredential = yield call(
//       createUserWithEmailAndPassword,
//       auth,
//       email,
//       password,
//     );

//     const user = userCredential.user;

//     // Save user info to Firebase Realtime Database
//     yield call(set, ref(database, `users/${user.uid}`), {
//       username,
//       email,
//       createdAt: new Date().toISOString(),
//     });

//     yield put(registerSuccess());
//   } catch (error: any) {
//     console.log('Register error:', error.message);
//     yield put(registerFailure(error.message));
//   }
// }
// {
//   console.log('sumaaaaaaaasaga');
// }
// function* handleLogin(action: ReturnType<typeof loginRequest>) {
//   try {
//     console.log('Saga Triggered: Login');
//     const { email, password } = action.payload;
//     const userCredential = yield call(
//       signInWithEmailAndPassword,
//       auth,
//       email,
//       password,
//     );

//     const user = userCredential.user;

//     const snapshot = yield call(get, ref(database, `users/${user.uid}`));
//     const profile = snapshot.exists() ? snapshot.val() : {};

//     yield put(loginSuccess({ user, profile }));
//   } catch (error: any) {
//     console.log('Login error:', error.message);
//     yield put(loginFailure(error.message));
//   }
// }
// {
//   console.log('loginRequest.type', loginRequest.type);
// }
// export default function* authSaga() {
//   {
//     console.log('triggered root');
//   }
//   yield takeLatest(registerRequest.type, handleRegister);
//   yield takeLatest(loginRequest.type, handleLogin);
// }
