import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Icon from './Icon';
import { BRAND_COLORS, STATUS_COLORS } from '../../constants/Colors';
import { WILDLIFE_ICONS, ICON_SIZES } from '../../constants/Icons';
import { useAlerts } from '../../contexts/AlertsContext';

export function LogoHeader() {
  const { alerts } = useAlerts();
  const activeAlertCount = alerts?.filter(a => a.active).length || 3;
  const isOnline = true; // TODO: Connect to actual network status
  
  const handleNotificationPress = () => {
    router.push('/screens/(tabs)/AlertsScreen');
  };
  
  return (
    <View style={styles.header}>
      {/* Logo - Larger and Clearer */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/Aureynx_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
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
    paddingVertical: 14,
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
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 160,
    height: 50,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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

