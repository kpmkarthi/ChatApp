// 4. Network Hook (useNetworkStatus.ts)
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { setNetworkStatus } from '../store/slices/networkSlice';

export const useNetworkStatus = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setNetworkStatus(state.isConnected ?? false));
    });

    return unsubscribe;
  }, [dispatch]);
};
