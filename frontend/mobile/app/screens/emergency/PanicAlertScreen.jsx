import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../../../components/ui/Card';
import { Colors, STATUS_COLORS } from '../../../constants/Colors';
import { useTheme } from '../../../contexts/ThemeContext';

export default function PanicAlertScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [alertSent, setAlertSent] = useState(false);

  const handlePanicAlert = () => {
    Alert.alert(
      'Send Panic Alert?',
      'This will immediately notify all emergency responders and share your GPS location. Only use in genuine emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => {
            setAlertSent(true);
            // TODO: Implement actual panic alert logic
            setTimeout(() => {
              Alert.alert(
                'Alert Sent',
                'Emergency responders have been notified. Help is on the way. Stay safe!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }, 500);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Panic Alert</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Card style={[styles.warningCard, { backgroundColor: STATUS_COLORS.ERROR + '10' }]}>
          <View style={styles.warningHeader}>
            <MaterialCommunityIcons name="alert-octagon" size={32} color={STATUS_COLORS.ERROR} />
            <Text style={[styles.warningTitle, { color: STATUS_COLORS.ERROR }]}>Emergency Use Only</Text>
          </View>
          <Text style={[styles.warningText, { color: colors.text }]}>
            This panic button will immediately:{'\n\n'}
            • Alert all nearby rangers and security personnel{'\n'}
            • Share your exact GPS location{'\n'}
            • Trigger emergency protocols{'\n'}
            • Dispatch nearest response team{'\n\n'}
            Only use in genuine emergency situations.
          </Text>
        </Card>

        <View style={styles.panicButtonContainer}>
          <TouchableOpacity
            style={[styles.panicButton, { backgroundColor: STATUS_COLORS.ERROR }]}
            onPress={handlePanicAlert}
            activeOpacity={0.8}
            disabled={alertSent}
          >
            <MaterialCommunityIcons name="alarm-light" size={48} color="#fff" />
            <Text style={styles.panicButtonText}>
              {alertSent ? 'Alert Sent!' : 'SEND PANIC ALERT'}
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={STATUS_COLORS.INFO} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Your Location</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>Maasai Mara Wildlife Reserve</Text>
              <Text style={[styles.infoCoords, { color: colors.textSecondary }]}>-1.4061° S, 35.0117° E</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={STATUS_COLORS.SUCCESS} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Estimated Response Time</Text>
              <Text style={[styles.infoValue, { color: STATUS_COLORS.SUCCESS }]}>5-15 minutes</Text>
            </View>
          </View>
        </Card>
      </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  warningCard: {
    marginBottom: 24,
    padding: 20,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
  },
  panicButtonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  panicButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  panicButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoCoords: {
    fontSize: 12,
  },
});

