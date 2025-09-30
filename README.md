# Wildlife Corridors Management System

A comprehensive digital solution for wildlife corridor monitoring, incident reporting, and conservation management. This application empowers conservationists, researchers, and wildlife managers to track animal movements, report incidents, and maintain wildlife corridors effectively.

## Project Overview

The Wildlife Corridors Management System is a full-stack application designed to:

- **Monitor Wildlife Movements**: Track animal corridors and migration patterns
- **Incident Reporting**: Report and manage wildlife incidents, obstructions, and sightings
- **Real-time Alerts**: Receive notifications about critical wildlife events
- **Data Visualization**: Interactive maps and analytics for corridor management
- **Multi-platform Support**: Native mobile app and responsive web application

## Architecture

```
Wildlife_Corridors_project/
├── 📱 frontend/
│   ├── mobile/          # React Native (Expo) mobile app
│   └── web/             # React web application
└── 🔧 backend/          # Backend services and API
    └── logic/           # Business logic and data processing
```

## Technologies Used

### Mobile Application
- **Framework**: React Native with Expo Router
- **Navigation**: File-based routing with Expo Router
- **UI Components**: Custom themed components with dark/light mode
- **State Management**: React Context API
- **Icons**: React Native Vector Icons (Feather)
- **Styling**: StyleSheet with dynamic theming

### Web Application
- **Framework**: React.js
- **Build Tool**: Create React App
- **Styling**: CSS3 with responsive design
- **Package Manager**: npm

### Backend
- **Architecture**: Microservices (in development)
- **Data Processing**: Custom logic modules

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (for mobile development)
- Git

### Mobile App Setup

```bash
# Navigate to mobile directory
cd frontend/mobile

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Start development server
npx expo start
```

### Web App Setup

```bash
# Navigate to web directory
cd frontend/web

# Install dependencies
npm install

# Start development server
npm start
```

## Mobile App Features

### Authentication System
- **Secure Sign In**: Username/password authentication
- **User Registration**: Role-based user registration (Researcher, Ranger, Conservationist, Administrator)
- **Multi-factor Authentication**: Enhanced security with MFA support
- **Biometric Authentication**: Fingerprint/Face ID integration

### Dashboard
- **Wildlife Statistics**: Real-time corridor usage data
- **Recent Incidents**: Quick access to latest reports
- **Alert Summary**: Critical notifications at a glance
- **Quick Actions**: Rapid access to reporting features

### Field Data Reporting
- **Incident Reports**: Document wildlife incidents with severity levels
- **Obstruction Reports**: Report corridor blockages and barriers
- **Wildlife Sightings**: Log animal observations with species data
- **Rich Media**: Photo and location capture
- **Offline Support**: Function without internet connectivity

### Interactive Mapping
- **Corridor Visualization**: View wildlife corridors and boundaries
- **Incident Mapping**: Geospatial incident visualization
- **Real-time Tracking**: Live corridor activity monitoring
- **Layer Controls**: Toggle different data layers

### Alert Management
- **Real-time Notifications**: Instant critical incident alerts
- **Severity Filtering**: Organize alerts by priority level
- **Response Tracking**: Monitor incident resolution status
- **Custom Notifications**: Personalized alert preferences

### User Profile
- **Profile Management**: Update user information and preferences
- **Role-based Access**: Feature access based on user roles
- **Settings**: App preferences and notification settings
- **Data Synchronization**: Cloud backup and sync

## Design System

### Color Palette
- **Primary**: Wildlife-inspired green tones
- **Accent Colors**: Earth tones for different severities
- **Dark Mode**: Full dark theme support
- **Accessibility**: WCAG 2.1 compliant color contrasts

### UI Components
- **Themed Components**: Consistent design language
- **Custom Icons**: Wildlife and conservation-focused iconography
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Haptic Feedback**: Enhanced user interaction experience

## Available Scripts

### Mobile Development

```bash
# Development
npm run android          # Run on Android device/emulator
npm run ios             # Run on iOS device/simulator (macOS only)
npm run web             # Run in web browser

# Building
npm run build           # Build for production
npm run export          # Export static files
```

### Web Development

```bash
# Development
npm start               # Start development server
npm test                # Run test suite
npm run build          # Build for production
npm run eject          # Eject from Create React App (irreversible)
```

## Project Structure

### Mobile App Structure
```
frontend/mobile/
├── app/                     # Expo Router file-based routing
│   ├── index.jsx           # App entry point
│   ├── _layout.jsx         # Root navigation layout
│   ├── +not-found.jsx     # 404 error page
│   └── screens/
│       ├── auth/           # Authentication screens
│       │   ├── SignInScreen.jsx
│       │   └── SignUpScreen.jsx
│       └── (tabs)/         # Main app tabs
│           ├── _layout.jsx         # Tab navigation layout
│           ├── DashboardScreen.jsx # Wildlife statistics dashboard
│           ├── FieldDataScreen.jsx # Incident reporting
│           ├── MapScreen.jsx       # Interactive mapping
│           ├── AlertsScreen.jsx    # Alert management
│           └── ProfileScreen.jsx   # User profile
├── components/             # Reusable UI components
│   ├── ui/                # Core UI components (Button, Card, etc.)
│   ├── HapticTab.jsx      # Tab bar with haptic feedback
│   ├── ThemedText.jsx     # Themed text component
│   └── ThemedView.jsx     # Themed view container
├── constants/             # App constants and configuration
│   └── Colors.js          # Color theme definitions
├── contexts/              # React Context providers
│   ├── ThemeContext.js    # Theme management
│   └── AlertsContext.js   # Alert state management
├── hooks/                 # Custom React hooks
│   ├── useColorScheme.js  # Device color scheme detection
│   └── useThemeColor.js   # Theme color utilities
└── assets/               # Static assets (images, fonts)
    ├── images/
    └── fonts/
```

## Key Features

### Real-time Wildlife Monitoring
- Live corridor usage tracking
- Animal movement pattern analysis
- Seasonal migration monitoring
- Habitat connectivity assessment

### Comprehensive Incident Management
- Multi-category incident reporting
- Severity-based alert system
- GPS-accurate location tracking
- Rich media documentation

### Advanced Analytics
- Wildlife corridor effectiveness metrics
- Incident trend analysis
- Geographic hotspot identification
- Conservation impact assessment

### Collaborative Platform
- Multi-user access with role permissions
- Team communication features
- Data sharing capabilities
- Export and reporting tools

## Development

### Code Quality
- **ESLint**: Code linting and formatting
- **Professional Naming**: PascalCase for components, camelCase for utilities
- **Clean Architecture**: Organized folder structure
- **Component Reusability**: Modular UI component library

### Best Practices
- File-based routing with Expo Router
- Context-based state management
- Themed component system
- Responsive design patterns
- Accessibility compliance

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Wildlife conservation organizations for domain expertise
- React Native and Expo communities for excellent documentation
- Open source contributors and maintainers

## Contact & Support

For questions, support, or contributions:
- **Repository**: [Wildlife_Corridors_project](https://github.com/sjamillah/Wildlife_Corridors_project)
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the wiki for detailed guides

---

**Building a better future for wildlife through technology**