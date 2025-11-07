# Wildlife Corridors Web Dashboard

Professional React web application for wildlife conservation management, real-time tracking, and AI-powered analytics. Features passwordless authentication, interactive maps, ML predictions, and comprehensive monitoring tools.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Configuration](#environment-configuration)
3. [Backend Integration](#backend-integration)
4. [Authentication](#authentication)
5. [API Endpoints](#api-endpoints)
6. [Service Files](#service-files)
7. [Features](#features)
8. [Testing Integration](#testing-integration)
9. [Development](#development)
10. [Production Deployment](#production-deployment)
11. [Project Structure](#project-structure)
12. [Troubleshooting](#troubleshooting)
13. [Dependencies](#dependencies)

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend/web
npm install --legacy-peer-deps
```

### 2. Configure Environment

Create a `.env.local` file in the `frontend/web` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

For production deployment:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

### 3. Start Development Server

```bash
npm start
```

Application will be available at http://localhost:3000

### 4. Verify Backend Integration

Open browser console (F12) and run:

```javascript
window.IntegrationCheck.runFullCheck()
```

This will test all backend endpoints and display a detailed report.

---

## Environment Configuration

### Required Variables

**REACT_APP_API_URL** - Backend API base URL

Development:
```env
REACT_APP_API_URL=http://localhost:8000
```

Production:
```env
REACT_APP_API_URL=https://your-production-backend.com
```

### Optional Variables

```env
# Enable debug mode for detailed API logs
REACT_APP_DEBUG=true

# Set default map center (latitude, longitude)
REACT_APP_DEFAULT_MAP_CENTER=-2.0,37.0

# Set default map zoom level
REACT_APP_DEFAULT_MAP_ZOOM=7
```

### Setup Instructions

1. Create `.env.local` file in `frontend/web/` directory
2. Add required environment variables
3. Restart development server if running
4. Test connection using integration checker

---

## Backend Integration

### Overview

The frontend integrates with a Django REST backend using JWT authentication and RESTful API endpoints. All API calls are handled through service modules in `src/services/`.

### API Configuration

The API client is configured in `src/services/api.js`:

- Base URL from environment variable
- 60-second timeout (accommodates backend cold starts)
- Automatic JWT token injection
- Auto-refresh on 401 errors
- Error handling with retry logic

### Response Format

Standard paginated response:
```json
{
  "count": 100,
  "next": "http://api.example.com/api/v1/animals/?page=2",
  "previous": null,
  "results": [...]
}
```

Standard detail response:
```json
{
  "id": 1,
  "name": "Elephant #1",
  "species": "elephant",
  ...
}
```

Error response:
```json
{
  "error": "Error message",
  "detail": "Detailed error information"
}
```

---

## Authentication

### Passwordless OTP-Based Authentication

The application uses email-based One-Time Password (OTP) authentication. No passwords are required.

### Registration Flow

1. User provides email, name, and role
2. Backend sends 4-digit OTP via email
3. User enters OTP code
4. Account created with JWT tokens

**Code Example:**

```javascript
import { auth } from './services';

// Step 1: Send registration OTP
const result = await auth.sendRegistrationOTP({
  email: 'ranger@wildlife.org',
  name: 'John Doe',
  role: 'ranger'
});

// Step 2: Verify OTP and complete registration
const { token, user } = await auth.verifyRegistrationOTP(
  'ranger@wildlife.org',
  '1234'
);

// Tokens are automatically stored in localStorage
```

### Login Flow

1. User provides email
2. Backend sends 4-digit OTP via email
3. User enters OTP code
4. Logged in with JWT tokens

**Code Example:**

```javascript
// Step 1: Send login OTP
await auth.sendLoginOTP('ranger@wildlife.org');

// Step 2: Verify OTP
const { token, user } = await auth.verifyLoginOTP(
  'ranger@wildlife.org',
  '1234'
);
```

### Token Management

- Access token: `localStorage.authToken`
- Refresh token: `localStorage.refreshToken`
- User profile: `localStorage.userProfile`
- Auto-refresh on 401 errors via axios interceptor
- Token format: `Bearer <access_token>`

### Logout

```javascript
await auth.logout();
// Clears all tokens and user data from localStorage
```

---

## API Endpoints

### Status: Implemented and Working

#### System Endpoints

**Health Check**
- `GET /health/` - Backend health status

**API Root**
- `GET /` - Service information and endpoint list

**Documentation**
- `GET /api/docs/` - Swagger UI documentation
- `GET /api/redoc/` - ReDoc documentation

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

Returns comprehensive data:
- Current GPS position
- ML-predicted next position (BBMM/LSTM)
- Corridor status (inside/outside)
- Conflict risk assessment (Low/Medium/High)
- Movement metrics (speed, direction, battery)
- Real-time tracking data

#### Tracking Endpoints

**GPS Tracking**
- `GET /api/v1/tracking/` - List tracking data (with filters)
- `POST /api/v1/tracking/` - Upload GPS tracking data
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
- `GET /api/v1/corridors/` - List corridors (with filters)
- `POST /api/v1/corridors/` - Create corridor
- `GET /api/v1/corridors/{id}/` - Get corridor details
- `PUT /api/v1/corridors/{id}/` - Update corridor
- `DELETE /api/v1/corridors/{id}/` - Delete corridor

**ML Optimization**
- `POST /api/v1/corridors/optimize/` - RL-based corridor optimization with real GPS data

Request format:
```json
{
  "species": "elephant",
  "start_point": {"lat": -1.2921, "lon": 36.8219},
  "end_point": {"lat": -1.3921, "lon": 36.9219},
  "steps": 50
}
```

#### Conflict Zones Endpoints

**CRUD Operations**
- `GET /api/v1/conflict-zones/` - List conflict zones (with filters)
- `POST /api/v1/conflict-zones/` - Create conflict zone
- `GET /api/v1/conflict-zones/{id}/` - Get conflict zone details
- `PUT /api/v1/conflict-zones/{id}/` - Update conflict zone (full)
- `PATCH /api/v1/conflict-zones/{id}/` - Update conflict zone (partial)
- `DELETE /api/v1/conflict-zones/{id}/` - Delete conflict zone

**Special Endpoints**
- `GET /api/v1/conflict-zones/geojson/` - Get zones as GeoJSON for mapping

#### Predictions Endpoints

**CRUD Operations**
- `GET /api/v1/predictions/` - List predictions
- `POST /api/v1/predictions/` - Create prediction
- `GET /api/v1/predictions/{id}/` - Get prediction details
- `PUT /api/v1/predictions/{id}/` - Update prediction
- `DELETE /api/v1/predictions/{id}/` - Delete prediction

**Special Endpoints**
- `POST /api/v1/predictions/corridor/` - Generate corridor prediction
- `GET /api/v1/predictions/history/` - Get prediction history (filterable by type)

#### Synchronization Endpoints

**Offline Data Sync**
- `GET /api/v1/sync/` - List sync records
- `POST /api/v1/sync/` - Create sync record
- `GET /api/v1/sync/{id}/` - Get sync details

### Status: Not Yet Implemented

**Reports Backend**
- `/api/v1/reports/*` - Reports backend app not created yet

The reports service in the frontend is a placeholder that throws clear error messages. To implement:
1. Create `apps/reports/` in Django backend
2. Add models for Report, ReportCategory, ReportTemplate
3. Add to INSTALLED_APPS in settings.py
4. Add URL routing

---

## Service Files

### Available Services

All services are located in `src/services/` and can be imported from `src/services/index.js`.

#### api.js

Core API client configuration:
- Axios instance with base URL and timeout
- Request interceptor for JWT token injection
- Response interceptor for error handling and token refresh
- Health check utility

```javascript
import api, { API_BASE_URL, checkServerHealth } from './services/api';
```

#### auth.js

Authentication service (OTP-based, passwordless):
- `sendRegistrationOTP(email, name, role)` - Send registration OTP
- `verifyRegistrationOTP(email, otpCode)` - Verify OTP and complete registration
- `sendLoginOTP(email)` - Send login OTP
- `verifyLoginOTP(email, otpCode)` - Verify login OTP
- `logout()` - Logout and clear tokens
- `fetchProfile()` - Get current user profile
- `refreshToken()` - Refresh access token
- `getToken()` - Get stored token
- `isAuthenticated()` - Check authentication status
- `getProfile()` - Get cached user profile

```javascript
import { auth } from './services';

await auth.sendLoginOTP('user@example.com');
const { token, user } = await auth.verifyLoginOTP('user@example.com', '1234');
```

#### animals.js

Animal management service:
- `getAll(filters)` - Get all animals with optional filters
- `getById(id)` - Get animal by ID
- `create(animalData)` - Create new animal
- `update(id, animalData)` - Update animal (full)
- `patch(id, partialData)` - Update animal (partial)
- `delete(id)` - Delete animal
- `getLiveStatus()` - Get real-time status with ML predictions (includes response transformation)
- `getBySpecies(species)` - Get animals by species
- `getActive()` - Get active animals only

```javascript
import { animals } from './services';

// Get live status with ML predictions
const liveData = await animals.getLiveStatus();
// Returns flattened structure: current_lat, current_lon, predicted_lat, etc.

// Get all animals
const allAnimals = await animals.getAll({ species: 'elephant' });
```

#### tracking.js

GPS tracking service:
- `getAll(filters)` - Get all tracking data
- `getById(id)` - Get tracking point by ID
- `create(trackingData)` - Upload GPS data
- `update(id, trackingData)` - Update tracking point
- `delete(id)` - Delete tracking point
- `getLive()` - Get live tracking data (last hour)
- `getLiveTracking()` - Get live tracking with full ML pipeline
- `getByAnimal(animalId, filters)` - Get tracking data for specific animal

**Observations sub-service:**
- `observations.getAll(filters)` - Get all observations
- `observations.getById(id)` - Get observation by ID
- `observations.create(observationData)` - Create observation
- `observations.update(id, observationData)` - Update observation
- `observations.delete(id)` - Delete observation

```javascript
import tracking, { observations } from './services/tracking';

// Get live tracking with ML pipeline
const liveData = await tracking.getLiveTracking();

// Get observations
const obs = await observations.getAll({ animal: animalId });
```

#### corridors.js

Corridor management service:
- `getAll(filters)` - Get all corridors
- `getById(id)` - Get corridor by ID
- `create(corridorData)` - Create new corridor
- `update(id, corridorData)` - Update corridor
- `delete(id)` - Delete corridor
- `optimize({ species, startPoint, endPoint, steps })` - Optimize corridor using ML
- `getBySpecies(species)` - Get corridors by species
- `getActive()` - Get active corridors

```javascript
import { corridors } from './services';

// Optimize corridor with RL
const optimized = await corridors.optimize({
  species: 'elephant',
  startPoint: { lat: -1.2921, lon: 36.8219 },
  endPoint: { lat: -1.3921, lon: 36.9219 },
  steps: 50
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
import { conflictZones } from './services';

const zones = await conflictZones.getActive();
```

#### predictions.js

ML predictions service:
- `getAll(filters)` - Get all predictions
- `getById(id)` - Get prediction by ID
- `predictCorridor({ species, startLat, startLon, steps, algorithm })` - Generate corridor prediction
- `getHistory(filters)` - Get prediction history
- `getCorridorPredictions()` - Get corridor predictions only

Note: Direct ML model endpoints (BBMM, HMM, XGBoost, LSTM individual endpoints) are commented out as they're not implemented separately in the backend. ML models are accessed through integrated endpoints:
- `animals.getLiveStatus()` - Includes BBMM/LSTM predictions
- `tracking.getLiveTracking()` - Full HMM→BBMM→XGBoost→LSTM→RL pipeline
- `corridors.optimize()` - RL-based optimization

```javascript
import { predictions } from './services';

const history = await predictions.getHistory({ type: 'corridor' });
```

#### reports.js

Reports service (placeholder - backend not implemented):

All methods throw error: "Reports backend not yet implemented. Please implement apps/reports/ in Django backend first."

To implement reports backend:
1. Create `apps/reports/` directory in Django
2. Add Report, ReportCategory, ReportTemplate models
3. Add to INSTALLED_APPS
4. Add URL routing: `path('api/v1/reports/', include('apps.reports.urls'))`

#### integration-check.js

Integration testing utility:
- `checkBackendHealth()` - Test backend health endpoint
- `checkApiRoot()` - Test API root endpoint
- `checkAnimalsEndpoints()` - Test animals endpoints
- `checkTrackingEndpoints()` - Test tracking endpoints
- `checkCorridorsEndpoints()` - Test corridors endpoints
- `checkConflictZonesEndpoints()` - Test conflict zones endpoints
- `checkPredictionsEndpoints()` - Test predictions endpoints
- `checkSyncEndpoints()` - Test sync endpoints
- `runFullCheck()` - Run all integration checks

```javascript
// Available in browser console
await window.IntegrationCheck.runFullCheck();
```

---

## Features

### Real-Time Wildlife Tracking

- Live GPS tracking with 30-second update intervals
- Color-coded animal markers based on status:
  - Green: Safe (inside corridor)
  - Orange: Caution (outside corridor)
  - Red: Danger (near conflict zone)
- Interactive map with Leaflet/Mapbox integration
- Animal status monitoring with real-time updates
- Predicted movement paths in purple
- Corridor visualization in sky blue
- Conflict zones displayed as red circles
- Ranger patrol routes in cyan

### AI-Powered Predictions

**Machine Learning Models:**

1. **HMM (Hidden Markov Model)** - Behavioral state classification
   - Identifies foraging, migrating, resting states
   - Analyzes movement patterns

2. **BBMM (Brownian Bridge Movement Model)** - Movement path prediction
   - Predicts likely movement corridors
   - Probability-based path forecasting

3. **XGBoost** - Environmental factor analysis
   - Land use analysis
   - Elevation and terrain modeling
   - Water proximity calculations

4. **LSTM** - Continuous learning for position prediction
   - Time-series prediction
   - Adapts to individual animal behavior
   - Long-term pattern recognition

5. **RL (Reinforcement Learning)** - Corridor optimization
   - PPO (Proximal Policy Optimization)
   - DQN (Deep Q-Network)
   - Real GPS data integration
   - Conflict zone avoidance
   - Environmental cost optimization

**Accessing ML Predictions:**

```javascript
// Get live status with ML predictions
const liveStatus = await animals.getLiveStatus();
// Returns: current position, predicted position, risk assessment

// Get full ML pipeline
const liveTracking = await tracking.getLiveTracking();
// Returns: HMM states, BBMM paths, environmental analysis, LSTM predictions

// Optimize corridor with RL
const optimized = await corridors.optimize({
  species: 'elephant',
  startPoint: { lat, lon },
  endPoint: { lat, lon }
});
```

### Conservation Management

- Wildlife corridor visualization on interactive maps
- Corridor status tracking (active/inactive)
- RL-based corridor optimization with real GPS data
- Conflict zone mapping and management
- Risk assessment with three levels (Low/Medium/High)
- Distance-to-conflict calculations
- Real-time alert system for corridor exits and danger zones
- Patrol operations tracking with route visualization

### Analytics Dashboard

- Real-time statistics and metrics
- Species distribution analysis
- Population tracking
- Conservation insights and trends
- Threat detection and assessment
- Movement pattern analysis
- Corridor effectiveness metrics
- Conflict zone impact analysis

### User Interface

- Responsive design for desktop, tablet, mobile
- Dark/light mode support
- Interactive maps with multiple layers
- Filter and search functionality
- Modal dialogs for detailed views
- Real-time notifications
- Status indicators and badges
- Charts and visualizations with Recharts

---

## Testing Integration

### Built-in Integration Checker

The application includes a comprehensive integration testing tool that verifies all backend endpoints.

### Running Tests

**In Browser Console:**

```javascript
// Full integration check (all endpoints)
await window.IntegrationCheck.runFullCheck();

// Quick backend health check
await window.IntegrationCheck.checkBackendHealth();

// Test specific endpoint groups
await window.IntegrationCheck.checkAnimalsEndpoints();
await window.IntegrationCheck.checkTrackingEndpoints();
await window.IntegrationCheck.checkCorridorsEndpoints();
await window.IntegrationCheck.checkConflictZonesEndpoints();
await window.IntegrationCheck.checkPredictionsEndpoints();
await window.IntegrationCheck.checkSyncEndpoints();
```

### Expected Output

```
===========================================================
Running Full API Integration Check
API URL: http://localhost:8000
===========================================================

1. Checking Backend Health...
Backend health check passed

2. Checking API Root...
API Root check passed
  Service: Wildlife Conservation Platform
  Version: v1.0.0
  Available endpoints: 8

3. Checking Animals Endpoints...
Animals GET: 5 animals found
Live Status: 5 active animals

4. Checking Tracking Endpoints...
Tracking GET: 150 records found
Tracking Live: 10 live records
Live Tracking (ML Pipeline): Available
  Season: dry
  Species data: 5

5. Checking Corridors Endpoints...
Corridors GET: 3 corridors found

6. Checking Conflict Zones Endpoints...
Conflict Zones GET: 8 zones found

7. Checking Predictions Endpoints...
Predictions GET: 25 predictions found

8. Checking Sync Endpoints...
Sync GET: 12 sync records found

===========================================================
Integration Check Complete!
===========================================================

Summary: 15/15 checks passed

Not Yet Implemented: reports
```

### Test Script

A batch script is provided for quick testing on Windows:

```bash
cd frontend/web
test-integration.bat
```

This script:
1. Checks for `.env.local` (creates if missing)
2. Verifies dependencies are installed
3. Starts development server
4. Displays integration test instructions

---

## Development

### Start Development Server

```bash
npm start
```

Runs at http://localhost:3000 with hot reload.

### Run Tests

```bash
npm test
```

Launches test runner in interactive watch mode.

### Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` directory.

### Analyze Bundle Size

```bash
npm run build:analyze
```

Generates bundle analysis report showing size of dependencies.

### Code Quality

The project uses:
- ESLint for code linting
- Prettier for code formatting (if configured)
- React Testing Library for component tests

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally with `npm start`
4. Run integration tests in browser console
5. Build production version
6. Test production build locally
7. Commit and push changes

---

## Production Deployment

### Pre-Deployment Checklist

1. Environment variables configured for production
2. Backend URL points to production server
3. CORS configured in backend for production domain
4. SSL certificate valid
5. All tests passing
6. No console errors in production build

### Build Production Bundle

```bash
npm run build
```

Output will be in `build/` directory.

### Test Production Build Locally

```bash
npx serve -s build
```

Access at http://localhost:3000 and run integration tests.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
```
REACT_APP_API_URL=https://your-backend-api.com
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

Set environment variables in Netlify dashboard:
```
REACT_APP_API_URL=https://your-backend-api.com
```

### Deploy to Custom Server

1. Build production bundle
2. Upload `build/` directory contents to web server
3. Configure web server (nginx, Apache, etc.)
4. Set environment variables
5. Configure SSL certificate
6. Test deployment

### Post-Deployment Verification

1. Access deployed site
2. Open browser console
3. Run: `window.IntegrationCheck.runFullCheck()`
4. Verify all checks pass
5. Test authentication flow
6. Test core features
7. Check performance metrics

---

## Project Structure

```
frontend/web/
├── public/                      # Static assets
│   ├── assets/                 # Images and media
│   ├── favicon.webp            # Site favicon
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA manifest
│   └── robots.txt              # SEO robots file
│
├── src/
│   ├── components/             # Reusable components
│   │   ├── alerts/            # Alert system components
│   │   │   ├── AnimalGrid.jsx
│   │   │   ├── DetailModal.jsx
│   │   │   ├── FilterTabs.jsx
│   │   │   ├── StatsBar.jsx
│   │   │   ├── TrackingHeader.jsx
│   │   │   └── TrackingMap.jsx
│   │   │
│   │   ├── analytics/         # Analytics components
│   │   │   ├── ChartContainer.jsx
│   │   │   └── MetricCard.jsx
│   │   │
│   │   ├── dashboard/         # Dashboard widgets
│   │   │   ├── ConservationInsights.jsx
│   │   │   ├── OperationsMap.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── ThreatRadar.jsx
│   │   │   ├── ThreatTimeline.jsx
│   │   │   ├── WebMiniMapOverview.jsx
│   │   │   └── WildlifeAnalytics.jsx
│   │   │
│   │   ├── patrol/            # Patrol components
│   │   │   └── PatrolCard.jsx
│   │   │
│   │   ├── reports/           # Report components
│   │   │   ├── ReportCard.jsx
│   │   │   └── ReportCategoryCard.jsx
│   │   │
│   │   ├── settings/          # Settings components
│   │   │   ├── SettingsSection.jsx
│   │   │   └── ToggleSwitch.jsx
│   │   │
│   │   ├── shared/            # Shared UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── HeaderVariants.jsx
│   │   │   ├── Icons.js
│   │   │   ├── MapComponent.jsx
│   │   │   ├── ResponsiveContainer.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── team/              # Team components
│   │   │   ├── MemberCard.jsx
│   │   │   └── TeamCard.jsx
│   │   │
│   │   ├── ui/                # Base UI elements
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   └── Input.jsx
│   │   │
│   │   └── ProtectedRoute.jsx # Route protection component
│   │
│   ├── screens/               # Main application screens
│   │   ├── auth/             # Authentication screens
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── LoginVerify.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── RegisterVerify.jsx
│   │   │   └── ResetPassword.jsx
│   │   │
│   │   ├── main/             # Main dashboard
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── management/       # Management screens
│   │   │   ├── Reports.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── TeamManagement.jsx
│   │   │
│   │   ├── operations/       # Operations screens
│   │   │   ├── FieldReports.jsx
│   │   │   ├── Incidents.jsx
│   │   │   └── PatrolRoutes.jsx
│   │   │
│   │   └── wildlife/         # Wildlife tracking screens
│   │       ├── AlertHub.jsx
│   │       └── WildlifeTracking.jsx
│   │
│   ├── services/             # API integration layer
│   │   ├── api.js           # Axios configuration and interceptors
│   │   ├── auth.js          # Authentication service
│   │   ├── animals.js       # Animal management service
│   │   ├── tracking.js      # GPS tracking service
│   │   ├── corridors.js     # Corridor management service
│   │   ├── conflictZones.js # Conflict zone service
│   │   ├── predictions.js   # ML predictions service
│   │   ├── reports.js       # Reports service (placeholder)
│   │   ├── integration-check.js # Integration testing utility
│   │   └── index.js         # Service exports
│   │
│   ├── utils/               # Utility functions
│   │   ├── createTestAnimals.js
│   │   └── testIntegration.js
│   │
│   ├── constants/           # App constants
│   │   ├── Animals.js
│   │   └── Colors.js
│   │
│   ├── App.css             # Global styles
│   ├── App.jsx             # Root component
│   ├── index.css           # CSS entry point
│   ├── index.jsx           # Application entry point
│   └── reportWebVitals.js  # Performance monitoring
│
├── .env.local              # Environment variables (create this)
├── package.json            # Dependencies and scripts
├── package-lock.json       # Dependency lock file
├── craco.config.js         # Craco configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── jsconfig.json           # JavaScript configuration
├── test-integration.bat    # Integration test script
└── README.md               # This file
```

---

## Troubleshooting

### Backend Connection Issues

**Symptoms:**
- Network errors in console
- "Failed to fetch" errors
- Timeout errors
- No data loading

**Solutions:**

1. Verify backend is running:
   ```bash
   curl http://localhost:8000/health/
   ```

2. Check `.env.local` configuration:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

3. Run integration check:
   ```javascript
   window.IntegrationCheck.checkBackendHealth()
   ```

4. Check browser console for specific errors

5. Verify backend logs for errors

6. Ensure correct port (default: 8000)

### CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- "CORS policy" errors
- Blocked by CORS policy messages

**Solutions:**

1. Backend CORS settings must include frontend URL

2. Django settings should have:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "https://your-production-domain.com",
   ]
   ```

3. For development only:
   ```python
   CORS_ALLOW_ALL_ORIGINS = True
   ```

4. Check ALLOWED_HOSTS in Django settings

5. Restart backend after CORS changes

### Authentication Issues

**Symptoms:**
- Login fails
- OTP not received
- Token refresh errors
- Redirected to login repeatedly

**Solutions:**

1. Test authentication endpoint:
   ```javascript
   window.IntegrationCheck.checkBackendHealth()
   ```

2. Check email configuration in backend

3. Verify OTP codes are being sent

4. Check backend logs for email sending errors

5. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```

6. Try login again

7. Verify JWT_SECRET is set in backend

### No Animals/Data Showing

**Symptoms:**
- Empty map
- No animals in list
- No tracking data
- Empty dashboard

**Solutions:**

1. Test data endpoints:
   ```javascript
   window.IntegrationCheck.checkAnimalsEndpoints()
   ```

2. Verify animals exist in backend database:
   ```bash
   python manage.py shell
   >>> from apps.animals.models import Animal
   >>> Animal.objects.count()
   ```

3. Check animals have `status='active'`

4. Verify tracking data exists with GPS coordinates

5. Check database migrations are applied:
   ```bash
   python manage.py migrate
   ```

6. Run data fixtures/seeders if available

### Map Not Displaying

**Symptoms:**
- Blank map area
- Map tiles not loading
- No markers visible

**Solutions:**

1. Check browser console for map errors

2. Verify Leaflet/Mapbox CSS is loaded

3. Check map center coordinates are valid

4. Verify GPS coordinates are in correct format (lat, lon)

5. Check map container has defined height in CSS

6. Ensure map library dependencies are installed:
   ```bash
   npm install leaflet react-leaflet mapbox-gl
   ```

### Performance Issues

**Symptoms:**
- Slow page loads
- Laggy interactions
- High memory usage
- Slow map rendering

**Solutions:**

1. Check network tab for slow API calls

2. Verify backend caching is working

3. Reduce polling interval if too frequent

4. Enable production build for testing:
   ```bash
   npm run build
   npx serve -s build
   ```

5. Analyze bundle size:
   ```bash
   npm run build:analyze
   ```

6. Check for memory leaks in React DevTools

7. Optimize map markers (use clustering for many markers)

### Build Errors

**Symptoms:**
- `npm run build` fails
- Compilation errors
- Module not found errors

**Solutions:**

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

2. Check for syntax errors in code

3. Verify all imports are correct

4. Check for missing dependencies:
   ```bash
   npm install
   ```

5. Clear cache:
   ```bash
   npm cache clean --force
   ```

6. Check Node.js version compatibility

### Token/Session Issues

**Symptoms:**
- Frequently logged out
- "Session expired" messages
- 401 errors

**Solutions:**

1. Check token expiration time in backend

2. Verify refresh token is working

3. Check axios interceptor is configured correctly

4. Clear localStorage and re-login

5. Verify JWT settings in backend

6. Check system clock is correct

### Real-Time Updates Not Working

**Symptoms:**
- Data not refreshing
- Stale data showing
- No live updates

**Solutions:**

1. Check polling interval configuration

2. Verify backend is returning updated data

3. Check browser console for polling errors

4. Verify API endpoints are working:
   ```javascript
   window.IntegrationCheck.runFullCheck()
   ```

5. Check network tab for failed requests

6. Verify caching settings (backend 5-second cache)

### General Debugging Steps

1. Open browser console (F12)
2. Check for JavaScript errors
3. Check Network tab for failed requests
4. Run integration tests
5. Check backend logs
6. Verify environment variables
7. Test in incognito mode
8. Try different browser
9. Check API documentation at `/api/docs/`

---

## Dependencies

### Core Dependencies

**React & Router:**
- react: 19.1.1
- react-dom: 19.1.1
- react-router-dom: 7.9.3

**HTTP Client:**
- axios: 1.13.1

### UI Libraries

**Styling:**
- tailwindcss: 3.4.17
- postcss: 8.5.6
- autoprefixer: 10.4.21

**Icons & UI:**
- lucide-react: 0.544.0
- react-icons: 5.5.0

**Charts:**
- recharts: 3.3.0

### Maps

**Leaflet:**
- leaflet: 1.9.4
- react-leaflet: 5.0.0

**Mapbox:**
- mapbox-gl: 3.15.0

### Development Tools

**Build Tools:**
- react-scripts: 5.0.1
- @craco/craco: 5.9.0

**Testing:**
- @testing-library/react: 16.3.0
- @testing-library/jest-dom: 6.8.0
- @testing-library/user-event: 13.5.0
- @testing-library/dom: 10.4.1

**Utilities:**
- web-vitals: 2.1.4
- ajv: 8.12.0

### Installation

Install all dependencies:

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required due to React 19 peer dependency resolution.

### Package Scripts

```json
{
  "start": "craco start",
  "dev": "craco start",
  "build": "craco build",
  "test": "craco test",
  "eject": "react-scripts eject",
  "analyze": "source-map-explorer 'build/static/js/*.js' --only-mapped",
  "analyze:html": "source-map-explorer 'build/static/js/*.js' --html > build/bundle-analysis.html",
  "build:analyze": "npm run build && npm run analyze"
}
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

## Contributing

Guidelines for contributing to the project:

1. Fork the repository
2. Create feature branch
3. Follow existing code style
4. Ensure all integration tests pass
5. Test on multiple screen sizes
6. Verify backend integration works
7. Update documentation if needed
8. Submit pull request with clear description

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

1. Run integration diagnostics:
   ```javascript
   window.IntegrationCheck.runFullCheck()
   ```

2. Check backend logs for errors

3. Review troubleshooting section above

4. Check API documentation at `http://localhost:8000/api/docs/`

5. Verify environment configuration

---

## About

The Wildlife Corridors Web Dashboard provides conservationists, rangers, and researchers with powerful tools to monitor and protect wildlife in real-time.

**Key Capabilities:**

- Real-time monitoring of GPS-collared wildlife
- Machine learning predictions for animal movement
- Corridor optimization using reinforcement learning
- Conflict detection and alert systems
- Field operations management
- Conservation analytics and reporting
- Offline data synchronization for field work

**Technology Stack:**

- Frontend: React 19 with Tailwind CSS
- Maps: Leaflet + Mapbox GL
- Charts: Recharts
- Backend: Django REST Framework
- ML: HMM, BBMM, XGBoost, LSTM, Reinforcement Learning
- Authentication: JWT with OTP-based passwordless login

**Built for:**

Wildlife conservation organizations, national parks, research institutions, and conservation NGOs working to protect endangered species and manage human-wildlife conflict.

---

**Wildlife Corridors Web Dashboard - Built with modern web technologies for performance, reliability, and user experience in wildlife conservation management.**
