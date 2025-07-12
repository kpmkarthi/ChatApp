import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '../../App';
import { loginSuccess } from '../store/slices/authSlice';

// Use the correct screen name for navigation
// If your chat list screen is named differently, update 'ChatList'
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 Starting dummy login...');

      // Simple dummy login - just use the username
      const username = email.trim();

      console.log('✅ Dummy login successful!');
      console.log('Username:', username);

      // Dispatch login success with dummy user
      dispatch(
        loginSuccess({
          user: {
            uid: username,
            email: username,
            displayName: username,
          },
          profile: {},
        }),
      );

      console.log('🚀 Navigating to chat list...');
      navigation.replace('ChatList');
    } catch (error: any) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#075E54" barStyle="light-content" />
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome to Chat App</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  innerContainer: { padding: 24, alignItems: 'center' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#075E54',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButton: {
    backgroundColor: '#128C7E',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;
