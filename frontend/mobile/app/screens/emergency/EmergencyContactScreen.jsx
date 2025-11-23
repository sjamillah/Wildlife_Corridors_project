import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@components/ui/Card';
import { Colors, BRAND_COLORS, STATUS_COLORS } from '@constants/Colors';
import { useTheme } from '@contexts/ThemeContext';

export default function EmergencyContactScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  const emergencyContacts = [
    {
      id: 1,
      name: 'Wildlife Emergency Hotline',
      number: '+254 123 456 789',
      type: 'Primary',
      available: '24/7',
      icon: 'phone-alert',
    },
    {
      id: 2,
      name: 'Anti-Poaching Unit',
      number: '+254 987 654 321',
      type: 'Security',
      available: '24/7',
      icon: 'shield-account',
    },
    {
      id: 3,
      name: 'Veterinary Services',
      number: '+254 555 123 456',
      type: 'Medical',
      available: '8AM - 6PM',
      icon: 'medical-bag',
    },
    {
      id: 4,
      name: 'Park Headquarters',
      number: '+254 444 987 654',
      type: 'Administration',
      available: '24/7',
      icon: 'office-building',
    },
  ];

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Emergency Contacts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Quick access to emergency contacts. Tap any contact to call immediately.
        </Text>

        {emergencyContacts.map((contact) => (
          <Card key={contact.id} style={styles.contactCard}>
            <TouchableOpacity 
              onPress={() => handleCall(contact.number)}
              style={styles.contactContent}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: STATUS_COLORS.ERROR + '20' }]}>
                <MaterialCommunityIcons name={contact.icon} size={28} color={STATUS_COLORS.ERROR} />
              </View>
              
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                <Text style={[styles.contactNumber, { color: BRAND_COLORS.PRIMARY }]}>{contact.number}</Text>
                <View style={styles.contactMeta}>
                  <Text style={[styles.contactType, { color: colors.textSecondary }]}>{contact.type}</Text>
                  <Text style={[styles.metaSeparator, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.contactAvailable, { color: STATUS_COLORS.SUCCESS }]}>{contact.available}</Text>
                </View>
              </View>
              
              <MaterialCommunityIcons name="phone" size={24} color={STATUS_COLORS.ERROR} />
            </TouchableOpacity>
          </Card>
        ))}

        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialCommunityIcons name="information" size={20} color={STATUS_COLORS.INFO} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>Important Information</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • All emergency lines are monitored 24/7{'\n'}
            • Response time: 5-15 minutes{'\n'}
            • GPS coordinates will be shared automatically{'\n'}
            • Keep your phone charged for emergencies
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  contactCard: {
    marginBottom: 12,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactType: {
    fontSize: 12,
  },
  metaSeparator: {
    fontSize: 12,
  },
  contactAvailable: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoCard: {
    marginTop: 12,
    backgroundColor: STATUS_COLORS.INFO + '10',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

