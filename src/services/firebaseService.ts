// src/services/firebaseService.ts
import {
  ref,
  push,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  serverTimestamp,
  get,
  set,
  update,
  DatabaseReference,
  DataSnapshot,
  Unsubscribe,
} from 'firebase/database';
import { database } from '../config/firebase';
import { Message } from '../store/slices/messageSlice';
import { Chat } from '../store/slices/chatSlice';

export interface FirebaseMessage {
  id?: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface FirebaseChat {
  id?: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: number;
  createdAt: number;
}

class FirebaseService {
  private messageListeners: Map<string, Unsubscribe> = new Map();
  private chatListeners: Map<string, Unsubscribe> = new Map();

  // Initialize user's chat list
  async initializeUserChats(userId: string): Promise<void> {
    try {
      const userChatsRef = ref(database, `userChats/${userId}`);
      const snapshot = await get(userChatsRef);

      if (!snapshot.exists()) {
        // Create initial empty chat list for new user
        await set(userChatsRef, {});
      }
    } catch (error) {
      console.error('Error initializing user chats:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    message: Omit<FirebaseMessage, 'id' | 'timestamp'>,
  ): Promise<string> {
    try {
      const messagesRef = ref(database, `messages/${message.chatId}`);
      const newMessageRef = push(messagesRef);

      const firebaseMessage: FirebaseMessage = {
        ...message,
        timestamp: Date.now(),
        status: 'sent',
      };

      await set(newMessageRef, firebaseMessage);

      // Update chat's last message
      await this.updateChatLastMessage(
        message.chatId,
        message.text,
        firebaseMessage.timestamp,
      );

      return newMessageRef.key!;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages for a specific chat
  listenToMessages(
    chatId: string,
    callback: (messages: Message[]) => void,
  ): void {
    const messagesRef = ref(database, `messages/${chatId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    const unsubscribe = onValue(messagesQuery, (snapshot: DataSnapshot) => {
      const messages: Message[] = [];

      snapshot.forEach(childSnapshot => {
        const messageData = childSnapshot.val() as FirebaseMessage;
        if (messageData) {
          messages.push({
            id: childSnapshot.key!,
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            text: messageData.text,
            timestamp: messageData.timestamp,
            status: messageData.status,
          });
        }
      });

      callback(messages);
    });

    this.messageListeners.set(chatId, unsubscribe);
  }

  // Stop listening to messages for a specific chat
  stopListeningToMessages(chatId: string): void {
    const unsubscribe = this.messageListeners.get(chatId);
    if (unsubscribe) {
      unsubscribe();
      this.messageListeners.delete(chatId);
    }
  }

  // Get user's chats
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const userChatsRef = ref(database, `userChats/${userId}`);
      const snapshot = await get(userChatsRef);

      if (!snapshot.exists()) {
        return [];
      }

      const chatIds = Object.keys(snapshot.val() || {});
      const chats: Chat[] = [];

      for (const chatId of chatIds) {
        const chatRef = ref(database, `chats/${chatId}`);
        const chatSnapshot = await get(chatRef);

        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.val() as FirebaseChat;

          // Get contact name (participant who is not the current user)
          const contactId = chatData.participants.find(p => p !== userId);
          const contactName = await this.getUserName(contactId || '');

          // Get unread count
          const unreadCount = await this.getUnreadCount(chatId, userId);

          chats.push({
            id: chatId,
            contactName,
            lastMessage: chatData.lastMessage || 'No messages yet',
            timestamp: chatData.lastMessageTimestamp || chatData.createdAt,
            unreadCount,
          });
        }
      }

      // Sort chats by last message timestamp (most recent first)
      return chats.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }
  }

  // Listen to user's chats
  listenToUserChats(userId: string, callback: (chats: Chat[]) => void): void {
    const userChatsRef = ref(database, `userChats/${userId}`);

    const unsubscribe = onValue(
      userChatsRef,
      async (snapshot: DataSnapshot) => {
        try {
          if (snapshot.exists()) {
            const chats = await this.getUserChats(userId);
            callback(chats);
          } else {
            callback([]);
          }
        } catch (error) {
          console.error('Error in chat listener:', error);
          callback([]);
        }
      },
    );

    this.chatListeners.set(userId, unsubscribe);
  }

  // Stop listening to user's chats
  stopListeningToUserChats(userId: string): void {
    const unsubscribe = this.chatListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.chatListeners.delete(userId);
    }
  }

  // Create a new chat
  async createChat(participants: string[]): Promise<string> {
    try {
      const chatsRef = ref(database, 'chats');
      const newChatRef = push(chatsRef);

      const chatData: FirebaseChat = {
        participants,
        lastMessage: '',
        lastMessageTimestamp: Date.now(),
        createdAt: Date.now(),
      };

      await set(newChatRef, chatData);

      // Add chat to each participant's chat list
      for (const participantId of participants) {
        const userChatRef = ref(
          database,
          `userChats/${participantId}/${newChatRef.key}`,
        );
        await set(userChatRef, true);
      }

      return newChatRef.key!;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Find or create chat between two users
  async findOrCreateChat(user1Id: string, user2Id: string): Promise<string> {
    try {
      // Check if a chat already exists between these users
      const user1ChatsRef = ref(database, `userChats/${user1Id}`);
      const user1ChatsSnapshot = await get(user1ChatsRef);

      if (user1ChatsSnapshot.exists()) {
        const chatIds = Object.keys(user1ChatsSnapshot.val() || {});

        for (const chatId of chatIds) {
          const chatRef = ref(database, `chats/${chatId}`);
          const chatSnapshot = await get(chatRef);

          if (chatSnapshot.exists()) {
            const chatData = chatSnapshot.val() as FirebaseChat;
            // Check if this is a direct chat between these two users
            if (
              chatData.participants.length === 2 &&
              chatData.participants.includes(user1Id) &&
              chatData.participants.includes(user2Id)
            ) {
              return chatId;
            }
          }
        }
      }

      // No existing chat found, create new one
      return await this.createChat([user1Id, user2Id]);
    } catch (error) {
      console.error('Error finding or creating chat:', error);
      throw error;
    }
  }

  // Update message status
  async updateMessageStatus(
    chatId: string,
    messageId: string,
    status: Message['status'],
  ): Promise<void> {
    try {
      const messageRef = ref(
        database,
        `messages/${chatId}/${messageId}/status`,
      );
      await set(messageRef, status);
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const readStatusRef = ref(database, `readStatus/${chatId}/${userId}`);
      await set(readStatusRef, Date.now());
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Private helper methods
  private async updateChatLastMessage(
    chatId: string,
    message: string,
    timestamp: number,
  ): Promise<void> {
    try {
      const chatRef = ref(database, `chats/${chatId}`);
      await update(chatRef, {
        lastMessage: message,
        lastMessageTimestamp: timestamp,
      });
    } catch (error) {
      console.error('Error updating chat last message:', error);
      throw error;
    }
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const userRef = ref(database, `users/${userId}/username`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : `User ${userId}`;
    } catch (error) {
      console.error('Error getting user name:', error);
      return `User ${userId}`;
    }
  }

  private async getUnreadCount(
    chatId: string,
    userId: string,
  ): Promise<number> {
    try {
      const readStatusRef = ref(database, `readStatus/${chatId}/${userId}`);
      const messagesRef = ref(database, `messages/${chatId}`);

      const [readStatusSnapshot, messagesSnapshot] = await Promise.all([
        get(readStatusRef),
        get(messagesRef),
      ]);

      if (!messagesSnapshot.exists()) {
        return 0;
      }

      const lastReadTimestamp = readStatusSnapshot.exists()
        ? readStatusSnapshot.val()
        : 0;
      let unreadCount = 0;

      messagesSnapshot.forEach(messageSnapshot => {
        const message = messageSnapshot.val() as FirebaseMessage;
        if (
          message &&
          message.timestamp > lastReadTimestamp &&
          message.senderId !== userId
        ) {
          unreadCount++;
        }
      });

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Clean up all listeners
  cleanup(): void {
    this.messageListeners.forEach(unsubscribe => unsubscribe());
    this.chatListeners.forEach(unsubscribe => unsubscribe());
    this.messageListeners.clear();
    this.chatListeners.clear();
  }
}

export const firebaseService = new FirebaseService();
export default firebaseService;
