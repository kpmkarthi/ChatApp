import React, { useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// files
import AuthScreen from '../auth/authScreen';
import DashboardScreen from '../screens/dashboard';

const Stack = createStackNavigator();

interface User {
  email: string;
  password: string;
  isAdmin?: boolean;
}

const LoadingScreen = () => (
  <LinearGradient
    colors={['#e8dcf0', '#d4c2e8', '#c7b0df']}
    style={styles.loadingContainer}
  >
    <ActivityIndicator size="large" color="#cf53f5" />
  </LinearGradient>
);

const AppStack = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState('Auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const user: User = JSON.parse(userData);
        setCurrentUser(user);
        setInitialRouteName('DashBoard');
      } else {
        setInitialRouteName('Auth');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRouteName('Auth');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen
          name="DashBoard"
          //@ts-ignore
          component={DashboardScreen}
          options={{
            cardStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
          }}
          initialParams={{
            userEmail: currentUser?.email || '',
            isAdmin: currentUser?.isAdmin || false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppStack;
