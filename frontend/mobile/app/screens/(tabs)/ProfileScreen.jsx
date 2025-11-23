import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { rangers, auth as authService, alerts, reports } from '@services';
import gpsTracking from '@services/gpsTracking';
import { safeNavigate } from '@utils';

const TOKEN_KEY = 'authToken'; // Must match auth.js
const REFRESH_TOKEN_KEY = 'refreshToken'; // Must match auth.js
const USER_PROFILE_KEY = 'userProfile'; // Must match auth.js
const RANGER_PROFILE_KEY = '@wildlife_ranger_profile';

const ProfileScreen = () => {
  const [notifications, setNotifications] = useState(false); // Will be loaded from backend
  const [locationSharing, setLocationSharing] = useState(false); // Will be loaded from backend
  
  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // First check if user is authenticated
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
          // Not authenticated, use defaults
          setNotifications(true);
          setLocationSharing(true);
          return;
        }

        // Try to fetch from server, fallback to cached profile
        const user = await authService.fetchProfile().catch(async () => {
          // If fetch fails, try cached profile
          return await authService.getProfile();
        });
        
        if (user) {
          // Load notification preferences (default to true if not set)
          if (user.notification_preferences !== undefined) {
            setNotifications(user.notification_preferences.enabled !== false);
          } else {
            setNotifications(true); // Default to enabled
          }
          // Load location sharing preference (default to true if not set)
          if (user.location_sharing !== undefined) {
            setLocationSharing(user.location_sharing);
          } else {
            setLocationSharing(true); // Default to enabled
          }
        } else {
          // No user data, use defaults
          setNotifications(true);
          setLocationSharing(true);
        }
      } catch (error) {
        // Silently fail and use defaults - prevents crashes in Expo Go
        if (__DEV__) {
          console.warn('Failed to load settings (non-critical):', error.message);
        }
        setNotifications(true);
        setLocationSharing(true);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings to backend
  const saveSettings = async (notifValue, locationValue) => {
    try {
      // Update user preferences via profile update
      await authService.updateProfile({
        notification_preferences: { enabled: notifValue },
        location_sharing: locationValue,
      });
    } catch (error) {
      console.warn('Failed to save settings:', error);
      // Settings will still be updated locally
    }
  };
  const [onDutyStatus, setOnDutyStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: 'Loading...',
    email: '',
    role: 'Ranger',
    badge: '',
  });

  const [rangerProfile, setRangerProfile] = useState(null);

  // Load user and ranger profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile from auth (fetch fresh from backend)
      const user = await authService.fetchProfile().catch(async () => {
        // Fallback to cached profile if fetch fails
        return await authService.getProfile();
      });
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      setUserInfo({
        name: user.name || user.email,
        email: user.email,
        role: user.role || 'Ranger',
        badge: '',
      });

      // Get ranger profile
      const rangersData = await rangers.getAll({ user: user.id });
      if (rangersData.results && rangersData.results.length > 0) {
        const ranger = rangersData.results[0];
        setRangerProfile(ranger);
        setOnDutyStatus(ranger.current_status === 'on_duty');
        setUserInfo(prev => ({
          ...prev,
          badge: ranger.badge_number,
          role: ranger.team_name || 'Ranger',
        }));
        
        // Cache ranger profile
        await AsyncStorage.setItem(RANGER_PROFILE_KEY, JSON.stringify(ranger));
        
        // Fetch dynamic stats
        try {
          // Get patrols count (routes/logs)
          const routesData = await rangers.routes.getAll({ ranger: ranger.id }).catch(() => ({ results: [] }));
          const logsData = await rangers.logs.getAll({ ranger: ranger.id }).catch(() => ({ results: [] }));
          const patrolsCount = (routesData.results || routesData || []).length + (logsData.results || logsData || []).length;
          
          // Get alerts count (created by this ranger)
          const alertsData = await alerts.getAll({ created_by: user.id }).catch(() => ({ results: [] }));
          const alertsCount = (alertsData.results || alertsData || []).length;
          
          // Get reports count
          const reportsData = await reports.getAll({ created_by: user.id }).catch(() => ({ results: [] }));
          const reportsCount = (reportsData.results || reportsData || []).length;
          
          setStats([
            { label: 'Patrols', value: patrolsCount, icon: 'walk' },
            { label: 'Alerts', value: alertsCount, icon: 'alert-circle' },
            { label: 'Reports', value: reportsCount, icon: 'file-document' },
          ]);
        } catch (statsError) {
          console.warn('Failed to fetch stats:', statsError);
          // Keep default stats if fetch fails
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Load from cache if available
      const cachedProfile = await AsyncStorage.getItem(RANGER_PROFILE_KEY);
      if (cachedProfile) {
        const ranger = JSON.parse(cachedProfile);
        setRangerProfile(ranger);
        setOnDutyStatus(ranger.current_status === 'on_duty');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle duty status
  const toggleDutyStatus = async (newStatus) => {
    if (!rangerProfile) {
      Alert.alert('Error', 'Ranger profile not found');
      return;
    }

    setUpdatingStatus(true);
    try {
      // Get current location
      const currentLocation = await gpsTracking.getCurrentLocation().catch(() => ({
        lat: 0,
        lon: 0,
      }));

      // Update ranger status on backend
      await rangers.patch(rangerProfile.id, {
        current_status: newStatus ? 'on_duty' : 'off_duty',
        last_active: new Date().toISOString(),
      });
      
      setOnDutyStatus(newStatus);
      
      // Start/stop GPS tracking
      if (newStatus) {
        await gpsTracking.startTracking();
        console.log('GPS tracking started');
      } else {
        await gpsTracking.stopTracking();
        console.log('GPS tracking stopped');
      }
      
      // Log status change with actual location
      await rangers.logs.create({
        log_type: newStatus ? 'patrol_start' : 'patrol_end',
        priority: 'low',
        title: newStatus ? 'Went on duty' : 'Went off duty',
        description: `Ranger ${newStatus ? 'started' : 'ended'} duty`,
        lat: currentLocation.lat,
        lon: currentLocation.lon,
      });

      Alert.alert(
        'Status Updated',
        `You are now ${newStatus ? 'ON DUTY' : 'OFF DUTY'}${newStatus ? '\n\nGPS tracking activated - your location will be shared every 5 minutes' : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update duty status: ' + error.message);
      setOnDutyStatus(!newStatus); // Revert
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [stats, setStats] = useState([
    { label: 'Patrols', value: 0, icon: 'walk' },
    { label: 'Alerts', value: 0, icon: 'alert-circle' },
    { label: 'Reports', value: 0, icon: 'file-document' },
  ]);

  const menuItems = [
    { id: 'edit', title: 'Edit Profile', icon: 'account-edit' },
    { id: 'security', title: 'Security', icon: 'shield-lock' },
    { id: 'data', title: 'Data & Storage', icon: 'database' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle' },
    { id: 'about', title: 'About', icon: 'information' },
  ];

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting logout...');
              // Call auth service logout (clears storage and notifies backend)
              await authService.logout();
              console.log('Logout successful, navigating to SignIn...');
              // Navigate to sign in screen with replace to clear navigation stack
              safeNavigate('/screens/auth/SignInScreen', { method: 'replace' });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={BRAND_COLORS.PRIMARY} />
      
      {/* Simple Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY} />
          </View>
        )}
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={32} color={BRAND_COLORS.SURFACE} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userRole}>{userInfo.role}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
            <Text style={styles.userBadge}>{userInfo.badge}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statBox}>
              <MaterialCommunityIcons name={stat.icon} size={24} color={BRAND_COLORS.PRIMARY} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Duty Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duty Status</Text>
          
          <View style={[styles.settingRow, styles.dutyStatusRow]}>
            <View style={styles.dutyStatusInfo}>
              <Text style={styles.dutyStatusLabel}>
                {onDutyStatus ? 'ON DUTY' : 'OFF DUTY'}
              </Text>
              <Text style={styles.dutyStatusSubtext}>
                {onDutyStatus ? 'Currently active in the field' : 'Not currently on patrol'}
              </Text>
            </View>
            {updatingStatus ? (
              <ActivityIndicator size="small" color={BRAND_COLORS.PRIMARY} />
            ) : (
              <Switch
                value={onDutyStatus}
                onValueChange={toggleDutyStatus}
                trackColor={{ false: '#d1d5db', true: '#10b981' }}
                thumbColor={onDutyStatus ? '#059669' : '#9ca3af'}
                disabled={!rangerProfile}
              />
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={(value) => {
                setNotifications(value);
                saveSettings(value, locationSharing);
              }}
              trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: BRAND_COLORS.PRIMARY }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Switch
              value={locationSharing}
              onValueChange={(value) => {
                setLocationSharing(value);
                saveSettings(notifications, value);
              }}
              trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: BRAND_COLORS.PRIMARY }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem}>
              <MaterialCommunityIcons name={item.icon} size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
              <Text style={styles.menuText}>{item.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={BRAND_COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleLogout}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS_COLORS.SUCCESS,
  },
  statusText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '400',
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  userBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: BRAND_COLORS.PRIMARY,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT,
  },
  dutyStatusRow: {
    backgroundColor: BRAND_COLORS.SURFACE,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dutyStatusInfo: {
    flex: 1,
  },
  dutyStatusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  dutyStatusSubtext: {
    fontSize: 13,
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  menuItem: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT,
  },
  signOutButton: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: STATUS_COLORS.ERROR,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: STATUS_COLORS.ERROR,
  },
});

export default ProfileScreen;
