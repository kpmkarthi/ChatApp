import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../../App';
import { RootState } from '../store/store';
import {
  sendMessageRequest,
  retryFailedMessage,
  Message,
  fetchMessagesSuccess,
} from '../store/slices/messageSlice';
import { markAsRead } from '../store/slices/chatSlice';
import { useFocusEffect } from '@react-navigation/native';
import { getDatabase } from '@react-native-firebase/database';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, contactName = 'General' } = route.params;
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const dispatch = useDispatch();
  const { messages, pendingMessages } = useSelector(
    (state: RootState) => state.messages,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { isConnected } = useSelector((state: RootState) => state.network);

  // Get confirmed messages from Firebase and pending messages for this chat
  const confirmedMessages = (messages[chatId] || [])
    .map(msg => ({
      id: String(msg.id || ''),
      text: String(msg.text || ''),
      senderId: String(msg.senderId || ''),
      timestamp: Number(msg.timestamp || 0),
      status: msg.status || 'sent',
      chatId: String(msg.chatId || ''),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const chatPendingMessages = pendingMessages
    .filter(msg => msg.chatId === chatId)
    .map(msg => ({
      id: String(msg.id || ''),
      text: String(msg.text || ''),
      senderId: String(msg.senderId || ''),
      timestamp: Number(msg.timestamp || 0),
      status: 'pending' as const,
      chatId: String(msg.chatId || ''),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Combine confirmed and pending messages
  const chatMessages = [...confirmedMessages, ...chatPendingMessages].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  useEffect(() => {
    navigation.setOptions({
      title: contactName || 'General',
    });
  }, [contactName, navigation]);

  // Real-time Firebase listener for messages
  useEffect(() => {
    const ref = getDatabase().ref(`messages/${chatId}`);
    const onValueChange = ref.on('value', snapshot => {
      const data = snapshot.val() || {};
      const msgs = Object.values(data) as Message[];
      dispatch(fetchMessagesSuccess({ chatId, messages: msgs }));
    });
    return () => ref.off('value', onValueChange);
  }, [chatId, dispatch]);

  // Mark messages as read when entering chat room
  useFocusEffect(
    useCallback(() => {
      // Mark as read immediately when entering the chat
      dispatch(markAsRead(chatId));

      // Also mark as read when messages are loaded
      if (confirmedMessages.length > 0) {
        dispatch(markAsRead(chatId));
      }
    }, [dispatch, chatId, confirmedMessages.length]),
  );

  // Enhanced auto-scroll functionality
  useEffect(() => {
    if (chatMessages.length > 0 && isNearBottom) {
      // Small delay to ensure the message is rendered
      const timer = setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages.length, isNearBottom]);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Auto-scroll when keyboard appears
        setTimeout(() => {
          if (flatListRef.current && chatMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 300);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [chatMessages.length]);

  // Handle scroll events to determine if user is near bottom
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    setIsNearBottom(isCloseToBottom);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && chatMessages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages.length]);

  const handleTyping = (text: string) => {
    setInputText(text);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    send();
  };

  const send = () => {
    if (user && inputText.trim()) {
      dispatch(
        sendMessageRequest({
          chatId,
          text: inputText.trim(),
          senderId: user.uid, // This is the username (e.g., "kali")
        }),
      );
      setInputText('');
      Keyboard.dismiss();

      // Force scroll to bottom when sending message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const handleRetryMessage = (message: Message) => {
    Alert.alert('Retry Message', 'Do you want to resend this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retry',
        onPress: () =>
          dispatch(
            retryFailedMessage({
              messageId: message.id,
              chatId: message.chatId,
            }),
          ),
      },
    ]);
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '';
    }
  };

  const getMessageStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'sent':
        return '#999';
      case 'failed':
        return '#f44336';
      case 'pending':
        return '#FF9800';
      default:
        return '#999';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    try {
      // Validate message data
      if (!item || !item.text) {
        console.warn('⚠️ Invalid message data:', item);
        return (
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>Invalid message</Text>
          </View>
        );
      }

      // Create a safe copy of the message to avoid read-only issues
      const message = {
        id: String(item.id || ''),
        text: String(item.text || ''),
        senderId: String(item.senderId || ''),
        timestamp: Number(item.timestamp || 0),
        status: item.status || 'sent',
        chatId: String(item.chatId || ''),
      };

      // For dummy login, user.uid is the current username (e.g., "star")
      // message.senderId is the username who sent the message (e.g., "kali")
      const isMyMessage = message.senderId === user?.uid;
      const canRetry =
        isMyMessage &&
        (message.status === 'failed' || message.status === 'pending');

      // Show "You" for my messages, sender name for others
      const senderName = isMyMessage ? 'You' : message.senderId || 'Unknown';
      const avatarColor = isMyMessage ? '#075E54' : '#25D366';

      // Get the text to use for avatar letter with proper null checks
      const avatarText = isMyMessage
        ? user?.displayName || user?.uid || 'Y'
        : message.senderId || 'U';

      const avatarLetter = avatarText.charAt(0).toUpperCase();

      return (
        <TouchableOpacity
          style={[
            styles.messageRow,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
          onPress={canRetry ? () => handleRetryMessage(message) : undefined}
          disabled={!canRetry}
          activeOpacity={canRetry ? 0.7 : 1}
        >
          {/* Avatar for received messages (left) */}
          {!isMyMessage && (
            <View
              style={[
                styles.avatar,
                { backgroundColor: avatarColor, marginRight: 0 },
              ]}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          )}
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={[
                styles.messageBubble,
                isMyMessage ? styles.myBubble : styles.theirBubble,
                message.status === 'failed' && styles.failedBubble,
                message.status === 'pending' && styles.pendingBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText,
                ]}
              >
                {message.text}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    isMyMessage
                      ? styles.myMessageTime
                      : styles.theirMessageTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
                {isMyMessage && (
                  <Text
                    style={[
                      styles.messageStatus,
                      { color: getMessageStatusColor(message.status) },
                    ]}
                  >
                    {getMessageStatusIcon(message.status)}
                  </Text>
                )}
              </View>
            </View>
          </View>
          {/* Avatar for my messages (right) */}
          {isMyMessage && (
            <View
              style={[
                styles.avatar,
                { backgroundColor: avatarColor, marginLeft: 0 },
              ]}
            >
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    } catch (error) {
      return (
        <View style={styles.messageRow}>
          <Text style={styles.messageText}>Error rendering message</Text>
        </View>
      );
    }
  };

  // Show loading state if user is not available
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#075E54" barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
          <Text style={styles.emptySubtext}>Please wait</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation in {contactName || 'this chat'}
            </Text>
          </View>
        }
        contentContainerStyle={
          chatMessages.length === 0 ? styles.emptyList : styles.messagesList
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={handleTyping}
          multiline
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  offlineBar: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    alignItems: 'center',
  },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  messagesList: { paddingVertical: 8 },
  messageContainer: { paddingHorizontal: 16, paddingVertical: 4 },
  myMessage: {
    alignItems: 'flex-end',
    marginRight: 0,
    marginLeft: 20,
    flexDirection: 'row',
  },
  theirMessage: {
    alignItems: 'flex-start',
    marginRight: 2,
    marginLeft: 0,
    flexDirection: 'row',
  },
  messageBubble: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    flexShrink: 1,
    marginHorizontal: 4,
  },
  myBubble: { backgroundColor: '#075E54', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  failedBubble: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  pendingBubble: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  messageFooter: { flexDirection: 'row', marginTop: 4 },
  messageTime: { fontSize: 11, marginRight: 4 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  theirMessageTime: { color: '#666' },
  messageStatus: { fontSize: 12 },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#075E54',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyList: { flexGrow: 1 },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // marginHorizontal: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  senderName: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
});

export default ChatRoomScreen;
