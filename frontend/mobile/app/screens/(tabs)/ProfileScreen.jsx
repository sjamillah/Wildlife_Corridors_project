import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { Card } from '../../../components/ui/Card';
import { LogoHeader } from '../../../components/ui/LogoHeader';
import { Button } from '../../../components/ui/Button';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';

const ProfileScreen = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  
  const handleThemeToggle = (value) => {
    toggleTheme();
  };

  const userInfo = {
    name: 'John Ranger',
    email: 'john.ranger@wildlifeprotection.org',
    role: 'Senior Wildlife Ranger',
    badge: 'WR-2024-001',
    joinDate: 'January 2024',
    avatar: null
  };

  const stats = {
    totalPatrols: 156,
    alertsResolved: 89,
    incidentsLogged: 23,
    hoursOnDuty: 2840
  };

  const menuItems = [
    { id: 'personal', icon: 'person.crop.circle', title: 'Personal Information', subtitle: 'Update your profile details' },
    { id: 'security', icon: 'lock.shield', title: 'Security Settings', subtitle: 'Password and authentication' },
    { id: 'preferences', icon: 'gearshape', title: 'App Preferences', subtitle: 'Customize your experience' },
    { id: 'data', icon: 'icloud.and.arrow.down', title: 'Data & Storage', subtitle: 'Manage offline data' },
    { id: 'help', icon: 'questionmark.circle', title: 'Help & Support', subtitle: 'Get assistance' },
    { id: 'about', icon: 'info.circle', title: 'About', subtitle: 'App version and info' }
  ];

  const handleMenuPress = (itemId) => {
    // Navigation or action based on menu item
    console.log(`Pressed ${itemId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LogoHeader />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <IconSymbol name="person.fill" size={32} color={BRAND_COLORS.SURFACE} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{userInfo.name}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{userInfo.role}</Text>
              <Text style={[styles.userBadge, { color: colors.textSecondary }]}>Badge: {userInfo.badge}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <IconSymbol name="pencil" size={16} color={STATUS_COLORS.SUCCESS} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.detailItem, { color: colors.textSecondary }]}>{userInfo.email}</Text>
            <Text style={[styles.detailItem, { color: colors.textSecondary }]}>Member since {userInfo.joinDate}</Text>
          </View>
        </Card>

        {/* Stats Cards - Redesigned */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.statCardNew, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: BRAND_COLORS.PRIMARY + '20' }]}>
                <IconSymbol name="map.fill" size={20} color={BRAND_COLORS.PRIMARY} />
              </View>
              <Text style={[styles.statNumberNew, { color: BRAND_COLORS.PRIMARY }]}>{stats.totalPatrols}</Text>
              <Text style={[styles.statLabelNew, { color: colors.textSecondary }]}>Patrols</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCardNew, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: STATUS_COLORS.SUCCESS + '20' }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={STATUS_COLORS.SUCCESS} />
              </View>
              <Text style={[styles.statNumberNew, { color: STATUS_COLORS.SUCCESS }]}>{stats.alertsResolved}</Text>
              <Text style={[styles.statLabelNew, { color: colors.textSecondary }]}>Resolved</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.statCardNew, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: BRAND_COLORS.ACCENT + '40' }]}>
                <IconSymbol name="doc.text.fill" size={20} color={BRAND_COLORS.ACCENT} />
              </View>
              <Text style={[styles.statNumberNew, { color: BRAND_COLORS.ACCENT }]}>{stats.incidentsLogged}</Text>
              <Text style={[styles.statLabelNew, { color: colors.textSecondary }]}>Incidents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCardNew, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: BRAND_COLORS.HIGHLIGHT + '30' }]}>
                <IconSymbol name="clock.fill" size={20} color={BRAND_COLORS.HIGHLIGHT} />
              </View>
              <Text style={[styles.statNumberNew, { color: BRAND_COLORS.HIGHLIGHT }]}>{stats.hoursOnDuty}</Text>
              <Text style={[styles.statLabelNew, { color: colors.textSecondary }]}>Hours</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Settings */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="bell" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: BRAND_COLORS.BORDER, true: STATUS_COLORS.SUCCESS }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="location" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Location Sharing</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: BRAND_COLORS.BORDER, true: STATUS_COLORS.SUCCESS }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="moon" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={handleThemeToggle}
              trackColor={{ false: BRAND_COLORS.BORDER, true: STATUS_COLORS.SUCCESS }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.textSecondary} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Auto Sync</Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: BRAND_COLORS.BORDER, true: STATUS_COLORS.SUCCESS }}
              thumbColor={BRAND_COLORS.SURFACE}
            />
          </View>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account & Settings</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name={item.icon} size={20} color={colors.textSecondary} />
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            onPress={() => console.log('Sync data')}
            variant="primary"
            style={styles.actionButton}
          >
            Sync Data
          </Button>
          <Button
            onPress={() => console.log('Backup settings')}
            variant="secondary"
            style={styles.actionButton}
          >
            Backup Settings
          </Button>
        </View>

        {/* Emergency Actions */}
        <Card style={styles.emergencyCard}>
          <Text style={[styles.emergencyTitle, { color: colors.text }]}>Emergency Actions</Text>
          <View style={styles.emergencyButtons}>
            <Button
              onPress={() => router.push('/screens/emergency/EmergencyContactScreen')}
              variant="warning"
              style={styles.emergencyButton}
            >
              Emergency Contact
            </Button>
            <Button
              onPress={() => router.push('/screens/emergency/PanicAlertScreen')}
              variant="danger"
              style={styles.emergencyButton}
            >
              Panic Alert
            </Button>
          </View>
        </Card>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            onPress={() => console.log('Sign out')}
            variant="secondary"
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userBadge: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statCardNew: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumberNew: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabelNew: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  settingsCard: {
    marginBottom: 16,
  },
  menuCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
  },
  signOutContainer: {
    alignItems: 'center',
  },
  signOutButton: {
    width: '60%',
  },
});

export default ProfileScreen;