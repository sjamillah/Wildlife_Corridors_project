# Aureynx Wildlife Conservation Platform (Web Application)

## Overview

The Aureynx Web Application is a comprehensive dashboard for wildlife conservation management, providing real-time monitoring, analytics, and operational control for wildlife corridor protection. Built with React and modern web technologies, this application serves as the central command center for conservation teams, rangers, and administrators.

## Purpose

This web platform enables conservation organizations to monitor wildlife corridors, track animal movements, manage patrol operations, respond to security threats, and analyze conservation data through an intuitive browser-based interface. The system integrates real-time tracking data, alert management, and analytics into a unified operational dashboard.

## Technology Stack

**Frontend Framework**: React 19.1.1 with modern hooks and functional components

**Build System**: CRACO (Create React App Configuration Override) 7.1.0

**Routing**: React Router DOM 7.9.3 for single-page application navigation

**Mapping**: Leaflet 1.9.4 and React Leaflet 5.0.0 for interactive geospatial visualization

**Styling**: Tailwind CSS 3.4.17 with custom design system and CSS variables

**Icons**: Lucide React 0.544.0 for consistent iconography

**Development Tools**: ESLint for code quality, PostCSS for CSS processing

## Project Structure

```
frontend/web/
  public/
    assets/
      Aureynx_Logo.webp
      ele_background.jpg
    index.html
    manifest.json
  src/
    components/
      shared/
        MapComponent.jsx      (Leaflet map integration)
        Sidebar.jsx           (Navigation sidebar)
        Icons.js              (Icon exports)
      alerts/                 (Alert-specific components)
      analytics/              (Analytics visualizations)
      dashboard/              (Dashboard widgets)
      patrol/                 (Patrol operations UI)
      reports/                (Report components)
      settings/               (Settings interfaces)
      team/                   (Team management)
    screens/
      auth/
        Auth.jsx              (Authentication router)
        Login.jsx             (Login interface)
        Register.jsx          (Registration form)
        ForgotPassword.jsx    (Password recovery)
        OTPVerification.jsx   (Two-factor authentication)
        VerificationMethodSelection.jsx
      main/
        Dashboard.jsx         (Main dashboard)
      wildlife/
        WildlifeTracking.jsx  (Animal tracking)
        AlertHub.jsx          (Alert management)
      operations/
        LiveTracking.jsx      (Device tracking)
        PatrolOperations.jsx  (Patrol management)
        Analytics.jsx         (Analytics dashboard)
      management/
        Settings.jsx          (System settings)
        Reports.jsx           (Report generation)
        TeamManagement.jsx    (Team administration)
    constants/
      Colors.js               (Centralized color system)
      Animals.js              (Wildlife species data)
    services/
      auth.js                 (Authentication service)
    styles/
      leaflet-overrides.css   (Map styling)
    App.jsx                   (Root component)
    App.css                   (Global styles)
    index.jsx                 (Application entry point)
```

## Core Features

### Real-Time Wildlife Monitoring

Track animal movements across conservation areas with interactive mapping, species-specific markers, and live location updates. The system displays movement patterns, corridor usage statistics, and behavioral indicators to support immediate decision-making.

### Alert and Incident Management

Comprehensive alert system for security threats, poaching incidents, fence breaches, and wildlife emergencies. Alerts are categorized by severity, tracked through resolution, and mapped geographically for rapid response coordination.

### Patrol Operations

Manage ranger patrols, track patrol routes, monitor team status, and coordinate rapid response deployments. The patrol interface provides real-time visibility into field operations and enables efficient resource allocation.

### Analytics and Reporting

Data-driven insights through interactive charts, trend analysis, and comprehensive reporting tools. Analytics cover corridor effectiveness, animal behavior patterns, security metrics, and conservation impact assessment.

### Device Management

Monitor GPS tracking devices, ranger equipment, and sensor networks. Track battery levels, signal strength, connectivity status, and device health across the conservation network.

### Team and Settings Management

User administration, role-based access control, system configuration, and preference management. Administrators can manage team members, configure alert thresholds, and customize operational parameters.

## Design System

### Color Palette

The application uses an earth-tone conservation palette designed for clarity and professional presentation:

**Primary Colors**:
Forest Green (#2E5D45) for primary actions and headers
Burnt Orange (#D84315) for alerts and critical actions
Terracotta (#C1440E) for secondary accents
Ochre (#E8961C) for warnings and highlights

**Background Colors**:
Cream (#F5F1E8) for main background
Beige (#E8E3D6) for sidebar and secondary surfaces
White (#FFFFFF) for cards and content areas
Secondary (#FAFAF8) for subtle backgrounds

**Status Colors**:
Success (#10B981) for positive indicators
Warning (#F59E0B) for caution states
Error (#EF4444) for critical issues
Info (#3B82F6) for informational elements

**Text Colors**:
Primary (#2C2416) for main content
Secondary (#6B5E4F) for supporting text
Tertiary (#4A4235) for metadata

### Typography

Inter font family for clean, professional readability across all interface elements. Font weights range from 400 (regular) to 800 (extra bold) to establish clear visual hierarchy.

### Layout Principles

Consistent spacing using multiples of 4px for harmonious composition. Card-based design with subtle borders and shadows. Responsive grid systems that adapt to different screen sizes. Fixed sidebar navigation with content areas that scroll independently.

## Installation and Setup

### Prerequisites

Node.js version 16.0.0 or higher installed on your system. Package manager npm (included with Node.js) or yarn. Git for version control and repository management.

### Installation Steps

Clone the repository and navigate to the web application directory:

```
git clone https://github.com/sjamillah/Wildlife_Corridors_project.git
cd Wildlife_Corridors_project/frontend/web
```

Install all required dependencies:

```
npm install
```

### Development Server

Start the development server with hot reloading:

```
npm start
```

Or use the alias:

```
npm run dev
```

The application will open automatically in your default browser at http://localhost:3000. The development server includes fast refresh for instant updates when you save files.

### Production Build

Create an optimized production build:

```
npm run build
```

The build output will be created in the `build/` directory, ready for deployment to any static hosting service.

### Testing

Run the test suite:

```
npm test
```

### Code Analysis

Analyze bundle size and composition:

```
npm run analyze
```

Generate HTML bundle analysis report:

```
npm run analyze:html
```

## Configuration

### CRACO Configuration

The application uses CRACO for customizing Create React App configuration without ejecting. Configuration is defined in `craco.config.js` for path aliases and build customization.

### Tailwind Configuration

Tailwind CSS is configured in `tailwind.config.js` with custom color themes matching the Aureynx design system. The configuration includes responsive breakpoints and custom utility classes.

### Environment Variables

Create a `.env` file in the root directory for environment-specific configuration:

```
REACT_APP_API_URL=your_api_endpoint
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_ENV=development
```

## Authentication

The application implements a secure authentication flow with multiple verification options:

### Login Flow

Users authenticate with email and password. Successful authentication stores a token in localStorage and redirects to the dashboard. Failed attempts display clear error messages.

### Two-Factor Authentication

Optional OTP (One-Time Password) verification via email or SMS for enhanced security. Users can choose their preferred verification method and receive a 6-digit code with 60-second validity.

### Password Recovery

Self-service password reset through email verification. Users receive password reset instructions at their registered email address.

### Session Management

Authenticated sessions persist across browser sessions using localStorage. Sessions expire based on token validity. Logout clears all authentication data and returns users to the login screen.

## Map Integration

### Leaflet Implementation

Interactive maps powered by Leaflet library with satellite imagery, terrain layers, and custom wildlife markers. Maps support zoom, pan, and click interactions with smooth animations.

### Geographic Boundaries

The application focuses on the Kenya-Tanzania Wildlife Corridor with defined bounding box:

Minimum Longitude: 29.0
Maximum Longitude: 42.0
Minimum Latitude: -12.0
Maximum Latitude: 5.5

Maps automatically center on this corridor and restrict panning to keep focus on the conservation area.

### Map Features

Custom animated markers for animals, rangers, and alerts. Patrol routes displayed as colored polylines with glow effects. Wildlife corridors shown as semi-transparent overlays. Interactive popups showing detailed information on click. Zoom controls and layer toggles for customized views.

## Development Guidelines

### Code Style

Follow React best practices with functional components and hooks. Use meaningful variable and function names that clearly describe purpose. Implement proper error handling and loading states. Maintain consistent file organization following the established structure.

### Component Development

Create reusable components in the `components/` directory. Keep components focused and single-purpose. Use the centralized Colors.js for all color values. Implement proper prop validation and default props.

### State Management

Use React hooks (useState, useEffect, useContext) for local state. Implement custom hooks for shared logic. Keep state as close to usage as possible. Use useNavigate for programmatic navigation.

### Performance Optimization

Implement lazy loading for route components. Use React.memo for expensive render operations. Optimize images and assets for web delivery. Monitor bundle size and split code where beneficial.

## Deployment

### Build Process

Run the production build command which optimizes code, minifies assets, and generates static files:

```
npm run build
```

### Hosting Options

The built application can be deployed to any static hosting service including Vercel, Netlify, AWS S3, GitHub Pages, or traditional web servers. Simply upload the contents of the `build/` directory.

### Environment Configuration

Configure environment-specific variables for production deployment. Ensure API endpoints point to production backend services. Set appropriate security headers and CORS policies. Enable HTTPS for secure communication.

## Browser Support

The application supports modern browsers including Chrome, Firefox, Safari, and Edge. Minimum browser versions follow standard React compatibility requirements. Mobile browsers are supported for responsive access.

## Support and Contribution

Refer to the main project README.md and CONTRIBUTING.md files in the repository root for contribution guidelines, issue reporting, and support channels.

## License

This project is part of the Aureynx Wildlife Conservation Platform. Refer to the LICENSE file in the repository root for licensing information.

## Related Documentation

Main Project README: See repository root README.md for complete project overview
Mobile Application: See frontend/mobile/README.md for mobile app documentation
HMM Analysis: See HMM_Dataset.md for wildlife movement analysis details
Contributing Guide: See CONTRIBUTING.md for development and contribution guidelines
