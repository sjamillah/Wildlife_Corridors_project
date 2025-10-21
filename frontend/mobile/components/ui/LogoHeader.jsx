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
  const lastSyncTime = '2m ago'; // TODO: Connect to actual sync status
  
  const handleNotificationPress = () => {
    router.push('/screens/(tabs)/AlertsScreen');
  };
  
  return (
    <View style={styles.header}>
      {/* Logo on Left */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/Aureynx_Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      {/* Status Row on Right */}
      <View style={styles.statusRow}>
        {/* Connection Status */}
        <View style={styles.statusItem}>
          <View style={[styles.statusDot, { 
            backgroundColor: isOnline ? STATUS_COLORS.SUCCESS : STATUS_COLORS.ERROR 
          }]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        
        {/* Sync Status */}
        <View style={styles.statusItem}>
          <Icon name={WILDLIFE_ICONS.SYNC} size={ICON_SIZES.sm} color="#FFF9F3" />
          <Text style={styles.statusText}>{lastSyncTime}</Text>
        </View>
        
        {/* Notification Bell */}
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Icon name={WILDLIFE_ICONS.NOTIFICATION} size={ICON_SIZES.lg} color="#FFF9F3" />
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
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 140,
    height: 45,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF9F3',
    fontSize: 13,
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: STATUS_COLORS.ERROR,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

