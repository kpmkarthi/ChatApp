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
  fetchMessagesRequest,
  sendMessageRequest,
  retryFailedMessage,
  Message,
} from '../store/slices/messageSlice';
import { markAsRead } from '../store/slices/chatSlice';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, contactName = 'General' } = route.params;
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const dispatch = useDispatch();
  const { messages, pendingMessages } = useSelector(
    (state: RootState) => state.messages,
  );
  const { user } = useSelector((state: RootState) => state.auth);
  // const { isConnected } = useSelector((state: RootState) => state.network);

  // Combine fetched messages with pending messages for the current chat
  const chatMessages = [
    ...(messages[chatId] || []),
    ...pendingMessages.filter(msg => msg.chatId === chatId),
  ].sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp for chronological order

  useEffect(() => {
    // Set navigation header title
    navigation.setOptions({
      title: contactName || 'General',
    });
    dispatch(fetchMessagesRequest(chatId));
  }, [dispatch, chatId, contactName, navigation]);

  useFocusEffect(
    useCallback(() => {
      dispatch(markAsRead(chatId));
    }, [dispatch, chatId]),
  );

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages.length]);

  const handleTyping = (text: string) => {
    setInputText(text);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // if (!isConnected) {
    //   Alert.alert(
    //     'No Connection',
    //     'You are offline. Message will be sent when connection is restored.',
    //     [
    //       { text: 'Cancel', style: 'cancel' },
    //       {
    //         text: 'Send Anyway',
    //         onPress: () => send(),
    //       },
    //     ],
    //   );
    // } else {
    send();
    // }
  };

  const send = () => {
    if (user && inputText.trim()) {
      dispatch(
        sendMessageRequest({
          chatId,
          text: inputText.trim(),
          senderId: user.id,
        }),
      );
      setInputText('');
      Keyboard.dismiss();
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
      default:
        return '#999';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    const canRetry = isMyMessage && item.status === 'failed';

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
        onPress={canRetry ? () => handleRetryMessage(item) : undefined}
        disabled={!canRetry}
        activeOpacity={canRetry ? 0.7 : 1}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.theirBubble,
            item.status === 'failed' && styles.failedBubble,
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
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  messagesList: { paddingVertical: 8 },
  messageContainer: { paddingHorizontal: 16, paddingVertical: 4 },
  myMessage: { alignItems: 'flex-end' },
  theirMessage: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
  },
  myBubble: { backgroundColor: '#075E54', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  failedBubble: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
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
});

export default ChatRoomScreen;
