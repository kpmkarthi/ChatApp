// src/config/firebase.ts
import { getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyALbWGCQh2TRa-Y1uaUdjgG3aZhDxHy5JY',
  authDomain: 'reactnative-chat-app.firebaseapp.com',
  databaseURL:
    'https://reactnative-chat-app-6cf43-default-rtdb.asia-southeast1.firebasedatabase.app/',
  projectId: 'reactnative-chat-app-6cf43',
  storageBucket: 'reactnative-chat-app.appspot.com',
  messagingSenderId: '29983463207',
  appId: '1:29983463207:android:6ef9434ad2b8684ea7fb02',
};
let app;
if (!getApps().length) {
  console.log(firebaseConfig);

  app = initializeApp(firebaseConfig);
}
// Initialize Firebase
// const app = initializeApp(firebaseConfig);

// Initialize Firebase Database
export const database = getDatabase(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

export default app;

// Note: Replace the config values with your actual Firebase project configuration
// You can find these values in your Firebase Console > Project Settings > General > Your apps
