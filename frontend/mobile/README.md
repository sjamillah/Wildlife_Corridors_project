# Wildlife Corridors Mobile Application

React Native mobile application for wildlife conservation field work with offline capabilities, real-time tracking, and AI-powered predictions. Built with Expo and featuring passwordless OTP authentication for secure access in remote locations.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Environment Configuration](#environment-configuration)
4. [Authentication](#authentication)
5. [Backend Integration](#backend-integration)
6. [API Endpoints](#api-endpoints)
7. [Service Files](#service-files)
8. [Offline Support](#offline-support)
9. [Features](#features)
10. [Development](#development)
11. [Building for Production](#building-for-production)
12. [Project Structure](#project-structure)
13. [Troubleshooting](#troubleshooting)
14. [Dependencies](#dependencies)

---

## Quick Start

### Prerequisites

- Node.js 16+ installed
- Expo Go app installed on your mobile device (iOS or Android)
- Backend server running (local or deployed)

### Installation Steps

```bash
# Navigate to mobile directory
cd frontend/mobile

# Install dependencies
npm install

# Install additional required packages
npm install axios @react-native-async-storage/async-storage @react-native-community/netinfo

# Start development server
npx expo start
```

### Running the App

**NPM Commands:**

```bash
npm start          # Start with hot reload
npm run dev        # Start with cleared cache
npm run android    # Start on Android emulator
npm run ios        # Start on iOS simulator
```

**Connect Your Device:**

1. Install Expo Go app on your device
2. Scan QR code from terminal
3. App loads with hot reload enabled

**Hot Reload:**

- Changes automatically refresh when you save files
- Component state is preserved
- Updates appear in 1-2 seconds
- Press `r` to reload manually if needed

**Development Workflow:**

1. Make changes to any file in `app/`, `components/`, etc.
2. Save the file (Ctrl+S)
3. App automatically reloads on your device
4. Changes appear within 1-2 seconds

**Manual Reload:** Press `r` in terminal or shake device

**Reset Cache:** `npm run reset` if things break

**Environment Changes:** Restart server after modifying `.env`

---

## Installation

### Full Installation Process

```bash
# Clone repository
git clone <repository-url>

# Navigate to mobile frontend
cd frontend/mobile

# Install dependencies
   npm install

# Install critical dependencies if missing
npm install axios @react-native-async-storage/async-storage @react-native-community/netinfo

# Install Expo CLI globally (if not installed)
npm install -g expo-cli

# Start development server
   npx expo start
   ```

### Platform-Specific Setup

**iOS:**

- Requires macOS with Xcode installed
- Install CocoaPods: `sudo gem install cocoapods`
- Navigate to ios folder: `cd ios`
- Install pods: `pod install`

**Android:**

- Requires Android Studio with Android SDK
- Set ANDROID_HOME environment variable
- Build: `npx expo run:android`

---

## Environment Configuration

### Setting Up Environment Variables

Create a `.env` file in the `frontend/mobile` directory:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

For production deployment:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

### Using Environment Variables in Code

Environment variables are accessed via `process.env`:

```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
```

Note: In Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible.

### Configuration File

Alternative configuration in `app/constants/ApiEndpoints.js`:

```javascript
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
```

---

## Authentication

### Passwordless OTP-Based Authentication

The mobile application uses email-based One-Time Password (OTP) authentication. No passwords are stored or transmitted.

### Registration Flow

**Step 1: Send Registration OTP**

1. User provides email, name, and role
2. Backend sends 4-digit OTP to email
3. OTP valid for limited time (default: 10 minutes)

**Step 2: Verify OTP and Create Account**

1. User enters 4-digit code from email
2. Backend verifies OTP
3. Account created with JWT tokens

**Code Example:**

```javascript
import { auth } from "./app/services";

// Step 1: Send registration OTP
const result = await auth.sendRegistrationOTP({
  email: "ranger@wildlife.org",
  name: "John Doe",
  role: "ranger",
});

console.log(result.message); // "OTP sent successfully"
console.log(result.expires_in); // 600 (seconds)

// Step 2: Verify OTP and complete registration
const { token, user } = await auth.verifyRegistrationOTP(
  "ranger@wildlife.org",
  "1234",
  result.otp_id
);

// Tokens automatically stored in AsyncStorage
console.log(user.name); // "John Doe"
console.log(user.email); // "ranger@wildlife.org"
console.log(user.role); // "ranger"
```

### Login Flow

**Step 1: Send Login OTP**

1. User provides email
2. Backend sends 4-digit OTP to email

**Step 2: Verify OTP and Login**

1. User enters 4-digit code
2. Backend verifies OTP
3. User logged in with JWT tokens

**Code Example:**

```javascript
// Step 1: Send login OTP
const loginResult = await auth.login("ranger@wildlife.org");

console.log(loginResult.message); // "OTP sent successfully"

// Step 2: Verify OTP and login
const { token, user } = await auth.verifyLoginOTP(
  "ranger@wildlife.org",
  "5678",
  loginResult.otp_id
);

// User now authenticated
```

### Token Management

**Storage:**

- Access token: `AsyncStorage: authToken`
- Refresh token: `AsyncStorage: refreshToken`
- User profile: `AsyncStorage: userProfile`

**Auto-Refresh:**

- Tokens automatically refreshed on 401 errors
- Handled by axios interceptor in `api.js`

**Token Format:**

```
Authorization: Bearer <access_token>
```

### Logout

```javascript
await auth.logout();
// Clears all tokens and user data from AsyncStorage
```

### Authentication Helper Methods

```javascript
// Check if user is authenticated
const isAuth = await auth.isAuthenticated();

// Get stored token
const token = await auth.getToken();

// Get cached user profile
const profile = await auth.getProfile();

// Fetch fresh profile from server
const user = await auth.fetchProfile();
```

---

## Backend Integration

### Overview

The mobile app integrates with a Django REST backend using JWT authentication. All API calls are handled through service modules in `app/services/`.

### API Configuration

Configuration in `app/services/api.js`:

- Base URL from environment variable or default
- 30-second timeout for requests
- Automatic JWT token injection
- Auto-refresh on 401 errors
- Offline detection and handling

### Response Formats

**Standard Paginated Response:**

```json
{
  "count": 100,
  "next": "http://api.example.com/api/v1/animals/?page=2",
  "previous": null,
  "results": [...]
}
```

**Standard Detail Response:**

```json
{
  "id": 1,
  "name": "Elephant #1",
  "species": "elephant",
  "status": "active",
  ...
}
```

**Error Response:**

```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

### Network Status Monitoring

The app monitors network connectivity:

```javascript
import { networkMonitor } from "./app/utils/networkMonitor";

// Check if online
const isOnline = await networkMonitor.isConnected();

// Listen for network changes
networkMonitor.addListener((isConnected) => {
  console.log("Network status:", isConnected ? "Online" : "Offline");
});
```

---

## API Endpoints

### Status: Implemented and Working

#### System Endpoints

**Health Check**

- `GET /health/` - Backend health status

**API Root**

- `GET /` - Service information and endpoint list

#### Authentication Endpoints

**Registration (OTP-based)**

- `POST /api/v1/auth/register/` - Send registration OTP
- `POST /api/v1/auth/verify-otp/` - Verify OTP and complete registration

**Login (OTP-based)**

- `POST /api/v1/auth/login/` - Send login OTP
- `POST /api/v1/auth/login/verify/` - Verify login OTP

**Token Management**

- `POST /api/v1/auth/refresh/` - Refresh access token
- `POST /api/v1/auth/logout/` - Logout

**User Management**

- `GET /api/v1/auth/me/` - Get current user profile
- `POST /api/v1/auth/change-password/` - Change password

#### Animals Endpoints

**CRUD Operations**

- `GET /api/v1/animals/` - List all animals (with filters)
- `POST /api/v1/animals/` - Create new animal
- `GET /api/v1/animals/{id}/` - Get animal details
- `PUT /api/v1/animals/{id}/` - Update animal (full)
- `PATCH /api/v1/animals/{id}/` - Update animal (partial)
- `DELETE /api/v1/animals/{id}/` - Delete animal

**Special Endpoints**

- `GET /api/v1/animals/live_status/` - Real-time animal status with ML predictions

Returns:

- Current GPS position
- ML-predicted next position (BBMM/LSTM)
- Corridor status (inside/outside)
- Conflict risk assessment (Low/Medium/High)
- Movement metrics (speed, direction, battery)

#### Tracking Endpoints

**GPS Tracking**

- `GET /api/v1/tracking/` - List tracking data
- `POST /api/v1/tracking/` - Upload GPS data
- `GET /api/v1/tracking/{id}/` - Get tracking point details
- `PUT /api/v1/tracking/{id}/` - Update tracking point
- `DELETE /api/v1/tracking/{id}/` - Delete tracking point
- `GET /api/v1/tracking/live/` - Latest tracking data (last hour)

**ML Pipeline**

- `GET /api/v1/tracking/live_tracking/` - Full ML pipeline (HMM→BBMM→XGBoost→LSTM→RL)

**Field Observations**

- `GET /api/v1/tracking/observations/` - List observations
- `POST /api/v1/tracking/observations/` - Create observation
- `GET /api/v1/tracking/observations/{id}/` - Get observation details
- `PUT /api/v1/tracking/observations/{id}/` - Update observation
- `DELETE /api/v1/tracking/observations/{id}/` - Delete observation

#### Corridors Endpoints

**CRUD Operations**

- `GET /api/v1/corridors/` - List corridors
- `POST /api/v1/corridors/` - Create corridor
- `GET /api/v1/corridors/{id}/` - Get corridor details
- `PUT /api/v1/corridors/{id}/` - Update corridor
- `DELETE /api/v1/corridors/{id}/` - Delete corridor

**ML Optimization**

- `POST /api/v1/corridors/optimize/` - RL-based corridor optimization

Request format:

```json
{
  "species": "elephant",
  "start_point": { "lat": -1.2921, "lon": 36.8219 },
  "end_point": { "lat": -1.3921, "lon": 36.9219 },
  "steps": 50
}
```

#### Conflict Zones Endpoints

**CRUD Operations**

- `GET /api/v1/conflict-zones/` - List conflict zones
- `POST /api/v1/conflict-zones/` - Create conflict zone
- `GET /api/v1/conflict-zones/{id}/` - Get conflict zone details
- `PUT /api/v1/conflict-zones/{id}/` - Update conflict zone
- `PATCH /api/v1/conflict-zones/{id}/` - Update conflict zone (partial)
- `DELETE /api/v1/conflict-zones/{id}/` - Delete conflict zone

**Special Endpoints**

- `GET /api/v1/conflict-zones/geojson/` - Get zones as GeoJSON

#### Predictions Endpoints

**CRUD Operations**

- `GET /api/v1/predictions/` - List predictions
- `POST /api/v1/predictions/` - Create prediction
- `GET /api/v1/predictions/{id}/` - Get prediction details
- `PUT /api/v1/predictions/{id}/` - Update prediction
- `DELETE /api/v1/predictions/{id}/` - Delete prediction

**Special Endpoints**

- `POST /api/v1/predictions/corridor/` - Generate corridor prediction
- `GET /api/v1/predictions/history/` - Get prediction history

#### Synchronization Endpoints

**Sync Logs**

- `GET /api/v1/sync/logs/` - List sync logs
- `POST /api/v1/sync/logs/` - Create sync log
- `GET /api/v1/sync/logs/{id}/` - Get sync log details
- `GET /api/v1/sync/logs/recent/` - Get recent sync logs
- `GET /api/v1/sync/logs/stats/` - Get sync statistics

**Sync Queue**

- `GET /api/v1/sync/queue/` - List sync queue items
- `POST /api/v1/sync/queue/` - Add item to sync queue
- `GET /api/v1/sync/queue/{id}/` - Get queue item details
- `GET /api/v1/sync/queue/pending/` - Get pending sync items
- `GET /api/v1/sync/queue/failed/` - Get failed sync items
- `POST /api/v1/sync/queue/retry_failed/` - Retry all failed items
- `POST /api/v1/sync/queue/{id}/retry_item/` - Retry specific item

**Offline Data Upload**

- `POST /api/v1/sync/upload/` - Bulk upload offline data (animals, tracking, observations)

---

## Service Files

### Available Services

All services are located in `app/services/` and exported from `app/services/index.js`.

#### api.js

Core API client configuration:

- Axios instance with base URL and timeout
- Request interceptor for JWT token injection
- Response interceptor for error handling and token refresh
- Health check utility
- Network error handling

```javascript
import api, { API_BASE_URL, checkServerHealth } from "./app/services/api";

// Check backend health
const health = await checkServerHealth();
```

#### auth.js

Authentication service (OTP-based, passwordless):

- `sendRegistrationOTP({ email, name, role })` - Send registration OTP
- `verifyRegistrationOTP(email, code, otpId)` - Verify OTP and create account
- `login(email)` - Send login OTP
- `verifyLoginOTP(email, code, otpId)` - Verify login OTP
- `logout()` - Logout and clear tokens
- `fetchProfile()` - Get current user profile from server
- `changePassword(oldPassword, newPassword)` - Change password
- `refreshToken()` - Refresh access token
- `getToken()` - Get stored token
- `isAuthenticated()` - Check authentication status
- `getProfile()` - Get cached user profile

```javascript
import { auth } from "./app/services";

// Send login OTP
await auth.login("user@example.com");

// Verify and login
const { token, user } = await auth.verifyLoginOTP(
  "user@example.com",
  "1234",
  otpId
);
```

#### animals.js

Animal management service with response transformation:

- `getAll(filters)` - Get all animals with optional filters
- `getById(id)` - Get animal by ID
- `create(animalData)` - Create new animal
- `update(id, animalData)` - Update animal (full)
- `patch(id, partialData)` - Update animal (partial)
- `delete(id)` - Delete animal
- `getLiveStatus()` - Get real-time status with ML predictions
- `getBySpecies(species)` - Get animals by species
- `getActive()` - Get active animals only

The `getLiveStatus()` method includes automatic response transformation from nested backend structure to flat frontend structure.

```javascript
import { animals } from "./app/services";

// Get live status with ML predictions
const liveData = await animals.getLiveStatus();
// Returns: current_lat, current_lon, predicted_lat, predicted_lon, risk_level, etc.

// Get all elephants
const elephants = await animals.getAll({ species: "elephant" });
```

#### tracking.js

GPS tracking service:

- `getAll(filters)` - Get all tracking data
- `getById(id)` - Get tracking point by ID
- `create(trackingData)` - Upload GPS data
- `createBulk(trackingDataArray)` - Bulk upload GPS data
- `update(id, trackingData)` - Update tracking point
- `patch(id, partialData)` - Partial update tracking point
- `delete(id)` - Delete tracking point
- `getLive()` - Get live tracking data (last hour)
- `getLiveTracking()` - Get live tracking with full ML pipeline
- `getByAnimal(animalId, filters)` - Get tracking data for specific animal
- `getByDateRange(startDate, endDate, filters)` - Get tracking by date range

**Observations sub-service:**

- `observations.getAll(filters)` - Get all observations
- `observations.getById(id)` - Get observation by ID
- `observations.create(observationData)` - Create observation
- `observations.update(id, observationData)` - Update observation
- `observations.delete(id)` - Delete observation
- `observations.getByAnimal(animalId)` - Get observations for specific animal

```javascript
import tracking, { observations } from './app/services/tracking';

// Upload GPS point
await tracking.create({
  animal: animalId,
  lat: -1.2921,
  lon: 36.8219,
  altitude: 1500,
  timestamp: new Date().toISOString()
});

// Bulk upload
await tracking.createBulk([
  { animal: id1, lat: -1.2921, lon: 36.8219, ... },
  { animal: id2, lat: -1.3000, lon: 36.8300, ... }
]);

// Create field observation
await observations.create({
  animal: animalId,
  observation_type: 'sighting',
  description: 'Elephant herd near waterhole',
  lat: -1.2921,
  lon: 36.8219
});
```

#### corridors.js

Corridor management service:

- `getAll(filters)` - Get all corridors
- `getById(id)` - Get corridor by ID
- `create(corridorData)` - Create new corridor
- `update(id, corridorData)` - Update corridor
- `delete(id)` - Delete corridor
- `optimize({ species, startPoint, endPoint, steps })` - Optimize corridor using RL
- `getBySpecies(species)` - Get corridors by species
- `getActive()` - Get active corridors

```javascript
import { corridors } from "./app/services";

// Optimize corridor with RL
const optimized = await corridors.optimize({
  species: "elephant",
  startPoint: { lat: -1.2921, lon: 36.8219 },
  endPoint: { lat: -1.3921, lon: 36.9219 },
  steps: 50,
});
```

#### conflictZones.js

Conflict zone management service:

- `getAll(filters)` - Get all conflict zones
- `getById(id)` - Get conflict zone by ID
- `create(zoneData)` - Create new conflict zone
- `update(id, zoneData)` - Update conflict zone (full)
- `patch(id, partialData)` - Update conflict zone (partial)
- `delete(id)` - Delete conflict zone
- `getActive()` - Get active conflict zones
- `getByType(zoneType)` - Get zones by type
- `getHighSeverity()` - Get high severity zones

```javascript
import { conflictZones } from "./app/services";

// Get active conflict zones
const zones = await conflictZones.getActive();

// Get high severity zones
const dangerZones = await conflictZones.getHighSeverity();
```

#### predictions.js

ML predictions service:

- `getAll(filters)` - Get all predictions
- `getById(id)` - Get prediction by ID
- `create(predictionData)` - Create prediction
- `update(id, predictionData)` - Update prediction
- `delete(id)` - Delete prediction
- `predictCorridor({ species, startLat, startLon, steps, algorithm })` - Generate corridor prediction
- `getHistory(filters)` - Get prediction history
- `getCorridorPredictions()` - Get corridor predictions only
- `getByAnimal(animalId)` - Get predictions for specific animal
- `getByType(type)` - Get predictions by type
- `getAnimalPrediction(animalId)` - Get latest prediction for animal

Note: ML models (HMM, BBMM, XGBoost, LSTM, RL) are accessed through integrated endpoints:

- `animals.getLiveStatus()` - Includes BBMM/LSTM predictions
- `tracking.getLiveTracking()` - Full ML pipeline
- `corridors.optimize()` - RL optimization

```javascript
import { predictions } from "./app/services";

// Get prediction history
const history = await predictions.getHistory({ type: "corridor" });

// Get latest prediction for animal
const prediction = await predictions.getAnimalPrediction(animalId);
```

#### sync.js

Data synchronization service with comprehensive queue management:

**Sync Logs:**

- `getLogs(filters)` - Get all sync logs
- `getLogById(id)` - Get sync log by ID
- `getRecentLogs()` - Get recent sync logs
- `getStats()` - Get sync statistics

**Sync Queue:**

- `getQueue(filters)` - Get sync queue items
- `addToQueue(queueData)` - Add item to sync queue
- `getPendingItems()` - Get pending sync items
- `uploadOfflineData(data)` - Upload offline data to server

**Local Queue Management:**

- `addToLocalQueue(data)` - Add to local AsyncStorage queue
- `getLocalQueue()` - Get local queue items
- `clearLocalQueue()` - Clear local queue
- `syncLocalQueue()` - Sync local queue with server
- `autoSync()` - Auto-sync when online

```javascript
import { sync } from "./app/services";

// Add data to local queue (offline)
await sync.addToLocalQueue({
  type: "tracking",
  data: { animal: id, lat: -1.2921, lon: 36.8219 },
});

// Sync local queue when online
const result = await sync.syncLocalQueue();
// Returns: { success: true, synced: 5, response: {...} }

// Auto-sync with health check
const autoResult = await sync.autoSync();

// Get sync statistics
const stats = await sync.getStats();
// Returns: success_rate, total_items, synced_items, etc.
```

#### offlineSync.js

Offline data persistence service:

- `saveTrackingOffline(trackingData)` - Save tracking data offline
- `saveObservationOffline(observationData)` - Save observation offline
- `getOfflineTracking()` - Get offline tracking data
- `getOfflineObservations()` - Get offline observations
- `syncAllData()` - Sync all offline data when online
- `clearSyncedData()` - Clear synced offline data

```javascript
import { offlineSync } from "./app/services";

// Save tracking offline
await offlineSync.saveTrackingOffline({
  animal: animalId,
  lat: -1.2921,
  lon: 36.8219,
  timestamp: new Date().toISOString(),
});

// Sync when online
await offlineSync.syncAllData();
```

---

## Offline Support

### Overview

The mobile app includes comprehensive offline support for field work in areas with limited connectivity.

### Offline Storage

Uses `AsyncStorage` for persistent local storage:

- Tracking data
- Observations
- Animal data
- User profile

### Offline Queue

Data saved offline is queued for synchronization:

```javascript
import { offlineSync } from "./app/services";

// Save data while offline
await offlineSync.saveTrackingOffline({
  animal: animalId,
  lat: -1.2921,
  lon: 36.8219,
  altitude: 1500,
  timestamp: new Date().toISOString(),
  source: "mobile",
});

// Data automatically synced when connection restored
```

### Auto-Sync

The app automatically syncs when:

- Network connection is restored
- App returns to foreground
- Manual sync triggered by user

```javascript
// Manual sync trigger
await offlineSync.syncAllData();
```

### Sync Status

Track sync status in UI:

```javascript
import { useSync } from "./app/hooks";

const SyncComponent = () => {
  const { pending, syncing, sync } = useSync();

  return (
    <View>
      <Text>Pending: {pending.length} items</Text>
      <Button onPress={sync} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Now"}
      </Button>
    </View>
  );
};
```

### Network Detection

Automatic network status monitoring:

```javascript
import { networkMonitor } from "./app/utils/networkMonitor";

// Check connection
const isConnected = await networkMonitor.isConnected();

// Listen for changes
networkMonitor.addListener((isOnline) => {
  if (isOnline) {
    // Trigger sync
    offlineSync.syncAllData();
  }
});
```

### Offline Features

What works offline:

- View cached animal data
- Record GPS tracking points
- Create field observations
- View recent tracking history
- View user profile

What requires online:

- Real-time ML predictions
- Corridor optimization
- Authentication
- Initial data loading

---

## Features

### Real-Time Wildlife Tracking

- GPS tracking with automatic location updates
- Manual tracking point creation
- Bulk tracking data upload
- Real-time animal positions on map
- Color-coded markers:
  - Green: Safe (inside corridor)
  - Orange: Caution (outside corridor)
  - Red: Danger (near conflict zone)
- Predicted movement paths
- Battery and signal monitoring

### AI-Powered Predictions

**Machine Learning Models:**

1. **HMM (Hidden Markov Model)** - Behavioral state classification
2. **BBMM (Brownian Bridge Movement Model)** - Movement path prediction
3. **XGBoost** - Environmental factor analysis
4. **LSTM** - Continuous learning for position prediction
5. **RL (Reinforcement Learning)** - Corridor optimization

Accessed through:

- `animals.getLiveStatus()` - Real-time predictions
- `tracking.getLiveTracking()` - Full ML pipeline
- `corridors.optimize()` - RL-based corridor optimization

### Field Data Collection

- Create field observations
- Photo capture for observations
- GPS-tagged observations
- Species identification
- Behavior notes
- Health assessments
- Conflict incident reporting

### Conservation Management

- Wildlife corridor visualization
- Conflict zone mapping
- Risk assessment alerts
- Patrol route tracking
- Emergency alerts
- Team coordination

### Offline Capabilities

- Offline data collection
- Automatic sync when online
- Cached data viewing
- Offline map tiles (if configured)
- Local data persistence

### User Interface

- Native mobile UI with React Native
- Dark mode support
- Responsive design for all screen sizes
- Bottom tab navigation
- Haptic feedback
- Pull-to-refresh
- Loading states and error handling

---

## Development

### Starting Development Server with Hot Reload

**Commands:**

```bash
npm start          # Start with hot reload (default)
npm run dev        # Start with cleared cache
npm run android    # Start on Android device/emulator
npm run ios        # Start on iOS device/simulator
npm run web        # Start in web browser
npm run reset      # Clear cache and restart
```

**What Gets Watched:**

Expo automatically watches and hot reloads changes in:

- `app/**/*` - All app screens and routes
- `components/**/*` - All UI components
- `services/**/*` - API service files
- `hooks/**/*` - Custom React hooks
- `contexts/**/*` - React context providers
- `constants/**/*` - Constants and configuration
- `utils/**/*` - Utility functions

**How Hot Reload Works:**

1. Make changes to any watched file
2. Save the file (Ctrl+S or auto-save)
3. Metro bundler detects changes
4. App automatically updates on your device (1-2 seconds)
5. Component state is preserved (Fast Refresh)

**Requires Manual Reload:**

Press `r` in terminal after changing:

- `.env` - Environment variables
- `app.json` - App configuration
- `package.json` - Dependencies
- `babel.config.js` - Babel settings
- Native modules

**Terminal Commands While Running:**

- `r` - Reload app manually
- `m` - Toggle developer menu
- `d` - Open developer tools
- `Ctrl+C` - Stop server

### Development Modes

**Development:**

```bash
npx expo start
```

**Production Preview:**

```bash
npx expo start --no-dev --minify
```

### Live Reload

Expo automatically reloads on file changes. Manual reload:

- Android: Press `r` in terminal or shake device
- iOS: Press `r` in terminal or shake device

### Debugging

**React Native Debugger:**

```bash
# Install React Native Debugger
# Download from: https://github.com/jhen0409/react-native-debugger/releases

# Enable debugging in app (shake device > Debug)
```

**Chrome DevTools:**

```bash
# Open Chrome DevTools
# Shake device > Debug Remote JS
```

**Console Logging:**

```javascript
console.log("Debug message");
console.error("Error message");
console.warn("Warning message");
```

### Hot Reload

Fast Refresh is enabled by default. To disable:

```javascript
// In app.json
{
  "expo": {
    "updates": {
      "fallbackToCacheTimeout": 0
    }
  }
}
```

---

## Building for Production

### Android Build

**Development Build:**

```bash
npx expo run:android
```

**Production APK:**

```bash
# Build APK
eas build --platform android --profile production

# Or local build
npx expo build:android
```

**Production AAB (for Google Play):**

```bash
eas build --platform android --profile production
```

### iOS Build

**Development Build:**

```bash
npx expo run:ios
```

**Production IPA:**

```bash
# Build for App Store
eas build --platform ios --profile production

# Or local build
npx expo build:ios
```

### EAS Build Configuration

Create `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-production-backend.com"
      }
    }
  }
}
```

### Over-The-Air (OTA) Updates

```bash
# Publish update
eas update --branch production --message "Bug fixes"

# Users receive update automatically
```

---

## Project Structure

```
frontend/mobile/
├── android/                     # Android native code
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── java/
│   │   │   │   └── res/
│   │   └── build.gradle
│   └── build.gradle
│
├── ios/                         # iOS native code
│   ├── AureynxWildlifeCorridors/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   └── Images.xcassets/
│   └── AureynxWildlifeCorridors.xcodeproj/
│
├── app/                         # Main application code
│   ├── screens/                # Screen components
│   │   ├── (tabs)/            # Tab screens
│   │   │   ├── _layout.jsx
│   │   │   ├── DashboardScreen.jsx
│   │   │   ├── MapScreen.jsx
│   │   │   ├── AlertsScreen.jsx
│   │   │   ├── FieldDataScreen.jsx
│   │   │   └── ProfileScreen.jsx
│   │   │
│   │   ├── auth/              # Authentication screens
│   │   │   ├── SignInScreen.jsx
│   │   │   └── SignUpScreen.jsx
│   │   │
│   │   └── emergency/         # Emergency screens
│   │       ├── PanicAlertScreen.jsx
│   │       └── EmergencyContactScreen.jsx
│   │
│   ├── services/              # API services
│   │   ├── api.js            # Axios configuration
│   │   ├── auth.js           # Authentication
│   │   ├── animals.js        # Animal management
│   │   ├── tracking.js       # GPS tracking
│   │   ├── corridors.js      # Corridor management
│   │   ├── conflictZones.js  # Conflict zones
│   │   ├── predictions.js    # ML predictions
│   │   ├── sync.js           # Data synchronization
│   │   ├── offlineSync.js    # Offline support
│   │   └── index.js          # Service exports
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useAnimals.js
│   │   ├── useSync.js
│   │   └── index.js
│   │
│   ├── utils/                # Utility functions
│   │   └── networkMonitor.js
│   │
│   ├── constants/            # Constants
│   │   └── ApiEndpoints.js
│   │
│   ├── _layout.jsx           # Root layout
│   ├── index.jsx             # Entry screen
│   └── +not-found.jsx        # 404 screen
│
├── components/               # Reusable components
│   ├── ui/                  # UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Icon.jsx
│   │   ├── Input.jsx
│   │   └── ...
│   │
│   ├── maps/                # Map components
│   │   ├── MapboxMap.jsx
│   │   ├── OSMMap.jsx
│   │   └── SmartMap.jsx
│   │
│   ├── ThemedText.jsx
│   └── ThemedView.jsx
│
├── contexts/                # React contexts
│   ├── AlertsContext.js
│   └── ThemeContext.js
│
├── constants/               # App constants
│   ├── Colors.js
│   ├── Icons.js
│   └── index.js
│
├── assets/                  # Static assets
│   ├── images/
│   │   ├── icon.png
│   │   ├── Aureynx_Logo.png
│   │   └── ele_background.jpg
│   └── fonts/
│       └── SpaceMono-Regular.ttf
│
├── .env                     # Environment variables (create this)
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler config
├── tailwind.config.js       # Tailwind CSS config
├── global.css               # Global styles
└── README.md                # This file
```

---

## Troubleshooting

### Backend Connection Issues

**Symptoms:**

- Network errors
- "Failed to fetch" errors
- Timeout errors
- No data loading

**Solutions:**

1. Check backend is running:

   ```bash
   curl http://localhost:8000/health/
   ```

2. Verify `.env` configuration:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

3. For Android emulator, use `10.0.2.2` instead of `localhost`:

   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
   ```

4. For iOS simulator, `localhost` works

5. For physical devices, use computer's IP address:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
   ```

6. Check firewall settings

7. Verify backend allows CORS from mobile origin

### Authentication Issues

**Symptoms:**

- Login fails
- OTP not received
- Token errors
- Logged out frequently

**Solutions:**

1. Check email configuration in backend

2. Verify OTP codes are being sent

3. Check backend logs for errors

4. Clear AsyncStorage:

   ```javascript
   import AsyncStorage from "@react-native-async-storage/async-storage";
   await AsyncStorage.clear();
   ```

5. Restart app after clearing storage

6. Verify JWT_SECRET is set in backend

7. Check token expiration settings

### Offline Sync Issues

**Symptoms:**

- Data not syncing
- Sync fails
- Duplicate data
- Missing data

**Solutions:**

1. Check network connection

2. Verify backend is accessible

3. Check AsyncStorage:

   ```javascript
   import { offlineSync } from "./app/services";
   const pending = await offlineSync.getOfflineTracking();
   console.log("Pending items:", pending.length);
   ```

4. Manual sync:

   ```javascript
   await offlineSync.syncAllData();
   ```

5. Check backend logs for sync errors

6. Clear sync queue if corrupted:
   ```javascript
   await offlineSync.clearSyncedData();
   ```

### Build Errors

**Symptoms:**

- Build fails
- Metro bundler errors
- Dependency conflicts

**Solutions:**

1. Clear cache:

   ```bash
npx expo start --clear
```

2. Reinstall dependencies:

```bash
   rm -rf node_modules
   npm install
   ```

3. Clear watchman cache:

   ```bash
   watchman watch-del-all
   ```

4. Reset bundler:

   ```bash
   npx expo start --clear --reset-cache
   ```

5. Check Node.js version compatibility

6. Verify all dependencies are installed

### Map Display Issues

**Symptoms:**

- Map not showing
- Markers not visible
- Map tiles not loading

**Solutions:**

1. Check map component is imported correctly

2. Verify GPS permissions are granted

3. Check coordinates are valid

4. Verify map library is installed:

   ```bash
   npm install react-native-maps
   ```

5. Check map API keys (if using Mapbox/Google Maps)

6. Test with different map provider

### Performance Issues

**Symptoms:**

- Slow app performance
- Laggy scrolling
- High memory usage
- Battery drain

**Solutions:**

1. Enable Hermes engine (usually enabled by default)

2. Optimize re-renders:

   ```javascript
   import { memo } from "react";
   export default memo(Component);
   ```

3. Use FlatList for long lists

4. Implement virtualization

5. Reduce image sizes

6. Use production build for testing

7. Profile with React DevTools

---

## Dependencies

### Core Dependencies

**React & React Native:**

- react: Latest
- react-native: Latest (via Expo)
- expo: 51+

**HTTP Client:**

- axios: 1.x

**Storage:**

- @react-native-async-storage/async-storage: Latest

**Network:**

- @react-native-community/netinfo: Latest

### Navigation

**React Navigation:**

- @react-navigation/native: Latest
- @react-navigation/bottom-tabs: Latest
- @react-navigation/stack: Latest

### UI Libraries

**Styling:**

- tailwindcss: 3.x (via NativeWind)
- nativewind: Latest

**Icons:**

- @expo/vector-icons: Latest

### Maps

**React Native Maps:**

- react-native-maps: Latest

### Development Tools

**Build Tools:**

- @expo/metro-config: Latest
- metro-config: Latest

**TypeScript (Optional):**

- typescript: Latest
- @types/react: Latest
- @types/react-native: Latest

### Installation

Install all dependencies:

```bash
npm install
```

Install additional required packages:

```bash
npm install axios @react-native-async-storage/async-storage @react-native-community/netinfo
```

---

## Color Scheme

The application uses consistent colors for wildlife conservation features:

- **Safe (in corridor):** Emerald Green (#10b981)
- **Caution (outside corridor):** Bright Orange (#f97316)
- **Danger (near conflict):** Crimson Red (#dc2626)
- **Corridors:** Sky Blue (#0ea5e9)
- **Predictions:** Purple (#a855f7)
- **Rangers/Patrols:** Cyan (#06b6d4)

---

## License

MIT License

Copyright (c) 2025 Wildlife Corridors Project

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## Support

For help with integration or deployment:

1. Check troubleshooting section above

2. Review backend logs for errors

3. Test backend health: `curl http://localhost:8000/health/`

4. Check API documentation at `http://localhost:8000/api/docs/`

5. Verify environment configuration

---

## About

The Wildlife Corridors Mobile Application provides field rangers and conservationists with powerful tools to monitor and protect wildlife in remote locations with limited connectivity.

**Key Capabilities:**

- Offline GPS tracking and data collection
- Real-time animal position monitoring
- ML-powered movement predictions
- Conflict zone detection and alerts
- Field observation recording
- Automatic data synchronization
- Emergency alert system
- Team coordination tools

**Technology Stack:**

- Frontend: React Native with Expo
- Storage: AsyncStorage for offline persistence
- Maps: React Native Maps
- Backend: Django REST Framework
- ML: HMM, BBMM, XGBoost, LSTM, Reinforcement Learning
- Authentication: JWT with OTP-based passwordless login

**Built for:**

Wildlife conservation field operations, national parks, research teams, and conservation organizations working to protect endangered species in remote locations.

---

**Wildlife Corridors Mobile Application - Built with React Native and Expo for reliable field data collection with offline support.**
