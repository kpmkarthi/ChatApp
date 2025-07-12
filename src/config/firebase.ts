// src/config/firebase.ts
import { getDatabase } from '@react-native-firebase/database';
import auth from '@react-native-firebase/auth';

// For React Native Firebase, we don't need to initialize the app manually
// It's automatically initialized when you install the package

// Initialize Firebase Database
export const database = getDatabase();

// Initialize Firebase Auth
export const firebaseAuth = auth();

export default { database, auth: firebaseAuth };

// Note: React Native Firebase automatically uses the google-services.json file
// Make sure you have the correct google-services.json file in your android/app/ directory
