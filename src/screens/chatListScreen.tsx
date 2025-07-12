import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../../App';
import { RootState } from '../store/store';
import {
  fetchChatsRequest,
  fetchGlobalChatroomsRequest,
  Chat,
  updatePendingCount,
} from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPendingCountsRef = useRef<Record<string, number>>({});

  const {
    chats = [],
    globalChatrooms = [],
    loading = false,
  } = useSelector((state: RootState) => state.chats || {});
  const user = useSelector((state: RootState) => state.auth?.user || null);
  const { isConnected } = useSelector((state: RootState) => state.network);
  const { pendingMessages } = useSelector((state: RootState) => state.messages);

  const allChats: Chat[] = useMemo(
    () => [...globalChatrooms, ...chats],
    [globalChatrooms, chats],
  );

  // Calculate pending message counts for each chat - optimized to prevent infinite loops
  useEffect(() => {
    const pendingCounts: Record<string, number> = {};

    pendingMessages.forEach(message => {
      if (!pendingCounts[message.chatId]) {
        pendingCounts[message.chatId] = 0;
      }
      pendingCounts[message.chatId]++;
    });

    // Only update if counts have actually changed
    const allChatIds = new Set([
      ...chats.map(c => c.id),
      ...globalChatrooms.map(c => c.id),
    ]);

    allChatIds.forEach(chatId => {
      const newCount = pendingCounts[chatId] || 0;
      const lastCount = lastPendingCountsRef.current[chatId] || 0;

      if (newCount !== lastCount) {
        dispatch(updatePendingCount({ chatId, pendingCount: newCount }));
        lastPendingCountsRef.current[chatId] = newCount;
      }
    });

    // Clear counts for chats that no longer exist
    Object.keys(lastPendingCountsRef.current).forEach(chatId => {
      if (!allChatIds.has(chatId)) {
        delete lastPendingCountsRef.current[chatId];
      }
    });
  }, [pendingMessages, dispatch]); // Removed chats and globalChatrooms from dependencies

  useEffect(() => {
    if (user?.email) {
      dispatch(fetchChatsRequest());
      dispatch(fetchGlobalChatroomsRequest());
    }
  }, [dispatch, user?.email]);

  // Polling for real-time updates
  useEffect(() => {
    if (!user?.email) return;
    intervalRef.current = setInterval(() => {
      dispatch(fetchChatsRequest());
      dispatch(fetchGlobalChatroomsRequest());
    }, 5000); // every 5 seconds
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [dispatch, user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (user?.email) {
        dispatch(fetchChatsRequest());
        dispatch(fetchGlobalChatroomsRequest());
      }
    }, [dispatch, user?.email]),
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                onPress: () => {
                  dispatch(logout());
                  navigation.replace('Login');
                },
              },
            ]);
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, dispatch]);

  const onRefresh = useCallback(() => {
    if (user?.email) {
      dispatch(fetchChatsRequest());
      dispatch(fetchGlobalChatroomsRequest());
    }
  }, [dispatch, user?.email]);

  const handleChatPress = useCallback(
    (chat: Chat) => {
      navigation.navigate('ChatRoom', {
        chatId: chat.id,
        contactName: chat.contactName,
      });
    },
    [navigation],
  );

  // WhatsApp-style time formatting
  const formatTime = useCallback((timestamp: number) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now.getTime() - messageTime.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInMinutes < 1) return 'now';
    if (diffInHours < 1) return `${Math.floor(diffInMinutes)} min ago`;
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffInDays < 2) return 'yesterday';
    return messageTime.toLocaleDateString();
  }, []);

  const renderChatItem = useCallback(
    ({ item }: { item: Chat }) => (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {item.contactName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.contactName} {item.type === 'global' ? '🌍' : ''}
            </Text>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={styles.messageContainer}>
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || 'No messages yet'}
            </Text>
            <View style={styles.badgeContainer}>
              {/* Unread message badge */}
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
              {/* Pending message badge (when offline) */}
              {!isConnected && item.pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingCount}>
                    {item.pendingCount > 99 ? '99+' : item.pendingCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleChatPress, formatTime, isConnected],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chats yet</Text>
        <Text style={styles.emptySubtext}>
          Start a conversation to see it here
        </Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />

      {/* Offline indicator */}
      {!isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            📡 You're offline - Messages will be sent when connection is
            restored
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.displayName || user?.uid || 'Guest'}!
        </Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? '#25D366' : '#f44336' },
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      <FlatList
        data={Array.isArray(allChats) ? allChats : []}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          allChats.length === 0 ? styles.emptyList : styles.chatList
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={['#075E54']}
            tintColor="#075E54"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  offlineBar: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: { fontSize: 16, fontWeight: '600', color: '#333', flex: 1 },
  connectionStatus: { flexDirection: 'row', alignItems: 'center' },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: { fontSize: 12, color: '#666' },
  chatList: { paddingVertical: 8 },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    minHeight: 72,
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 78,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#075E54',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chatInfo: { flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  timestamp: { fontSize: 12, color: '#666' },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: { fontSize: 14, color: '#666', flex: 1 },
  unreadMessage: { color: '#333', fontWeight: '500' },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pendingCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyList: { flexGrow: 1 },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineEmptyText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
  },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6 },
  logoutText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});

export default ChatListScreen;
