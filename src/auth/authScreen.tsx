import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {
  NavigationProp,
  ParamListBase,
  useNavigation,
} from '@react-navigation/native';

interface User {
  email: string;
  password: string;
  isAdmin?: boolean;
}

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const users: User[] = JSON.parse(usersData);
        return users.some(
          user => user.email.toLowerCase() === email.toLowerCase(),
        );
      }
      return false;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  const saveUser = async (user: User): Promise<void> => {
    try {
      const usersData = await AsyncStorage.getItem('users');
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      users.push(user);
      await AsyncStorage.setItem('users', JSON.stringify(users));
    } catch (error) {
      console.error('Error saving user:', error);
      throw new Error('Failed to save user');
    }
  };

  const authenticateUser = async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      if (email.toLowerCase() === 'admin' && password === 'admin') {
        return { email: 'admin', password: 'admin', isAdmin: true };
      }

      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const users: User[] = JSON.parse(usersData);
        const user = users.find(
          user =>
            user.email.toLowerCase() === email.toLowerCase() &&
            user.password === password,
        );
        return user || null;
      }
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 6 characters long.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const userExists = await checkUserExists(email);

      if (userExists) {
        Alert.alert(
          'User Already Exists',
          'An account with this email already exists. Please login instead.',
        );
        setLoading(false);
        return;
      }

      const newUser: User = {
        email: email.toLowerCase(),
        password: password,
        isAdmin: false,
      };

      await saveUser(newUser);
      Alert.alert('Success', 'Account created successfully! Please login.');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsLogin(true);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        'Failed to create account. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email) {
      Alert.alert('Invalid Email', 'Please enter your email or username.');
      return;
    }

    if (!password) {
      Alert.alert('Invalid Password', 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const user = await authenticateUser(email, password);

      if (user) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));

        Alert.alert('Login Successful', 'Welcome back!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'DashBoard',
                    params: {
                      userEmail: user.email,
                      isAdmin: user.isAdmin || false,
                    },
                  },
                ],
              });
            },
          },
        ]);
      } else {
        Alert.alert('Login Failed', 'Invalid email/username or password.');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (): void => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const clearForm = (): void => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (): void => {
    setIsLogin(!isLogin);
    clearForm();
  };

  return (
    // <KeyboardAvoidingView
    //   style={styles.container}
    //   behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    // >
    <LinearGradient
      colors={['#e8dcf0', '#d4c2e8', '#c7b0df']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>

          <Text style={styles.subtitle}>
            {isLogin ? 'Login' : 'Sign up to get started'}
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={isLogin ? 'Email or Username' : 'Email'}
              placeholderTextColor={'grey'}
              value={email}
              onChangeText={setEmail}
              keyboardType={isLogin ? 'default' : 'email-address'}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholderTextColor={'grey'}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {!isLogin && (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholderTextColor={'grey'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={switchMode}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign up' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

          {isLogin && (
            <View style={styles.adminHint}>
              <Text style={styles.adminHintText}>
                Admin Login: Use 'admin' as both username and password
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
    // </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#cf53f5',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#cf53f5',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: 'black',
    backgroundColor: '#f9f9f9',
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  submitButton: {
    backgroundColor: '#cf53f5',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#666',
  },
  switchLink: {
    fontSize: 14,
    color: '#cf53f5',
    fontWeight: 'bold',
  },
  adminHint: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  adminHintText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AuthScreen;
