# Aureynx Wildlife Conservation Platform (Mobile Application)

## Overview

The Aureynx Mobile Application is a field-ready conservation tool designed for rangers, researchers, and conservationists working directly in wildlife corridors. Built with React Native and Expo, this cross-platform application enables real-time incident reporting, wildlife tracking, alert management, and field data collection from anywhere in the conservation area.

## Purpose

This mobile platform empowers field teams to document wildlife observations, report incidents, respond to alerts, and access critical conservation data while working in remote areas. The application functions offline when necessary and synchronizes data when connectivity is available, ensuring continuous operation in challenging field conditions.

## Technology Stack

**Framework**: React Native with Expo SDK 52.0.11

**Navigation**: Expo Router for file-based routing and type-safe navigation

**UI Components**: Custom themed components with consistent Aureynx branding

**State Management**: React Context API for global state and theme management

**Local Storage**: Expo SecureStore for sensitive data, AsyncStorage for general data

**Authentication**: Local authentication with biometric support (Face ID, Touch ID, Fingerprint)

**Maps**: React Native Maps and Mapbox integration for offline-capable mapping

**Icons**: React Native Vector Icons and Lucide React for comprehensive iconography

**Development**: Expo Go for rapid testing, EAS Build for production deployments

## Project Structure

```
frontend/mobile/
  app/
    (tabs)/
      _layout.jsx             (Tab navigation configuration)
      DashboardScreen.jsx     (Statistics and overview)
      FieldDataScreen.jsx     (Incident reporting)
      MapScreen.jsx           (Interactive mapping)
      AlertsScreen.jsx        (Alert management)
      ProfileScreen.jsx       (User profile)
    screens/
      auth/
        SignInScreen.jsx      (Authentication)
        SignUpScreen.jsx      (Registration)
    index.jsx                 (App entry point)
    _layout.jsx               (Root layout)
  components/
    ui/
      Button.jsx              (Themed button)
      Card.jsx                (Card container)
      Input.jsx               (Form input)
    maps/
      MapboxMap.jsx           (Mapbox integration)
      SmartMap.jsx            (Map wrapper)
    HapticTab.jsx             (Tab with feedback)
    ThemedText.jsx            (Themed text)
    ThemedView.jsx            (Themed container)
  constants/
    Colors.js                 (Color definitions)
  contexts/
    ThemeContext.js           (Theme management)
    AlertsContext.js          (Alert state)
  hooks/
    useColorScheme.js         (Color scheme detection)
    useThemeColor.js          (Theme utilities)
  assets/
    images/                   (Image assets)
    fonts/                    (Custom fonts)
  package.json                (Dependencies)
  app.json                    (Expo configuration)
```

## Core Features

### Dashboard and Statistics

Real-time overview of conservation operations including corridor usage statistics, recent incidents summary, active alert count, and quick access to critical functions. The dashboard provides at-a-glance situational awareness for field teams and command centers.

### Field Data Reporting

Comprehensive incident reporting system allowing field teams to document:

Wildlife Sightings with species identification, count, and behavior observations
Obstruction Reports documenting corridor blockages, fences, roads, or barriers
Security Incidents including poaching attempts, illegal activities, and threats
Infrastructure Issues reporting damage to conservation facilities
Environmental Changes noting habitat modifications or natural events

Each report captures GPS location, timestamp, severity level, photographs, and detailed descriptions. The system validates required fields and guides users through complete documentation.

### Interactive Mapping

High-performance mapping interface displaying wildlife corridors, incident locations, patrol routes, and animal movements. Maps support offline tile caching for use in areas without connectivity. Users can toggle layers, view incident details, and navigate to specific locations.

### Alert Management

Real-time notification system for critical conservation events. Alerts are categorized by severity (critical, high, medium, low) and type (security, wildlife, infrastructure, environmental). Users can filter alerts, view details, track response status, and coordinate team responses.

### User Profile

Personal profile management including user information, role assignment, notification preferences, and application settings. Profile section supports theme switching (light/dark mode), language preferences, and data synchronization options.

## Installation and Development

### Prerequisites

Node.js version 16.0.0 or higher
npm package manager (included with Node.js)
Expo CLI for mobile development tools
iOS Simulator (macOS) or Android Emulator
Physical iOS or Android device for testing (optional but recommended)

### Installation Steps

Clone the repository and navigate to the mobile application:

```
git clone https://github.com/sjamillah/Wildlife_Corridors_project.git
cd Wildlife_Corridors_project/frontend/mobile
```

Install all project dependencies:

```
   npm install
   ```

Install Expo CLI globally if not already present:

```
npm install -g @expo/cli
```

### Development Workflow

Start the Expo development server:

```
   npx expo start
   ```

This command launches Expo Dev Tools with multiple testing options:

Press 'w' to open in web browser
Press 'a' to open in Android emulator
Press 'i' to open in iOS simulator
Scan QR code with Expo Go app for physical device testing

### Platform-Specific Development

Run on specific platforms:

```
npm run android    (Launch Android emulator)
npm run ios        (Launch iOS simulator, macOS only)
npm run web        (Run in web browser)
```

### Production Build

Build production-ready binaries using EAS (Expo Application Services):

```
eas build --platform android
eas build --platform ios
eas build --platform all
```

### Testing

The application uses Jest and React Native Testing Library for comprehensive testing:

```
npm test           (Run test suite)
npm run test:watch (Run tests in watch mode)
```

## Configuration

### Expo Configuration

Application metadata, build settings, and platform-specific configuration are defined in `app.json`. This includes app name, version, icon, splash screen, permissions, and SDK version.

### Environment Variables

Create a `.env` file for environment-specific configuration:

```
EXPO_PUBLIC_API_URL=your_backend_api_url
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
EXPO_PUBLIC_ENVIRONMENT=development
```

## Theme System

### Color Schemes

The application implements a comprehensive dual-theme system supporting light and dark modes. Colors are defined in `constants/Colors.js` and accessed through the ThemeContext.

**Light Theme**: Cream backgrounds, forest green accents, high contrast text
**Dark Theme**: Dark surfaces, muted accents, reduced brightness for night use

### Theme Switching

Users can toggle between light and dark themes through the Profile screen. Theme preference is persisted locally and applied consistently across all screens and components.

### Themed Components

All UI components automatically adapt to the active theme. ThemedText and ThemedView components handle color transitions. Custom hooks (useThemeColor) simplify theme-aware styling.

## Authentication and Security

### Local Authentication

Email and password authentication with secure credential storage. Passwords are never stored locally, only authentication tokens. Sessions persist until explicit logout or token expiration.

### Biometric Authentication

Integration with device biometric systems including Face ID on iOS, Touch ID on iOS, and Fingerprint authentication on Android. Biometric authentication provides quick, secure access for returning users.

### Two-Factor Verification

Optional OTP (One-Time Password) verification for enhanced security. Verification codes sent via email or SMS with 60-second validity. Users can resend codes after timeout period.

### Role-Based Access

User roles (Researcher, Ranger, Conservationist, Administrator) control feature access and data permissions. Role assignment managed by administrators through the web platform.

## Offline Functionality

### Data Persistence

Reports and observations created without connectivity are stored locally and automatically synchronized when connection is restored. AsyncStorage maintains incident queue for reliable data capture.

### Map Caching

Map tiles can be cached for offline access in remote areas. Users can download regional map data before field deployments. Cached areas remain accessible without internet connectivity.

### Sync Management

Background synchronization when connectivity is detected. Conflict resolution for simultaneous edits. User notification of sync status and pending uploads.

## Permissions

The application requires specific device permissions for full functionality:

**Location Services**: Required for GPS coordinates in reports and mapping features
**Camera Access**: Optional for incident photo documentation
**Photo Library**: Optional for attaching existing images to reports
**Notifications**: Recommended for real-time alerts and updates
**Biometric Hardware**: Optional for fingerprint/face authentication

Permissions are requested at first use with clear explanations of purpose. Users can manage permissions through device settings.

## Performance Optimization

### Lazy Loading

Screens and components load on demand to minimize initial bundle size. Images are optimized and loaded progressively. Heavy components defer loading until needed.

### Memory Management

Proper cleanup of listeners, timers, and subscriptions. Efficient handling of large datasets and image collections. Pagination for long lists and data tables.

### Battery Conservation

Location tracking optimized for battery efficiency. Background processes minimized when app is inactive. Network requests batched to reduce radio usage.

## Deployment

### Build Configuration

Configure app.json with production settings including version numbers, bundle identifiers, and platform-specific configuration. Set up signing credentials for iOS and Android.

### iOS Deployment

Build and submit to Apple App Store through EAS:

```
eas build --platform ios
eas submit --platform ios
```

Requires Apple Developer account and App Store Connect setup.

### Android Deployment

Build and submit to Google Play Store:

```
eas build --platform android
eas submit --platform android
```

Requires Google Play Developer account and app listing configuration.

### Over-the-Air Updates

Expo Updates enables instant deployment of JavaScript and asset changes without app store review:

```
eas update --branch production
```

Updates apply automatically on next app launch while maintaining version compatibility.

## Troubleshooting

### Common Issues

**Metro Bundler Cache**: Clear cache with `npx expo start --clear`
**Node Modules**: Reinstall dependencies with `rm -rf node_modules && npm install`
**iOS Build Issues**: Clear derived data and rebuild Pods
**Android Build Issues**: Clean Gradle cache and rebuild project

### Debug Mode

Enable debug logging in development:

```
__DEV__ && console.log('Debug message');
```

Access React Native debugger through development menu (shake device or Cmd+D/Ctrl+M).

## Support and Resources

### Documentation

Expo Documentation: https://docs.expo.dev
React Native Docs: https://reactnative.dev
Expo Router Guide: https://docs.expo.dev/router/introduction

### Community

GitHub Issues for bug reports and feature requests
Project Wiki for detailed guides and tutorials
Contributing Guide (CONTRIBUTING.md) for development workflow

## Related Documentation

Main Project README: Repository root README.md for complete overview
Web Application: frontend/web/README.md for web platform documentation
Wildlife Analysis: HMM_Dataset.md for movement analysis methodology
Contributing Guide: CONTRIBUTING.md for contribution guidelines
