# Wildlife Corridors Project - Component Organization

## 📁 Folder Structure by Use Case

### 🔐 Authentication (`/screens/auth/`)

- `Auth.jsx` - Main authentication screen with login/register
- `AuthScreens.jsx` - Additional authentication screens

### 🦏 Wildlife Management (`/screens/wildlife/`)

- `WildlifeTracking.jsx` - Animal tracking and monitoring
- `AlertHub.jsx` - Wildlife alerts and incident management

### 🚁 Operations (`/screens/operations/`)

- `PatrolOperations.jsx` - Field patrol coordination
- `Analytics.jsx` - Data analysis and reporting dashboard

### 👥 Management (`/screens/management/`)

- `TeamManagement.jsx` - Staff and team administration
- `Reports.jsx` - Report generation and management
- `Settings.jsx` - System configuration and preferences

### 🧩 Shared Components (`/components/shared/`)

- `Sidebar.jsx` - Main navigation sidebar (formerly TrackingSidebar)
- `Card.jsx` - Reusable card container component
- `Button.jsx` - Customizable button component with variants
- `SearchBar.jsx` - Search input with icon support

### 📊 Analytics Components (`/components/analytics/`)

- `MetricCard.jsx` - Statistical metric display cards
- `ChartContainer.jsx` - Chart wrapper with title and actions

### 👥 Team Components (`/components/team/`)

- `MemberCard.jsx` - Individual team member profile cards
- `TeamCard.jsx` - Team overview and management cards

### 📄 Report Components (`/components/reports/`)

- `ReportCard.jsx` - Individual report display and download
- `ReportCategoryCard.jsx` - Report category selection cards

### 🚁 Patrol Components (`/components/patrol/`)

- `PatrolCard.jsx` - Patrol mission status and management

### ⚙️ Settings Components (`/components/settings/`)

- `SettingsSection.jsx` - Grouped settings container
- `ToggleSwitch.jsx` - Toggle switch for boolean settings

## 🎯 Component Relationships

### Shared Usage:

- **Sidebar**: Used across all main screens for navigation
- **Card**: Base component used by all specialized card components
- **Button**: Used throughout the application for actions
- **SearchBar**: Used in team management, reports, and alert sections

### Screen-Specific Components:

- **Wildlife screens** use alert and tracking components
- **Operations screens** use analytics and patrol components
- **Management screens** use team, report, and settings components

## 🔄 Import Structure

```javascript
// Shared components (used everywhere)
import Sidebar from "../../components/shared/Sidebar";
import Card from "../shared/Card";
import Button from "../shared/Button";

// Screen-specific components
import MetricCard from "../../components/analytics/MetricCard";
import MemberCard from "../../components/team/MemberCard";
import ReportCard from "../../components/reports/ReportCard";
```

## 🚀 Benefits of This Organization

1. **Clear Separation of Concerns**: Each folder contains components for specific functionality
2. **Reusability**: Shared components prevent code duplication
3. **Maintainability**: Easy to locate and modify components
4. **Scalability**: Easy to add new features in appropriate folders
5. **Team Collaboration**: Clear ownership and responsibility areas

## 📋 Component Inventory

### Total Components: 15

- Shared: 4 components
- Analytics: 2 components
- Team: 2 components
- Reports: 2 components
- Patrol: 1 component
- Settings: 2 components

### Total Screens: 8

- Authentication: 2 screens
- Wildlife: 2 screens
- Operations: 2 screens
- Management: 3 screens
- Dashboard: 1 screen (root level)

This organization ensures clean, maintainable, and scalable code structure that follows best practices for React application architecture.
