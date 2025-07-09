import { all, fork } from 'redux-saga/effects';
import { authSaga } from './sagas/authSaga';
import { messageSaga } from './sagas/messageSaga';
import { networkSaga } from './sagas/networkSaga';

export function* rootSaga() {
  yield all([fork(authSaga), fork(messageSaga), fork(networkSaga)]);
}
