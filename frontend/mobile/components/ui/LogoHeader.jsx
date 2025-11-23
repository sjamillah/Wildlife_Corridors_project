import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Icon from './Icon';
import { BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '@constants/Icons';
import { useAlerts } from '@contexts/AlertsContext';
import { auth as authService } from '@services';
import { useOfflineMode } from '@app/hooks';

export function LogoHeader({ title = 'Field Map' }) {
  const { alerts } = useAlerts();
  const { isOnline } = useOfflineMode();
  const activeAlertCount = alerts?.filter(a => a.active).length || 0;
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    role: 'Ranger',
    badge: '',
  });

  // Load user profile
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await authService.getProfile();
        setUserInfo({
          name: user.name || user.email || 'Ranger',
          role: user.role || 'Ranger',
          badge: user.badge_number || '',
        });
      } catch (error) {
        console.warn('Failed to load user info:', error);
        // Try to get from AsyncStorage as fallback
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const stored = await AsyncStorage.getItem('userProfile');
          if (stored) {
            const user = JSON.parse(stored);
            setUserInfo({
              name: user.name || user.email || 'Ranger',
              role: user.role || 'Ranger',
              badge: user.badge_number || '',
            });
          }
        } catch (_e) {
          // Silently fail
        }
      }
    };
    loadUserInfo();
  }, []);
  
  const handleNotificationPress = () => {
    router.push('/screens/(tabs)/AlertsScreen');
  };
  
  return (
    <View style={styles.header}>
      {/* Left Side: Logo */}
      <View style={styles.leftSection}>
        <Image 
          source={require('../../assets/images/Aureynx_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      {/* Center: User Info */}
      {userInfo.name && (
        <View style={styles.centerSection}>
          <Text style={styles.userName} numberOfLines={1}>
            {userInfo.name}
          </Text>
          <Text style={styles.userRole} numberOfLines={1}>
            {userInfo.role} {userInfo.badge ? `• ${userInfo.badge}` : ''}
          </Text>
        </View>
      )}
      
      {/* Right Side: Status and Notifications */}
      <View style={styles.rightSection}>
        {/* Online/Offline Status */}
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { 
            backgroundColor: isOnline ? STATUS_COLORS.SUCCESS : STATUS_COLORS.ERROR 
          }]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {/* Notification Bell */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Icon name={WILDLIFE_ICONS.NOTIFICATION} size={ICON_SIZES.xl} color={BRAND_COLORS.SURFACE} />
          {activeAlertCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {activeAlertCount > 9 ? '9+' : activeAlertCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 45,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  userName: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  userRole: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.9,
    textAlign: 'center',
  },
  rightSection: {
    flex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '700',
  },
  notificationButton: {
    position: 'relative',
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: STATUS_COLORS.ERROR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: BRAND_COLORS.PRIMARY,
  },
  notificationCount: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 10,
    fontWeight: '800',
  },
});

