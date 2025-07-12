import { call, put, fork, take } from 'redux-saga/effects';
import { EventChannel, eventChannel } from 'redux-saga';
import NetInfo from '@react-native-community/netinfo';
import {
  setConnectionStatus,
  connectionLost,
  connectionRestored,
} from '../slices/networkSlice';

// Initial network status check
function* checkInitialNetworkStatus(): Generator<any, void, any> {
  try {
    const netInfo = yield call(NetInfo.fetch);
    const isConnected = netInfo.isConnected ?? false;
    console.log(
      '🌐 Initial network status:',
      isConnected ? 'Online' : 'Offline',
    );
    yield put(setConnectionStatus(isConnected));
  } catch (error) {
    console.error('Error checking initial network status:', error);
    yield put(setConnectionStatus(false));
  }
}

// Network monitoring channel
function createNetworkChannel(): EventChannel<boolean> {
  return eventChannel(emitter => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      console.log(
        '🌐 Network status changed:',
        isConnected ? 'Online' : 'Offline',
      );
      emitter(isConnected);
    });

    return () => unsubscribe();
  });
}

// Network monitoring saga
function* watchNetworkStatus(): Generator<any, void, any> {
  const channel = yield call(createNetworkChannel);

  try {
    while (true) {
      const isConnected = yield take(channel);
      yield put(setConnectionStatus(isConnected));

      if (isConnected) {
        yield put(connectionRestored());
      } else {
        yield put(connectionLost());
      }
    }
  } catch (error) {
    console.error('Network monitoring error:', error);
  }
}

export function* networkSaga(): Generator<any, void, any> {
  // Check initial network status
  yield call(checkInitialNetworkStatus);

  // Start network monitoring
  yield fork(watchNetworkStatus);
}
