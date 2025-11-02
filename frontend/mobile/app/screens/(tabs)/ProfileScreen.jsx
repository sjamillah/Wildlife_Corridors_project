import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';

const ProfileScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  
  const userInfo = {
    name: 'John Ranger',
    email: 'john.ranger@wildlifeprotection.org',
    role: 'Senior Wildlife Ranger',
    badge: 'WR-2024-001',
  };

  const stats = [
    { label: 'Patrols', value: 156, icon: 'walk' },
    { label: 'Alerts', value: 89, icon: 'alert-circle' },
    { label: 'Reports', value: 23, icon: 'file-document' },
  ];

  const menuItems = [
    { id: 'edit', title: 'Edit Profile', icon: 'account-edit' },
    { id: 'security', title: 'Security', icon: 'shield-lock' },
    { id: 'data', title: 'Data & Storage', icon: 'database' },
    { id: 'help', title: 'Help & Support', icon: 'help-circle' },
    { id: 'about', title: 'About', icon: 'information' },
  ];

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

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: BRAND_COLORS.BORDER_MEDIUM, true: BRAND_COLORS.PRIMARY }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
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
          onPress={() => router.push('/screens/auth/SignInScreen')}
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
