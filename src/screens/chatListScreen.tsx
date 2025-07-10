import React, { useEffect, useCallback } from 'react';
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
} from '../store/slices/chatSlice';
// import { logout } from '../store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatList'>;

const ChatListScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();

  // ✅ Safe state access
  const {
    chats = [],
    globalChatrooms = [],
    loading = false,
  } = useSelector((state: RootState) => state.chats || {});
  const user = useSelector((state: RootState) => state.auth?.user || null);
  // const isConnected = useSelector(
  //   (state: RootState) => state.network?.isConnected ?? true,
  // );

  const allChats: Chat[] = [...globalChatrooms, ...chats];

  useEffect(() => {
    if (user?.email) {
      // dispatch(fetchChatsRequest());
      dispatch(fetchGlobalChatroomsRequest());
    }
  }, [dispatch, user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (user?.email) {
        // dispatch(fetchChatsRequest());
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
              { text: 'Logout', onPress: () => dispatch(logout()) },
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
      // dispatch(fetchChatsRequest());
      dispatch(fetchGlobalChatroomsRequest());
    }
  }, [dispatch, user?.email]);

  const handleChatPress = (chat: Chat) => {
    navigation.navigate('ChatRoom', {
      chatId: chat.id,
      contactName: chat.contactName,
    });
  };

  const formatTime = (timestamp: number) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffInHours < 48) return 'Yesterday';
    return messageTime.toLocaleDateString();
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
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
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No chats yet</Text>
      <Text style={styles.emptySubtext}>
        Start a conversation to see it here
      </Text>
      {/* {!isConnected && (
        <Text style={styles.offlineEmptyText}>
          You're offline. Chats will sync when connected.
        </Text>
      )} */}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      {/* {!isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            No internet connection - Data may be outdated
          </Text>
        </View>
      )} */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.username || 'Guest'}!
        </Text>
        <View style={styles.connectionStatus}>
          <View
            style={[
              styles.connectionDot,
              // { backgroundColor: isConnected ? '#4CAF50' : '#f44336' },
            ]}
          />
          <Text style={styles.connectionText}>
            {/* {isConnected ? 'Online' : 'Offline'} */}
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
