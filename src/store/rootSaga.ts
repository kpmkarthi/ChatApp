import { all, fork } from 'redux-saga/effects';
import { authSaga } from './sagas/authSaga';
import { messageSaga } from './sagas/messageSaga';
import { chatSaga } from './sagas/chatsaga';

// import { networkSaga } from './sagas/networkSaga';
console.log('in');

export function* rootSaga() {
  console.log('out');

  yield all([fork(authSaga), fork(messageSaga), fork(chatSaga)]);
}
