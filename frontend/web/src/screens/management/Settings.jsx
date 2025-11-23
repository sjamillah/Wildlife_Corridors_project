import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Database, Save, RotateCcw, Plus, Lock, Calendar, Mail, Phone, Award } from '@/components/shared/Icons';
import Sidebar from '../../components/shared/Sidebar';
import { COLORS } from '../../constants/Colors';
import { auth } from '../../services';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState({
    profile: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@aureynx.com',
      phone: '+254 700 123 456',
      organization: 'Kenya Wildlife Service',
      role: 'Conservation Manager',
      department: 'Field Operations',
      avatar: 'JD',
      // Account metadata (from backend)
      accountCreated: '2024-01-15',
      lastLogin: '2025-11-02 10:30',
      accountStatus: 'Active',
      userId: 'USR-2024-001'
    },
    password: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      criticalAlerts: true,
      weeklyReports: true,
      maintenanceReminders: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      ipRestriction: false,
      auditLogs: true
    },
    system: {
      language: 'en',
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      theme: 'light',
      autoBackup: true,
      dataRetention: 365
    }
  });

  const handleLogout = async () => {
    try {
      await auth.logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      navigate('/auth', { replace: true });
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaveMessage('Saving...');
      
      // Update profile information and preferences in one call
      const profileUpdate = {
        name: `${settings.profile.firstName} ${settings.profile.lastName}`.trim(),
        phone: settings.profile.phone,
        organization: settings.profile.organization,
        department: settings.profile.department,
        notification_preferences: settings.notifications,
        security_preferences: settings.security,
        system_preferences: settings.system,
      };
      
      await auth.updateProfile(profileUpdate);
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage(`Failed to save: ${error.message}`);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setSettings({
        profile: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@aureynx.com',
          phone: '+254 700 123 456',
          organization: 'Kenya Wildlife Service',
          role: 'Conservation Manager',
          department: 'Field Operations',
          avatar: 'JD',
          accountCreated: '2024-01-15',
          lastLogin: '2025-11-02 10:30',
          accountStatus: 'Active',
          userId: 'USR-2024-001'
        },
        password: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        },
        notifications: {
          emailAlerts: true,
          smsAlerts: false,
          pushNotifications: true,
          criticalAlerts: true,
          weeklyReports: true,
          maintenanceReminders: true
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90,
          ipRestriction: false,
          auditLogs: true
        },
        system: {
          language: 'en',
          timezone: 'Africa/Nairobi',
          dateFormat: 'DD/MM/YYYY',
          theme: 'light',
          autoBackup: true,
          dataRetention: 365
        }
      });
      setSaveMessage('Settings reset to defaults');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Upload to backend and get URL
      console.log('Photo selected:', file.name);
      setSaveMessage('Photo uploaded! Click Save Changes to confirm.');
      setTimeout(() => setSaveMessage(''), 3000);
      // In real app: upload file and update avatar
    }
  };

  // Fetch real user data from backend
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch fresh profile from backend
        const profile = await auth.fetchProfile();
        const name = profile.name || profile.email?.split('@')[0] || 'User';
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        // Get account metadata
        const accountCreated = profile.date_joined || profile.created_at || new Date().toISOString();
        const lastLogin = profile.last_login || null;
        const accountStatus = profile.is_active ? 'Active' : 'Inactive';
        
        setSettings(prev => ({
          ...prev,
          profile: {
            firstName: firstName,
            lastName: lastName,
            email: profile.email || '',
            phone: profile.phone || profile.phone_number || '',
            organization: profile.organization || profile.organization_name || '',
            role: profile.role === 'ranger' ? 'Field Ranger' : 
                  profile.role === 'conservation_manager' ? 'Conservation Manager' :
                  profile.role === 'admin' ? 'System Administrator' :
                  profile.role === 'viewer' ? 'Viewer' : 'User',
            department: profile.department || '',
            avatar: initials,
            accountCreated: accountCreated,
            lastLogin: lastLogin ? new Date(lastLogin).toLocaleString() : 'Never',
            accountStatus: accountStatus,
            userId: profile.id || profile.user_id || '',
          },
          // Load preferences from profile if available (merge with defaults if partial)
          notifications: profile.notification_preferences ? {
            ...prev.notifications,
            ...profile.notification_preferences
          } : prev.notifications,
          security: profile.security_preferences ? {
            ...prev.security,
            ...profile.security_preferences
          } : prev.security,
          system: profile.system_preferences ? {
            ...prev.system,
            ...profile.system_preferences
          } : prev.system,
        }));
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to cached profile
        const cachedProfile = auth.getProfile();
        if (cachedProfile) {
          const name = cachedProfile.name || cachedProfile.email?.split('@')[0] || 'User';
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';
          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          
          setSettings(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              firstName: firstName,
              lastName: lastName,
              email: cachedProfile.email || prev.profile.email,
              role: cachedProfile.role === 'ranger' ? 'Field Ranger' : 'Conservation Manager',
              avatar: initials,
              userId: cachedProfile.id || prev.profile.userId,
            }
          }));
        }
      }
    };

    fetchUserData();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Account', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database }
  ];

  const ProfileSettings = () => (
    <>
      {/* Account Overview Card */}
      <div style={{ 
        background: `linear-gradient(135deg, ${COLORS.forestGreen} 0%, ${COLORS.burntOrange} 100%)`, 
        borderRadius: '12px', 
        padding: '28px 32px', 
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(46, 93, 69, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: COLORS.whiteCard,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: COLORS.burntOrange,
          fontSize: '40px',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {settings.profile.avatar}
        </div>
        <div style={{ flex: 1, color: COLORS.white }}>
          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
            {settings.profile.firstName} {settings.profile.lastName}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '12px', fontWeight: 500 }}>
            {settings.profile.role} • {settings.profile.organization}
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '12px', opacity: 0.9 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar className="w-3.5 h-3.5" />
              Joined {new Date(settings.profile.accountCreated).toLocaleDateString()}
            </div>
            <div style={{
              padding: '4px 10px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {settings.profile.accountStatus}
            </div>
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button 
            onClick={handlePhotoUpload}
            style={{
              padding: '10px 20px',
              background: COLORS.whiteCard,
              border: 'none',
              borderRadius: '8px',
              color: COLORS.forestGreen,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Plus className="w-4 h-4" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Personal Information Card */}
      <div style={{ background: COLORS.whiteCard, border: `2px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: COLORS.forestGreen,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User className="w-4 h-4" color="white" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>
            Personal Information
          </h3>
        </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                First Name
              </label>
            <input
              type="text"
              value={settings.profile.firstName}
              onChange={(e) => handleSettingChange('profile', 'firstName', e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                Last Name
              </label>
            <input
              type="text"
              value={settings.profile.lastName}
              onChange={(e) => handleSettingChange('profile', 'lastName', e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail className="w-3.5 h-3.5" color={COLORS.textSecondary} />
                Email Address
              </label>
            <input
              type="email"
              value={settings.profile.email}
              onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: COLORS.secondaryBg
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone className="w-3.5 h-3.5" color={COLORS.textSecondary} />
                Phone Number
              </label>
            <input
              type="tel"
              value={settings.profile.phone}
              onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: COLORS.secondaryBg
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award className="w-3.5 h-3.5" color={COLORS.textSecondary} />
                Organization
              </label>
            <input
              type="text"
              value={settings.profile.organization}
              onChange={(e) => handleSettingChange('profile', 'organization', e.target.value)}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: COLORS.secondaryBg
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                Role
              </label>
            <input
              type="text"
              value={settings.profile.role}
              onChange={(e) => handleSettingChange('profile', 'role', e.target.value)}
              style={{
                padding: '12px 14px',
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                outline: 'none',
                transition: 'all 0.2s ease',
                background: COLORS.secondaryBg
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
            />
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
                Department
              </label>
            <input
              type="text"
              value={settings.profile.department}
              onChange={(e) => handleSettingChange('profile', 'department', e.target.value)}
              style={{
                padding: '12px 14px',
                border: `1px solid ${COLORS.borderLight}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                outline: 'none',
                transition: 'all 0.2s ease',
                background: COLORS.secondaryBg
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
            />
          </div>
        </div>
      </div>
    </>
  );

  const PasswordSettings = () => (
    <div style={{ background: COLORS.whiteCard, border: `2px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '24px', maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          background: COLORS.burntOrange,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Lock className="w-4 h-4" color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: COLORS.textPrimary }}>
            Change Password
          </h3>
          <div style={{ fontSize: '12px', color: COLORS.textSecondary }}>
            Update your password to keep your account secure
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Current Password
          </label>
          <input
            type="password"
            value={settings.password.currentPassword}
            onChange={(e) => handleSettingChange('password', 'currentPassword', e.target.value)}
            placeholder="Enter current password"
            style={{
              padding: '12px 14px',
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              outline: 'none',
              transition: 'all 0.2s ease',
              background: COLORS.secondaryBg
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            New Password
          </label>
          <input
            type="password"
            value={settings.password.newPassword}
            onChange={(e) => handleSettingChange('password', 'newPassword', e.target.value)}
            placeholder="Enter new password"
            style={{
              padding: '12px 14px',
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              outline: 'none',
              transition: 'all 0.2s ease',
              background: COLORS.secondaryBg
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
          />
          <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px' }}>
            Password must be at least 8 characters with uppercase, lowercase, and numbers
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={settings.password.confirmPassword}
            onChange={(e) => handleSettingChange('password', 'confirmPassword', e.target.value)}
            placeholder="Confirm new password"
            style={{
              padding: '12px 14px',
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              outline: 'none',
              transition: 'all 0.2s ease',
              background: COLORS.secondaryBg
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.forestGreen; e.currentTarget.style.background = COLORS.whiteCard; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.borderLight; e.currentTarget.style.background = COLORS.secondaryBg; }}
          />
        </div>

        <button
          onClick={async () => {
            if (!settings.password.currentPassword) {
              alert('Please enter your current password');
              return;
            }
            if (!settings.password.newPassword || settings.password.newPassword.length < 8) {
              alert('New password must be at least 8 characters');
              return;
            }
            if (settings.password.newPassword !== settings.password.confirmPassword) {
              alert('Passwords do not match!');
              return;
            }
            
            try {
              setSaveMessage('Updating password...');
              await auth.changePassword(settings.password.currentPassword, settings.password.newPassword);
              
              setSaveMessage('Password updated successfully!');
              setTimeout(() => setSaveMessage(''), 3000);
              
              // Clear password fields
              handleSettingChange('password', 'currentPassword', '');
              handleSettingChange('password', 'newPassword', '');
              handleSettingChange('password', 'confirmPassword', '');
            } catch (error) {
              alert(`Failed to update password: ${error.message}`);
              setSaveMessage('');
            }
          }}
          style={{
            padding: '12px 20px',
            background: COLORS.burntOrange,
            border: 'none',
            color: COLORS.white,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginTop: '8px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; }}
        >
          Update Password
        </button>
      </div>
    </div>
  );

  const NotificationSettings = () => (
    <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
        Notification Preferences
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive critical alerts via email' },
            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Receive urgent notifications via SMS' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile push notifications' },
            { key: 'criticalAlerts', label: 'Critical Alerts Only', desc: 'Only receive high-priority alerts' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Automated weekly summary reports' },
            { key: 'maintenanceReminders', label: 'Maintenance Reminders', desc: 'Equipment maintenance notifications' }
        ].map((setting, idx, arr) => (
          <div
            key={setting.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: idx !== arr.length - 1 ? '20px' : 0,
              borderBottom: idx !== arr.length - 1 ? `1px solid ${COLORS.creamBg}` : 'none'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '4px' }}>
                {setting.label}
              </div>
              <div style={{ fontSize: '13px', color: COLORS.textSecondary }}>
                {setting.desc}
              </div>
              </div>
            {/* Toggle Switch */}
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications[setting.key]}
                  onChange={(e) => handleSettingChange('notifications', setting.key, e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: settings.notifications[setting.key] ? COLORS.burntOrange : COLORS.borderLight,
                borderRadius: '26px',
                transition: '0.3s ease'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '20px',
                  width: '20px',
                  left: '3px',
                  bottom: '3px',
                  background: COLORS.whiteCard,
                  borderRadius: '50%',
                  transition: '0.3s ease',
                  transform: settings.notifications[setting.key] ? 'translateX(22px)' : 'translateX(0)'
                }}></span>
              </span>
              </label>
            </div>
          ))}
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      {[
        {
          key: 'twoFactorAuth',
          label: 'Two-Factor Authentication',
          desc: 'Enabled',
          iconBg: '#EDF5F0',
          enabled: settings.security.twoFactorAuth
        },
        {
          key: 'ipRestriction',
          label: 'IP Address Restrictions',
          desc: 'Disabled',
          iconBg: COLORS.tintCritical,
          enabled: settings.security.ipRestriction
        },
        {
          key: 'auditLogs',
          label: 'Audit Logging',
          desc: 'Enabled',
          iconBg: '#EDF5F0',
          enabled: settings.security.auditLogs
        }
      ].map((item) => (
        <div
          key={item.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: COLORS.secondaryBg,
            borderRadius: '8px'
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            background: item.iconBg,
            flexShrink: 0
          }}>
            <Shield className="w-5 h-5" style={{ color: COLORS.textPrimary }} />
            </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.textPrimary, marginBottom: '2px' }}>
              {item.label}
          </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: item.enabled ? COLORS.success : COLORS.textSecondary }}>
              {item.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
          <button style={{
            padding: '8px 16px',
            background: 'transparent',
            border: `1px solid ${COLORS.borderLight}`,
            color: COLORS.textSecondary,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = COLORS.forestGreen;
            e.currentTarget.style.color = COLORS.forestGreen;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = COLORS.borderLight;
            e.currentTarget.style.color = COLORS.textSecondary;
          }}
          >
            Configure
          </button>
      </div>
      ))}
    </div>
  );

  const SystemSettings = () => (
    <div style={{ background: COLORS.whiteCard, border: `1px solid ${COLORS.borderLight}`, borderRadius: '10px', padding: '28px', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.textPrimary, marginBottom: '20px' }}>
        System Preferences
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Language
          </label>
            <select
              value={settings.system.language}
              onChange={(e) => handleSettingChange('system', 'language', e.target.value)}
            style={{
              padding: '12px 14px',
              border: '1px solid #E8E3D6',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              background: COLORS.whiteCard,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2E5D45'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; }}
            >
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
              <option value="fr">Français</option>
            </select>
          </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Timezone
          </label>
            <select
              value={settings.system.timezone}
              onChange={(e) => handleSettingChange('system', 'timezone', e.target.value)}
            style={{
              padding: '12px 14px',
              border: '1px solid #E8E3D6',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              background: COLORS.whiteCard,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2E5D45'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; }}
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Date Format
          </label>
            <select
              value={settings.system.dateFormat}
              onChange={(e) => handleSettingChange('system', 'dateFormat', e.target.value)}
            style={{
              padding: '12px 14px',
              border: '1px solid #E8E3D6',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              background: COLORS.whiteCard,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2E5D45'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: COLORS.textPrimary }}>
            Theme
          </label>
            <select
              value={settings.system.theme}
              onChange={(e) => handleSettingChange('system', 'theme', e.target.value)}
            style={{
              padding: '12px 14px',
              border: '1px solid #E8E3D6',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              background: COLORS.whiteCard,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#2E5D45'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E3D6'; }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'password': return <PasswordSettings />;
      case 'notifications': return <NotificationSettings />;
      case 'security': return <SecuritySettings />;
      case 'system': return <SystemSettings />;
      default: return <ProfileSettings />;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: COLORS.creamBg, minHeight: '100vh' }}>
      <Sidebar onLogout={handleLogout} />
      
      {/* Main Content */}
      <div className="responsive-content">
        {/* Page Header */}
        <section style={{ background: COLORS.forestGreen, padding: '28px 40px', borderBottom: `2px solid ${COLORS.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.6px' }}>
              System Settings
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
              Configure platform preferences and user settings
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Admin badge */}
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px 16px', borderRadius: '6px', color: 'white', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Admin
              </div>
            {/* Reset button */}
            <button
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
            >
                <RotateCcw className="w-4 h-4" />
              Reset
              </button>
            {/* Save button */}
            <button
              onClick={handleSave}
              style={{
                background: COLORS.burntOrange,
                border: `2px solid ${COLORS.burntOrange}`,
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; e.currentTarget.style.borderColor = COLORS.terracotta; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.burntOrange; e.currentTarget.style.borderColor = COLORS.burntOrange; }}
            >
                <Save className="w-4 h-4" />
              Save Changes
              </button>
            </div>
          
          {/* Success Message */}
          {saveMessage && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: COLORS.success,
              color: COLORS.white,
              padding: '14px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              zIndex: 1000,
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideIn 0.3s ease'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {saveMessage}
            </div>
          )}
        </section>

        {/* Settings Navigation */}
        <section style={{ padding: '24px 40px', background: COLORS.secondaryBg, borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '12px 20px',
                    background: activeTab === tab.id ? COLORS.forestGreen : 'transparent',
                    border: 'none',
                    color: activeTab === tab.id ? 'white' : COLORS.textSecondary,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = COLORS.borderLight;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                    </button>
              );
            })}
                </div>
        </section>

        {/* Settings Content */}
        <section style={{ padding: '32px 40px', maxWidth: '1200px' }}>
          {renderContent()}
        </section>
      </div>

      {/* Add animation for success message */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Settings;
