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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../../App';
import { RootState } from '../store/store';
import {
  fetchMessagesRequest,
  sendMessageRequest,
  Message,
} from '../store/slices/messageSlice';
import { markAsRead } from '../store/slices/chatSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC<Props> = ({ route }) => {
  const { chatId, contactName } = route.params;
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [shouldScrollToEnd, setShouldScrollToEnd] = useState(false);

  const dispatch = useDispatch();
  const { messages, loading } = useSelector(
    (state: RootState) => state.messages,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const { isConnected } = useSelector((state: RootState) => state.network);

  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    dispatch(fetchMessagesRequest(chatId));
    // Mark chat as read when entering the chat room
    dispatch(markAsRead(chatId));
  }, [dispatch, chatId]);

  // Also mark as read when component unmounts (user leaves chat)
  useEffect(() => {
    return () => {
      dispatch(markAsRead(chatId));
    };
  }, [dispatch, chatId]);

  // Scroll to end when new messages arrive or when component mounts
  useEffect(() => {
    if (chatMessages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages.length]);

  // Handle content size change to scroll to end
  const handleContentSizeChange = useCallback(() => {
    if (shouldScrollToEnd) {
      flatListRef.current?.scrollToEnd({ animated: true });
      setShouldScrollToEnd(false);
    }
  }, [shouldScrollToEnd]);

  const handleSendMessage = () => {
    if (!inputText.trim()) {
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'No Connection',
        'You are offline. Message will be sent when connection is restored.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Anyway', onPress: () => sendMessage() },
        ],
      );
      return;
    }

    sendMessage();
  };

  const sendMessage = () => {
    if (user) {
      dispatch(
        sendMessageRequest({
          chatId,
          text: inputText.trim(),
          senderId: user.id,
        }),
      );
      setInputText('');
      setShouldScrollToEnd(true);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return '🕐';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '❌';
      default:
        return '';
    }
  };

  const getMessageStatusColor = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return '#999';
      case 'sent':
        return '#999';
      case 'delivered':
        return '#34B7F1';
      case 'read':
        return '#34B7F1';
      case 'failed':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {formatTime(item.timestamp)}
            </Text>
            {isMyMessage && (
              <Text
                style={[
                  styles.messageStatus,
                  { color: getMessageStatusColor(item.status) },
                ]}
              >
                {getMessageStatusIcon(item.status)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>
        Start the conversation with {contactName}
      </Text>
    </View>
  );

  // Generate a unique key for each message to prevent React from reusing components
  const keyExtractor = useCallback((item: Message, index: number) => {
    return `${item.id}-${index}`;
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />

      {!isConnected && (
        <View style={styles.offlineBar}>
          <Text style={styles.offlineText}>
            You are offline. Messages will be sent when connection is restored.
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          chatMessages.length === 0 ? styles.emptyList : styles.messagesList
        }
        onContentSizeChange={handleContentSizeChange}
        removeClippedSubviews={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={21}
        getItemLayout={undefined} // Let FlatList calculate dynamically
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  offlineBar: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  messagesList: {
    paddingVertical: 8,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#075E54',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#666',
  },
  messageStatus: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
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
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#075E54',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
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
  },
});

export default ChatRoomScreen;
