import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';

const ProfileScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  
  const userInfo = {
    name: 'John Ranger',
    email: 'john.ranger@wildlifeprotection.org',
    role: 'Senior Wildlife Ranger',
    badge: 'WR-2024-001',
    joinDate: 'January 2024',
  };

  const stats = [
    { label: 'Patrols', value: 156, color: BRAND_COLORS.PRIMARY },
    { label: 'Resolved', value: 89, color: STATUS_COLORS.SUCCESS },
    { label: 'Incidents', value: 23, color: BRAND_COLORS.ACCENT },
    { label: 'Hours', value: 2840, color: BRAND_COLORS.HIGHLIGHT },
  ];

  const recentActivity = [
    { id: 1, title: 'Resolved elephant conflict alert', time: '2 hours ago', emoji: '✅' },
    { id: 2, title: 'Completed patrol route Alpha', time: '5 hours ago', emoji: '🚶' },
    { id: 3, title: 'Logged wildlife sighting', time: '1 day ago', emoji: '🦁' },
    { id: 4, title: 'Updated GPS tracker battery', time: '2 days ago', emoji: '🔋' },
  ];

  const accountMenuItems = [
    { id: 'personal', title: 'Personal Information', subtitle: 'Update your profile details', icon: 'account-circle' },
    { id: 'security', title: 'Security Settings', subtitle: 'Password and authentication', icon: 'shield-lock' },
    { id: 'preferences', title: 'App Preferences', subtitle: 'Customize your experience', icon: 'cog' },
  ];

  const moreMenuItems = [
    { id: 'data', title: 'Data & Storage', subtitle: 'Manage offline data', icon: 'database' },
    { id: 'help', title: 'Help & Support', subtitle: 'Get assistance', icon: 'help-circle' },
    { id: 'about', title: 'About', subtitle: 'App version and info', icon: 'information' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Hero Header with Profile Info */}
      <View style={styles.heroHeader}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <MaterialCommunityIcons name="pencil" size={16} color={BRAND_COLORS.SURFACE} />
          </TouchableOpacity>
        </View>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={40} color={BRAND_COLORS.PRIMARY} />
          </View>
          
          {/* User Info */}
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userRole}>{userInfo.role}</Text>
          <Text style={styles.userBadge}>Badge: {userInfo.badge}</Text>
          
          {/* Divider */}
          <View style={styles.headerDivider} />
          
          {/* Contact Info */}
          <Text style={styles.userEmail}>{userInfo.email}</Text>
          <Text style={styles.userJoinDate}>Member since {userInfo.joinDate}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards - Overlapping Header */}
        <View style={styles.statsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityLeft}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
            </View>
          ))}
        </View>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>QUICK SETTINGS</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingName}>Notifications</Text>
            <View style={styles.customSwitch}>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.SUCCESS }}
                thumbColor={BRAND_COLORS.SURFACE}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingName}>Location Sharing</Text>
            <View style={styles.customSwitch}>
              <Switch
                value={locationSharing}
                onValueChange={setLocationSharing}
                trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.SUCCESS }}
                thumbColor={BRAND_COLORS.SURFACE}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingName}>Dark Mode</Text>
            <View style={styles.customSwitch}>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.SUCCESS }}
                thumbColor={BRAND_COLORS.SURFACE}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <Text style={styles.settingName}>Auto Sync</Text>
            <View style={styles.customSwitch}>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: STATUS_COLORS.SUCCESS }}
                thumbColor={BRAND_COLORS.SURFACE}
                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
              />
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          {accountMenuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuCard}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* More Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MORE</Text>
          {moreMenuItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuCard}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.primaryActionButton}>
            <Text style={styles.primaryActionText}>Sync Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionText}>Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Section */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency Actions</Text>
          <View style={styles.emergencyButtons}>
            <TouchableOpacity 
              style={styles.emergencyContactButton}
              onPress={() => router.push('/screens/emergency/EmergencyContactScreen')}
            >
              <Text style={styles.emergencyContactText}>Emergency Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.panicButton}
              onPress={() => router.push('/screens/emergency/PanicAlertScreen')}
            >
              <Text style={styles.panicButtonText}>Panic Alert</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton}>
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
  heroHeader: {
    backgroundColor: BRAND_COLORS.PRIMARY,
    paddingTop: 56,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS_COLORS.SUCCESS,
  },
  onlineText: {
    color: BRAND_COLORS.SURFACE,
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 6,
  },
  profileContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
    marginBottom: 6,
  },
  userRole: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
  },
  userBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  headerDivider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userJoinDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  statsSection: {
    marginTop: -60,
    marginBottom: 24,
    paddingTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT_SECONDARY,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  activityCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  activityLeft: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  activityEmoji: {
    fontSize: 20,
  },
  settingCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  settingName: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND_COLORS.TEXT,
  },
  customSwitch: {
    // Wrapper for switch styling
  },
  menuCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(228, 227, 214, 0.3)',
  },
  menuLeft: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.TEXT_SECONDARY,
  },
  menuArrow: {
    fontSize: 18,
    color: BRAND_COLORS.TEXT_SECONDARY,
    fontWeight: '400',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.ACCENT,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.SURFACE,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
  emergencyCard: {
    backgroundColor: BRAND_COLORS.SURFACE,
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: STATUS_COLORS.ERROR,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
    marginBottom: 12,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyContactButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.HIGHLIGHT,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyContactText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  panicButton: {
    flex: 1,
    backgroundColor: STATUS_COLORS.ERROR,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  panicButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_COLORS.SURFACE,
  },
  signOutButton: {
    backgroundColor: BRAND_COLORS.SURFACE,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BRAND_COLORS.BORDER_LIGHT,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_COLORS.TEXT,
  },
});

export default ProfileScreen;
