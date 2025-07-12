# React Native Chat App with Real-time Messaging

A modern React Native chat application with real-time messaging capabilities using Firebase Realtime Database and Redux Saga for state management.

## Features

### 🗨️ Chat List Screen

- **Real-time conversation list** - Shows all conversations with live updates
- **Contact information** - Displays contact name, last message, and timestamp
- **Message status indicators** - Visual indicators for sent, delivered, read, and failed messages
- **Unread message counts** - Badge showing number of unread messages
- **Global and private chats** - Support for both private conversations and global chatrooms
- **Pull-to-refresh** - Refresh chat list with pull gesture
- **Offline support** - Works with network status detection

### 💬 Chat Room Screen

- **Real-time messaging** - Instant message delivery using Firebase Realtime Database
- **Message timestamps** - Each message shows when it was sent
- **Sender identification** - Clear indication of who sent each message
- **Message status** - Visual feedback for message delivery status
- **Typing indicators** - Shows when someone is typing
- **Auto-scroll** - Automatically scrolls to latest messages
- **Message retry** - Retry failed messages with tap gesture
- **Date separators** - Groups messages by date for better organization

### 🔄 Real-time Features

- **Firebase Integration** - Uses Firebase Realtime Database for real-time updates
- **Redux Saga** - Handles async operations and side effects
- **WebSocket Simulation** - Mock WebSocket for testing real-time functionality
- **Message Synchronization** - Ensures messages are properly synced across devices
- **Offline Queue** - Messages are queued when offline and sent when connection is restored

## Technical Implementation

### Architecture

- **React Native** - Cross-platform mobile development
- **Redux Toolkit** - State management with RTK Query
- **Redux Saga** - Side effect management for async operations
- **Firebase Realtime Database** - Real-time data synchronization
- **TypeScript** - Type-safe development

### Key Components

#### Firebase Service (`src/services/firebaseService.ts`)

- Handles all Firebase database operations
- Manages real-time listeners for messages and chats
- Provides methods for sending messages, fetching chats, and updating status

#### Message Saga (`src/store/sagas/messageSaga.ts`)

- Manages real-time message listening
- Handles message sending with optimistic updates
- Implements retry logic for failed messages
- Coordinates with Firebase service

#### Chat Saga (`src/store/sagas/chatsaga.ts`)

- Fetches and manages chat lists
- Handles real-time chat updates
- Manages global and private chatrooms

#### Mock Data Service (`src/services/mockDataService.ts`)

- Provides sample data for testing
- Simulates real-time message updates
- Includes MockWebSocket for testing without Firebase

### State Management

#### Message Slice (`src/store/slices/messageSlice.ts`)

```typescript
interface MessagesState {
  messages: Record<string, Message[]>;
  pendingMessages: Message[];
  loading: boolean;
  error: string | null;
  listeners: Record<string, boolean>;
}
```

#### Chat Slice (`src/store/slices/chatSlice.ts`)

```typescript
interface Chat {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  type: 'private' | 'global';
}
```

### Real-time Messaging Flow

1. **User sends message** → Optimistic update in UI
2. **Message sent to Firebase** → Real-time database update
3. **Other users receive message** → Firebase listener triggers
4. **UI updates automatically** → Redux state updated
5. **Message status updated** → Sent → Delivered → Read

### Firebase Database Structure

```
/messages/{chatId}/{messageId}
  - text: string
  - senderId: string
  - timestamp: number
  - status: 'sent' | 'delivered' | 'read' | 'failed'

/chats/{chatId}
  - participants: string[]
  - lastMessage: string
  - lastMessageTimestamp: number
  - type: 'private' | 'global'

/userChats/{userId}/{chatId}
  - true (indicates user is part of this chat)

/globalChats/{chatId}
  - contactName: string
  - lastMessage: string
  - lastMessageTimestamp: number
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- React Native CLI
- Firebase project setup

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Firebase**

   - Create a Firebase project
   - Enable Realtime Database
   - Update `src/config/firebase.ts` with your Firebase config

4. **Run the app**

   ```bash
   # iOS
   npx react-native run-ios

   # Android
   npx react-native run-android
   ```

### Firebase Setup

1. **Create Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Realtime Database

2. **Configure Database Rules**

   ```json
   {
     "rules": {
       "messages": {
         "$chatId": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       },
       "chats": {
         "$chatId": {
           ".read": "auth != null",
           ".write": "auth != null"
         }
       },
       "userChats": {
         "$userId": {
           ".read": "auth != null && auth.uid == $userId",
           ".write": "auth != null && auth.uid == $userId"
         }
       }
     }
   }
   ```

3. **Update Firebase Config**
   - Replace the config in `src/config/firebase.ts` with your project settings

## Testing

### Mock Data

The app includes a mock data service for testing without Firebase:

```typescript
import { mockWebSocket } from '../services/mockDataService';

// Use mock WebSocket instead of Firebase
mockWebSocket.listenToMessages(chatId, message => {
  // Handle incoming message
});
```

### Real-time Testing

- Send messages in different chat rooms
- Test offline functionality
- Verify message status updates
- Check real-time updates across multiple devices

## Features in Detail

### Message Status

- **Pending** - Message is being sent
- **Sent** - Message has been sent to server
- **Delivered** - Message has been delivered to recipient
- **Read** - Message has been read by recipient
- **Failed** - Message failed to send (retry available)

### Chat Types

- **Private Chats** - One-on-one conversations
- **Global Chats** - Group conversations open to all users

### Real-time Updates

- **Message delivery** - Instant message delivery
- **Typing indicators** - Shows when someone is typing
- **Online status** - Shows user online/offline status
- **Message status** - Real-time status updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
