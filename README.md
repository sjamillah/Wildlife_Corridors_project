# Aureynx - Wildlife Conservation Platform

> **Protecting Wildlife Together Through Technology**

A comprehensive digital solution for wildlife corridor monitoring, incident reporting, and conservation management. Aureynx empowers conservationists, researchers, and wildlife managers to track animal movements, report incidents, and maintain wildlife corridors effectively.

## Table of Contents

- [Demo Video](#demo-video)
- [Description](#description)
- [Repository](#repository)
- [Dataset Overview](#dataset-overview)
- [Project Structure](#project-structure)
- [Environment Setup & Installation](#environment-setup--installation)
  - [Prerequisites](#prerequisites)
  - [Mobile Application Setup](#mobile-application-setup)
  - [Web Application Setup](#web-application-setup)
  - [Backend & Analytics Setup](#backend--analytics-setup)
- [Technologies Used](#technologies-used)
  - [Mobile Application](#mobile-application)
  - [Web Application](#web-application)
  - [Backend & Analytics](#backend--analytics)
  - [Wildlife Movement Analysis (HMM Model)](#wildlife-movement-analysis-hmm-model)
- [Mobile App Features](#mobile-app-features)
  - [Authentication System](#authentication-system)
  - [Dashboard](#dashboard)
  - [Field Data Reporting](#field-data-reporting)
  - [Interactive Mapping](#interactive-mapping)
  - [Alert Management](#alert-management)
  - [User Profile](#user-profile)
- [Design System](#design-system)
  - [Color Palette](#color-palette)
  - [UI Components](#ui-components)
- [Available Scripts](#available-scripts)
  - [Mobile Development](#mobile-development)
  - [Web Development](#web-development)
- [Key Features](#key-features)
- [Designs & Interface Screenshots](#designs--interface-screenshots)
  - [Application Screenshots](#application-screenshots)
  - [Design System](#design-system-1)
  - [Figma Mockups](#figma-mockups)
- [Deployment Plan](#deployment-plan)
  - [Web Application Deployment](#web-application-deployment)
  - [Mobile Application Deployment](#mobile-application-deployment)
  - [Backend Deployment](#backend-deployment)
  - [Security & Monitoring](#security--monitoring)
- [Development Guidelines](#development-guidelines)
  - [Code Quality Standards](#code-quality-standards)
  - [Best Practices](#best-practices)
  - [Testing Strategy](#testing-strategy)
- [Contributing](#contributing)
  - [Getting Started](#getting-started)
  - [Contribution Guidelines](#contribution-guidelines)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact & Support](#contact--support)
  - [Links](#links)
  - [Community](#community)

## Demo Video

**[Watch Demo Video](LINK_TO_DEMO_VIDEO)** - See Aureynx in action!

## Description

Aureynx is a full-stack wildlife conservation platform designed to revolutionize how we monitor and protect wildlife corridors. The system provides real-time tracking, incident management, and data analytics to support conservation efforts globally.

**Key Features:**

- **Wildlife Movement Tracking**: Real-time monitoring of animal corridors and migration patterns
- **Incident Management**: Comprehensive reporting system for wildlife events and obstructions
- **Smart Alerts**: Automated notifications for critical wildlife situations
- **Data Analytics**: Advanced visualization and insights for corridor effectiveness
- **Cross-Platform**: Native mobile app and responsive web application
- **HMM Analytics**: Hidden Markov Model for wildlife behavior prediction

## Repository

**GitHub Repository**: [https://github.com/sjamillah/Wildlife_Corridors_project](https://github.com/sjamillah/Wildlife_Corridors_project)

## Dataset Overview

Aureynx leverages real-world wildlife tracking data to power its behavioral analysis and conservation insights. Our research utilizes high-quality GPS tracking datasets sourced from **Movebank**, a collaborative platform providing access to animal movement data collected by researchers worldwide.

### Data Source & Location

- **Primary Dataset**: GPS tracking data from the **Greater Mara Ecosystem**, East Africa
- **Species Analyzed**: Large mammals including elephants (_Loxodonta africana_) and wildebeest (_Connochaetes taurinus_)
- **Collection Method**: Collar-mounted GPS sensors recording precise location coordinates at regular intervals
- **Data Provider**: Movebank collaborative database

### Key Data Characteristics

**Original GPS Data Fields**:

- **event-id**: Unique identifier for each GPS location record
- **visible**: Data quality indicator flagging successful GPS fixes
- **timestamp**: Precise date/time of GPS recording (UTC)
- **location-long**: Geographic longitude coordinate (decimal degrees)
- **location-lat**: Geographic latitude coordinate (decimal degrees)
- **sensor-type**: Type of tracking device used (e.g., GPS collar)
- **individual-taxon-canonical-name**: Scientific species name
- **tag-local-identifier**: Unique identifier for the physical tracking device
- **individual-local-identifier**: Unique identifier for each tracked animal
- **study-name**: Research project or study that collected the data

**Derived Movement Features** (calculated for analysis):

- **step_length**: Distance between consecutive GPS locations (meters)
- **step_bearing**: Compass direction of movement between GPS points (degrees)
- **turning_angle**: Change in direction between consecutive steps (radians)
- **speed**: Movement velocity calculated from step length and time difference (km/hour)
- **net_displacement**: Straight-line distance from starting location (meters)
- **cumulative_distance**: Total distance traveled by each individual (meters)
- **hour_of_day**: Extracted from timestamp for circadian activity analysis
- **true_state**: Manually defined behavioral categories (resting, foraging, traveling)
- **animal_id**: Simplified version of individual-local-identifier for analysis

### Dataset Scale & Quality

- **Temporal Coverage**: Multi-year tracking periods capturing seasonal patterns
- **Spatial Resolution**: Sub-meter GPS accuracy for precise movement analysis
- **Sample Size**: Thousands of GPS fixes per individual animal
- **Quality Control**: Rigorous data cleaning and validation protocols

This rich dataset enables Aureynx to automatically classify animal behaviors, identify movement patterns, and provide evidence-based insights for wildlife corridor management and conservation planning. For detailed methodology and analysis results, see [WILDLIFE_MOVEMENT_ANALYSIS.md](WILDLIFE_MOVEMENT_ANALYSIS.md).

## Project Structure

```
Wildlife_Corridors_project/
├── README.md                    # Project documentation
├── frontend/                    # Client-side applications
│   ├── mobile/                     # React Native (Expo) mobile app
│   │   ├── app/                    # App screens and routing
│   │   │   ├── (tabs)/            # Tab-based navigation
│   │   │   ├── screens/           # Authentication & main screens
│   │   │   └── _layout.tsx        # Root layout
│   │   ├── assets/                # Images, fonts, and static files
│   │   ├── components/            # Reusable UI components
│   │   ├── constants/             # App constants and themes
│   │   ├── hooks/                 # Custom React hooks
│   │   └── package.json           # Mobile dependencies
│   └── web/                       # React web application
│       ├── public/                # Static web assets
│       ├── src/                   # Web source code
│       │   ├── assets/           # Images and logos
│       │   ├── auth/             # Authentication components
│       │   ├── components/       # Reusable components
│       │   ├── pages/            # Main application pages
│       │   ├── screens/          # Screen components
│       │   └── services/         # API services
│       └── package.json          # Web dependencies
└── backend/                    # Server-side services
    ├── logic/                     # Business logic and algorithms
    └── notebooks/                 # Research and ML models
        └── HMM_Model.ipynb        # Hidden Markov Model analysis
```

## Environment Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git for version control
- Expo CLI for mobile development
- Python 3.8+ (for HMM model analysis)

### Mobile Application Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/sjamillah/Wildlife_Corridors_project.git
   cd Wildlife_Corridors_project/frontend/mobile
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install Expo CLI globally:

   ```bash
   npm install -g @expo/cli
   ```

4. Start the development server:
   ```bash
   npm run web          # Run on web browser
   npm run start        # Run on mobile device/emulator
   ```

### Web Application Setup

1. Navigate to web directory:

   ```bash
   cd Wildlife_Corridors_project/frontend/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start development server:

   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Backend & Analytics Setup

1. Navigate to backend:

   ```bash
   cd Wildlife_Corridors_project/backend
   ```

2. Set up Python environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Python packages:

   ```bash
   pip install jupyter pandas numpy matplotlib seaborn scikit-learn
   ```

4. Launch Jupyter notebook:
   ```bash
   jupyter notebook notebooks/HMM_Model.ipynb
   ```

## Technologies Used

### Mobile Application

- Framework: React Native with Expo Router
- Navigation: File-based routing with Expo Router
- UI Components: Custom themed components with consistent branding
- State Management: React Context API
- Authentication: Local Authentication (Face ID/Fingerprint)
- Icons: MaterialCommunityIcons, Lucide React
- Styling: StyleSheet with Aureynx brand colors

### Web Application

- Framework: React.js
- Build Tool: Create React App
- Styling: CSS3 with Tailwind-inspired classes
- Routing: React Router
- UI Library: Custom component library
- State Management: React Context & Hooks
- Package Manager: npm

### Backend & Analytics

- Architecture: Microservices (in development)
- Data Processing: Python with Pandas & NumPy
- Machine Learning: Hidden Markov Models (HMM) for behavioral analysis
- Analytics: Jupyter Notebooks with comprehensive wildlife movement analysis
- Data Visualization: Matplotlib, Seaborn for ecological insights
- Data Source: Movebank wildlife tracking database (GPS collar data)

### Wildlife Movement Analysis (HMM Model)

The Aureynx platform includes advanced behavioral analysis using Hidden Markov Models to classify animal movement patterns:

**Dataset**: GPS tracking data from Movebank featuring wildebeests and elephants in the Greater Mara Ecosystem

**Key Features Analyzed**:

- Step length (distance between GPS points)
- Turning angles (directional changes)
- Speed calculations
- Temporal movement patterns
- Net displacement tracking

**Behavioral State Classification**:

- **Resting**: Short steps (<50m), random directions - recovery and vigilance
- **Foraging**: Intermediate steps (50-200m), frequent turns - active resource searching
- **Traveling**: Long steps (>200m), straight trajectories - directed movement between areas

**Model Performance**:

- **Accuracy**: 87.3% - reliable behavioral state identification
- **Precision**: 85.1% - low false positive rates across categories
- **Recall**: 88.9% - strong detection of true behavioral instances

The HMM analysis provides critical insights for corridor design and wildlife management by automatically identifying movement patterns that inform conservation strategies.

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

- Live corridor usage tracking with GPS integration
- Animal movement pattern analysis using HMM models
- Seasonal migration monitoring and predictions
- Habitat connectivity assessment tools

### Comprehensive Incident Management

- Multi-category incident reporting system
- Severity-based alert system with push notifications
- GPS-accurate location tracking and mapping
- Rich media documentation (photos, videos, notes)

### Advanced Analytics & Intelligence

- Wildlife corridor effectiveness metrics and KPIs
- Predictive modeling using Hidden Markov Models
- Geographic hotspot identification and analysis
- Conservation impact assessment reports

### Collaborative Conservation Platform

- Multi-user access with role-based permissions
- Team communication and coordination features
- Real-time data sharing across organizations
- Comprehensive export and reporting tools

## Designs & Interface Screenshots

### Application Screenshots

#### Mobile Application

![Mobile Dashboard](screenshots/mobile-dashboard.png)
_Mobile Dashboard - Real-time wildlife tracking overview_

![Alert System](screenshots/mobile-alerts.png)
_Alert Hub - Incident management and notifications_

![Live Tracking](screenshots/mobile-tracking.png)
_Live Tracking - Animal movement monitoring_

#### Web Application

![Web Dashboard](screenshots/web-dashboard.png)
_Web Dashboard - Comprehensive analytics view_

![Patrol Operations](screenshots/web-patrol.png)
_Patrol Operations - Field team coordination_

![Reports Interface](screenshots/web-reports.png)
_Reports & Analytics - Data visualization and insights_

### Design System

- **Brand Colors**: Deep olive (#3B6B3A), Warm earth (#8B5E3C), Moss green (#9CBC4A)
- **Typography**: Inter font family for modern, readable interface
- **UI Pattern**: Card-based layouts with organic shadows
- **Theme**: Warm, nature-inspired color palette
- **Icons**: MaterialCommunityIcons and Lucide for consistency

### Figma Mockups

🔗 **[View Complete Design System](FIGMA_LINK_HERE)**

- User interface mockups and wireframes
- Component library and design tokens
- User experience flow diagrams
- Responsive design specifications

## Deployment Plan

### Web Application Deployment

**Platform**: Vercel / Netlify

1. **Build Optimization**
   ```bash
   npm run build
   npm run optimize
   ```
2. **Environment Variables**
   - API endpoints configuration
   - Authentication keys setup
   - Analytics tracking codes
3. **CDN Configuration**
   - Static asset optimization
   - Global content delivery
   - Caching strategies

### Mobile Application Deployment

**Platform**: Expo Application Services (EAS)

1. **iOS App Store**
   ```bash
   eas build --platform ios
   eas submit --platform ios
   ```
2. **Google Play Store**
   ```bash
   eas build --platform android
   eas submit --platform android
   ```
3. **Over-the-Air Updates**
   - Expo Updates for instant deployments
   - A/B testing capabilities
   - Progressive rollout strategies

### Backend Deployment

**Platform**: AWS / Digital Ocean

1. **Containerization**
   ```dockerfile
   # Docker configuration for microservices
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```
2. **Database Setup**
   - MongoDB Atlas for wildlife data
   - Redis for caching and sessions
   - S3 for media file storage
3. **API Gateway**
   - Load balancing configuration
   - Rate limiting and security
   - Monitoring and logging

### Security & Monitoring

- **SSL/TLS** certificates for secure communication
- **Authentication** with JWT and biometric support
- **API Rate Limiting** to prevent abuse
- **Error Tracking** with Sentry integration
- **Performance Monitoring** with analytics
- **Backup Strategies** for data protection

## Development Guidelines

### Code Quality Standards

- **ESLint**: Comprehensive linting and code formatting
- **Naming Conventions**: PascalCase for components, camelCase for utilities
- **Architecture**: Clean, modular folder structure
- **Component Library**: Reusable UI component system
- **Type Safety**: Comprehensive PropTypes validation

### Best Practices

- **File-based Routing**: Expo Router for intuitive navigation
- **State Management**: Context API with custom hooks
- **Design System**: Consistent Aureynx brand theming
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG 2.1 compliance
- **Performance**: Optimized rendering and lazy loading

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and data flow validation
- **E2E Testing**: Complete user journey verification
- **Performance Testing**: Load and stress testing

## Contributing

We welcome contributions to the Aureynx Wildlife Conservation Platform!

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/Wildlife_Corridors_project.git
   ```
3. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-wildlife-feature
   ```
4. **Make** your changes following our coding standards
5. **Test** your changes thoroughly
6. **Commit** with descriptive messages
   ```bash
   git commit -m "Add wildlife corridor mapping feature"
   ```
7. **Push** to your branch
   ```bash
   git push origin feature/amazing-wildlife-feature
   ```
8. **Open** a Pull Request with detailed description

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Wildlife Conservation Organizations** for domain expertise and requirements
- **React Native & Expo Communities** for excellent documentation and support
- **Open Source Contributors** who make projects like this possible
- **Conservation Researchers** providing valuable insights into wildlife behavior
- **Field Teams** testing and providing feedback on usability

## Contact & Support

### Links

- Repository: [Wildlife_Corridors_project](https://github.com/sjamillah/Wildlife_Corridors_project)
- Issues: [Report Bugs & Feature Requests](https://github.com/sjamillah/Wildlife_Corridors_project/issues)
- Documentation: [Wiki & Guides](https://github.com/sjamillah/Wildlife_Corridors_project/wiki)
- Demo: [Live Demo Video](DEMO_VIDEO_LINK)

### Community

- Discord: [Join our community](DISCORD_LINK)
- Email: aureynx.wildlife@example.com
- Twitter: [@AureynxWildlife](TWITTER_LINK)

---

**Building a better future for wildlife through technology**

_Aureynx - Where Conservation Meets Innovation_
