import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationProp,
  ParamListBase,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

interface User {
  email: string;
  password: string;
  isAdmin?: boolean;
}

interface LocationInfo {
  ip: string;
  country: string;
  city?: string;
  regionName?: string;
  loading: boolean;
  error?: string;
}

interface DashboardScreenProps {
  route: {
    params: {
      userEmail: string;
      isAdmin: boolean;
    };
  };
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ route }) => {
  const { userEmail, isAdmin } = route.params;
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [locationInfo, setLocationInfo] = useState<LocationInfo>({
    ip: '',
    country: '',
    loading: true,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isFocused = useIsFocused();
  const getCurrentGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchLocationInfo = async () => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const locationResponse = await fetch(
        `http://ip-api.com/json/${ipAddress}`,
      );
      const locationData = await locationResponse.json();
      if (locationData.status === 'success') {
        setLocationInfo({
          ip: ipAddress,
          country: locationData.country,
          city: locationData.city,
          regionName: locationData.regionName,
          loading: false,
        });
      } else {
        setLocationInfo({
          ip: ipAddress,
          country: 'Unknown',
          loading: false,
          error: 'Failed to fetch location data',
        });
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
      setLocationInfo({
        ip: 'Unknown',
        country: 'Unknown',
        loading: false,
        error: 'Network error',
      });
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const allUsers: User[] = JSON.parse(usersData);
        setUsers(allUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch user data');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('currentUser');
            navigation.navigate('Auth');
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  const handleFetchUsers = () => {
    if (showUsers) {
      setShowUsers(false);
    } else {
      fetchAllUsers();
      setShowUsers(true);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <Icon name="person-circle-outline" size={24} color="#9b7bb8" />
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>
          {item.isAdmin ? 'Admin' : 'Regular User'}
        </Text>
      </View>
    </View>
  );

  useEffect(() => {
    fetchLocationInfo();
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#e8dcf0', '#d4c2e8', '#c7b0df']}
        style={styles.container}
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>{getCurrentGreeting()}!</Text>
              <Text style={styles.welcomeText}>
                {isAdmin ? 'Admin Dashboard' : 'Welcome back'}
              </Text>
              <Text style={styles.userEmail}>
                Hi{' '}
                {userEmail.includes('@')
                  ? userEmail.split('@')[0].charAt(0).toUpperCase() +
                    userEmail.split('@')[0].slice(1)
                  : userEmail.charAt(0).toUpperCase() + userEmail.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="log-out-outline" size={24} color="#9b7bb8" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Icon name="location-outline" size={24} color="#9b7bb8" />
              <Text style={styles.locationTitle}>Location Information</Text>
            </View>
            {locationInfo.loading ? (
              <ActivityIndicator size="small" color="#9b7bb8" />
            ) : (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>
                  <Text style={styles.locationLabel}>IP Address: </Text>
                  {locationInfo.ip}
                </Text>
                <Text style={styles.locationText}>
                  <Text style={styles.locationLabel}>Country: </Text>
                  {locationInfo.country}
                </Text>
                {locationInfo.city && (
                  <Text style={styles.locationText}>
                    <Text style={styles.locationLabel}>City: </Text>
                    {locationInfo.city}
                  </Text>
                )}
                {locationInfo.regionName && (
                  <Text style={styles.locationText}>
                    <Text style={styles.locationLabel}>Region: </Text>
                    {locationInfo.regionName}
                  </Text>
                )}
                {locationInfo.error && (
                  <Text style={styles.errorText}>
                    Error: {locationInfo.error}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.welcomeCard}>
              <Icon name="checkmark-circle" size={48} color="#9b7bb8" />
              <Text style={styles.welcomeTitle}>Login Successful!</Text>
              <Text style={styles.welcomeDescription}>
                {isAdmin
                  ? 'Welcome to the admin dashboard. You have access to all user management features.'
                  : 'You have successfully logged into your account. Welcome to your dashboard!'}
              </Text>
            </View>

            {/* Admin Section */}
            {isAdmin && (
              <View style={styles.adminSection}>
                <Text style={styles.sectionTitle}>Admin Controls</Text>
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={handleFetchUsers}
                  disabled={loadingUsers}
                >
                  <Icon name="people-outline" size={24} color="white" />
                  <Text style={styles.adminButtonText}>
                    {loadingUsers
                      ? 'Loading...'
                      : showUsers
                      ? 'Hide User Details'
                      : 'Fetch User Details'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Users List (Admin Only) */}
            {isAdmin && showUsers && (
              <View style={styles.usersSection}>
                <Text style={styles.sectionTitle}>All Users</Text>
                {users.length === 0 ? (
                  <Text style={styles.noUsersText}>No users found</Text>
                ) : (
                  <FlatList
                    data={users}
                    renderItem={renderUserItem}
                    keyExtractor={(item, index) => index.toString()}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#e8dcf0',
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  headerContent: {
    flex: 1,
    marginTop: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b5b95',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginTop: 30,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginLeft: 8,
  },
  locationInfo: {
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b5b95',
    marginBottom: 4,
  },
  locationLabel: {
    fontWeight: 'bold',
    color: '#4a3c6b',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    fontStyle: 'italic',
  },
  mainContent: {
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6b5b95',
    textAlign: 'center',
    lineHeight: 24,
  },
  adminSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  adminButton: {
    backgroundColor: '#cf53f5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  usersSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userRole: {
    fontSize: 12,
    color: '#6b5b95',
    fontStyle: 'italic',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#6b5b95',
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a3c6b',
    marginTop: 8,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b5b95',
    marginTop: 2,
  },
  recentActivityContainer: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  activityText: { color: 'grey' },
  activityTime: { color: 'grey' },
});

export default DashboardScreen;
