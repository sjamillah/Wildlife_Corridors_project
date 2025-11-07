# Wildlife Tracking Platform Backend

A comprehensive wildlife conservation management platform for tracking elephants, wildebeest, and other wildlife species using GPS collars, real-time data collection, and machine learning predictions.

## Overview

This platform helps conservation managers and researchers track animal movements in real-time, predict migration patterns, optimize wildlife corridors, and minimize human-wildlife conflicts. The system combines GPS tracking data with machine learning models to provide actionable insights for wildlife conservation efforts.

The platform consists of two integrated services:

**Django Backend** (Port 8000): Handles all data management, user authentication, GPS data storage, and provides REST APIs for frontend applications and mobile apps.

**ML Service** (Port 8001): Runs machine learning models for movement prediction, behavioral state detection, habitat analysis, and corridor optimization.

## Key Features

**Multi-Species Tracking**: Track elephants, wildebeest, and other wildlife with species-specific movement models and behavioral patterns.

**Real-Time Monitoring**: Live GPS tracking with instant position updates, behavioral state detection, corridor compliance checking, and risk zone alerts.

**Ranger & Patrol Management**: Track field rangers in real-time, manage patrol routes, log emergencies, and monitor team activities with activity-based movement trails.

**AI-Powered Predictions**: Five trained machine learning models work together to predict movements, detect behaviors, score habitats, and optimize corridors.

**Offline Support**: Field rangers can collect GPS data offline and sync automatically when connectivity is restored.

**Role-Based Access Control**: Different permission levels for administrators, conservation managers, rangers, and viewers.

## Installation

### Prerequisites

- Python 3.10 or higher
- PostgreSQL database (configured with Supabase)
- Virtual environment tool (venv or virtualenv)

### Setup Instructions

1. Clone the repository:

```bash
git clone <your-repository-url>
cd Wildlife_Backend/backend
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate
```

On Windows, use: `venv\Scripts\activate`

3. Install dependencies:

```bash
pip install -r requirements.txt
pip install -r ml_service/requirements.txt
```

4. Configure environment variables:

Create a `.env` file in the `backend` directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

SUPABASE_DATABASE_URL=postgresql://user:password@host:port/database

ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_API_KEY=your-api-key-here

# Email Configuration (for OTP authentication)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  # For development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@wildlife.com

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

5. Set up the database:

The system connects to your existing Supabase PostgreSQL database.

```bash
# Create cache table
python manage.py createcachetable

# Create migrations for new apps (rangers, reports)
python manage.py makemigrations rangers reports

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser
```

6. Start the services:

Terminal 1 (Django Backend):

```bash
python manage.py runserver
```

Terminal 2 (ML Service):

```bash
python3 -m uvicorn ml_service.main:app --host 0.0.0.0 --port 8001 --reload
```

7. Verify installation:

- Django Admin: http://localhost:8000/admin
- API Documentation: http://localhost:8000/api/docs/
- ML Service Health: http://localhost:8001/health

## Email-Based OTP Authentication

The platform uses **email-based OTP (One-Time Password)** authentication for secure, password-free user registration and login.

### How It Works

**Registration Flow:**

1. User provides email, name, and role
2. System generates 4-digit OTP and sends it via email
3. User receives beautifully formatted HTML email with OTP code
4. User enters OTP to complete registration
5. JWT tokens returned for authenticated access

**Login Flow:**

1. User provides email address
2. System generates 4-digit OTP and sends to email
3. User enters OTP to complete login
4. JWT tokens returned for session management

### OTP Configuration

**Development Mode (Console Output):**

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

OTP codes are printed to console logs - check Docker logs:

```bash
docker-compose logs -f wildlife_django | grep "OTP for"
```

**Production Mode (Gmail SMTP):**

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=noreply@wildlife.com
```

**Note:** For Gmail, create an [App Password](https://myaccount.google.com/apppasswords) instead of using your regular password.

**Alternative Email Providers:**

_SendGrid:_

```env
EMAIL_BACKEND=sendgrid_backend.SendgridBackend
SENDGRID_API_KEY=your-api-key
DEFAULT_FROM_EMAIL=verified-sender@yourdomain.com
```

_AWS SES:_

```env
EMAIL_BACKEND=django_ses.SESBackend
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_REGION_NAME=us-east-1
DEFAULT_FROM_EMAIL=verified@yourdomain.com
```

### OTP Security Features

- **4-digit codes**: Easy to type, hard to guess
- **2-minute expiration**: Codes expire quickly for security
- **3 attempt limit**: Prevents brute force attacks
- **Email verification**: Users marked as email-verified on registration
- **Beautiful templates**: Professional, branded HTML emails

### Testing OTP Authentication

**Example Registration Request:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

**Note:** The `purpose` field is optional - the endpoint automatically sets it to `"registration"`.

**Example OTP Verification:**

```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp_code": "1234",
    "name": "John Doe"
  }'
```

**Note:** The `purpose` field is optional - defaults to `"login"` if not specified.

## Project Structure

```
Wildlife_Backend/
├── backend/
│   ├── apps/                    # Django applications
│   │   ├── authentication/      # Email-based OTP authentication
│   │   │   ├── models.py        # User, OTPVerification models
│   │   │   ├── views.py         # OTP send/verify endpoints
│   │   │   ├── serializers.py   # Email-based serializers
│   │   │   └── utils.py         # Email sending utilities
│   │   ├── animals/            # Animal management & tracking
│   │   ├── tracking/           # GPS data & observations
│   │   ├── predictions/        # ML prediction storage
│   │   ├── corridors/          # Wildlife corridor management
│   │   ├── core/               # Conflict zones & spatial utilities
│   │   ├── rangers/            # NEW: Ranger & patrol management
│   │   ├── reports/            # NEW: Conservation reports & analytics
│   │   └── sync/               # Offline data synchronization
│   │
│   ├── ml_service/             # FastAPI ML microservice
│   │   ├── api/                # API endpoints
│   │   │   ├── corridor.py     # Corridor optimization endpoints
│   │   │   └── health.py       # Health check endpoints
│   │   ├── models/             # ML model implementations
│   │   │   ├── bbmm_movement.py
│   │   │   ├── hmm_behavior.py
│   │   │   ├── lstm_continuous_learning.py
│   │   │   ├── xgboost_habitat_modeling.py
│   │   │   └── rl/             # Reinforcement learning models
│   │   ├── core/               # Core utilities
│   │   │   ├── realtime_tracker.py  # Real-time tracking pipeline
│   │   │   ├── model_selector.py    # Model selection logic
│   │   │   └── cloudflare_loader.py # Remote model loading
│   │   ├── config/             # Configuration
│   │   │   ├── settings.py     # ML service settings
│   │   │   └── rl_config.py    # RL model configuration
│   │   ├── data/               # Trained model files
│   │   │   ├── rl/             # RL models (.zip)
│   │   │   ├── lstm/           # LSTM models (.h5, .pkl)
│   │   │   ├── xgboost/        # XGBoost models (.pkl)
│   │   │   └── rasters/        # Environmental data
│   │   └── main.py             # FastAPI application
│   │
│   ├── wildlife_backend/       # Django project settings
│   │   ├── settings.py         # Django configuration
│   │   ├── urls.py             # URL routing
│   │   └── wsgi.py             # WSGI configuration
│   │
│   ├── tests/                  # Test suite
│   │   ├── test_authentication.py
│   │   ├── test_animals.py
│   │   ├── test_tracking.py
│   │   ├── test_integration.py
│   │   └── factories.py        # Test data factories
│   │
│   ├── conftest.py             # Pytest fixtures
│   ├── pytest.ini              # Pytest configuration
│   ├── run_tests.sh            # Test runner (Unix)
│   ├── run_tests.bat           # Test runner (Windows)
│   ├── requirements.txt        # Python dependencies
│   ├── manage.py               # Django management
│   ├── logs/                   # Application logs
│   ├── media/                  # User uploaded files
│   └── static/                 # Static assets
│
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Multi-service orchestration
└── README.md                   # This file
```

## API Endpoints

### Authentication (`/api/v1/auth/`)

The system uses **email-based OTP authentication** for secure, password-free login:

- `POST /register/` - Start user registration (sends 4-digit OTP to email)
- `POST /verify-otp/` - Verify OTP and complete registration
- `POST /login/` - Start login (sends 4-digit OTP to email)
- `POST /login/verify/` - Complete login with OTP verification
- `POST /logout/` - Logout user
- `POST /refresh/` - Refresh JWT access token
- `GET /me/` - Get current user profile
- `PUT /me/` - Update user profile

**OTP Features:**

- 4-digit codes sent via email
- 2-minute expiration for security
- 3 attempt limit per code
- Beautiful HTML email templates
- Email verification on successful registration

### Animals (`/api/v1/animals/`)

- `GET /` - List all animals (supports filtering and search)
- `POST /` - Create new animal
- `GET /{id}/` - Get animal details
- `PUT /{id}/` - Update animal
- `DELETE /{id}/` - Delete animal
- `GET /live_status/` - **Enhanced real-time status with conflict detection**

**Enhanced Live Status Returns:**

- Current & predicted GPS positions (ML-based)
- Corridor containment status
- Conflict risk assessment (Low/Medium/High)
- Movement metrics (speed, direction, battery, signal)
- Proximity to human activity zones

**Optional Fields in Animals:**

- `age`, `weight`, `notes` - All optional for flexible data collection

### Tracking (`/api/v1/tracking/`)

- `GET /` - List tracking data
- `POST /` - Upload single GPS point
- `POST /bulk_upload/` - Bulk upload multiple GPS points
- `GET /by_animal/?animal_id={id}` - Get tracking data for specific animal
- `GET /live_tracking/` - Real-time tracking with full ML pipeline processing

**Updated Tracking Fields:**

- Removed: `accuracy` field
- Renamed: `heading` to `directional_angle` (0-360 degrees)
- Changed: `battery_level` to text (e.g., "High", "Medium", "75%")
- Changed: `signal_strength` to text (e.g., "Excellent", "Good", "Weak")

### Predictions (`/api/v1/predictions/`)

- `GET /` - List all predictions
- `POST /` - Create prediction
- `GET /corridor/` - Generate corridor prediction (calls ML service)
- `GET /ml_status/` - Check ML service health and model status

### Corridors (`/api/v1/corridors/`)

- `GET /` - List corridors
- `POST /` - Create corridor
- `POST /optimize/` - **RL-based corridor optimization with real GPS data**

**Enhanced Corridor Optimization:**

- Uses last 30 days of real GPS tracking data
- Trained RL models (PPO/DQN) for path finding
- Avoids conflict zones (agriculture, settlements, roads)
- Returns GeoJSON ready for map visualization
- Minimizes human-wildlife overlap and energy cost

### Conflict Zones (`/api/v1/conflict-zones/`) NEW

- `GET /` - List all conflict zones
- `POST /` - Create new conflict zone
- `GET /{id}/` - Get specific zone
- `PUT /{id}/` - Update zone
- `DELETE /{id}/` - Delete zone
- `GET /geojson/` - Get all zones as GeoJSON FeatureCollection

**Conflict Zone Types:**

- Agriculture, Settlements, Roads, Infrastructure, Protected Areas, Buffer Zones

**Risk Levels:**

- High, Medium, Low (used in real-time conflict detection)

### Rangers & Patrol Management (`/api/v1/rangers/`) NEW

Complete system for tracking field rangers, managing patrols, logging emergencies, and enabling conservation managers to monitor field teams in real-time.

**Ranger Teams:**

- `GET /teams/` - List all ranger teams/groups
- `POST /teams/` - Create new team
- `GET /teams/{id}/` - Get team details
- `PUT /teams/{id}/` - Update team
- `DELETE /teams/{id}/` - Delete team

**Rangers:**

- `GET /rangers/` - List all rangers
- `POST /rangers/` - Create ranger profile
- `GET /rangers/{id}/` - Get ranger details
- `PUT /rangers/{id}/` - Update ranger
- `GET /rangers/live_status/` - **Real-time ranger locations & status**
- `GET /rangers/{id}/movement_trail/` - **Historical movement with activity states**

**Live Ranger Status Returns:**

- Current GPS position and activity type
- On duty / Off duty / Emergency response status
- Battery level and signal strength
- Recent patrol logs (last 24 hours)
- Team assignment

**Patrol Logs (Incidents & Emergencies):**

- `GET /logs/` - List all patrol logs
- `POST /logs/` - Create incident/emergency report
- `GET /logs/emergencies/` - Get unresolved emergencies
- `POST /logs/{id}/resolve/` - Mark log as resolved

**Log Types:**

- Patrol Start/End, Animal Sighting, Emergency, Incident, Checkpoint, Rest Break

**Patrol Routes:**

- `GET /routes/` - List patrol routes
- `POST /routes/` - Create new patrol route
- `GET /routes/{id}/` - Get route details
- `POST /routes/{id}/start_patrol/` - Start patrol (sets rangers to on_duty)
- `POST /routes/{id}/end_patrol/` - End patrol

**Key Features:**

- Separate tracking for rangers vs. animals
- Emergency logging with priority levels
- Team/group management
- Real-time status monitoring by managers
- Activity-based movement trails (patrolling, responding, traveling, etc.)
- Integration with existing user authentication

### ML Service (`/api/v1/ml/`)

- `GET /health/live` - Service health check
- `POST /corridor/generate` - Generate optimal corridor
- `POST /corridor/evaluate` - Evaluate corridor quality

## Frontend Integration & Offline Sync

The platform provides API endpoints for mobile/web apps to sync data collected in the field.

### Architecture

**Frontend (Mobile/Web):**

- Collects GPS data, animal info, and observations
- Can store data locally for offline scenarios (implementation flexibility)
- Syncs to backend via REST API when connected

**Backend (Django):**

- Receives bulk sync data from frontend
- Validates and processes each item
- Saves to Supabase PostgreSQL database
- Returns sync results with conflict detection

**Flow:** Frontend (Local Storage) → Django REST API → Supabase Database

### Offline Data Collection

Mobile/web apps can collect data offline and sync when connectivity is restored using the bulk upload endpoint.

### Bulk Upload Endpoint

**`POST /api/v1/sync/upload/`**

Upload offline-collected data in bulk:

```json
{
  "device_id": "unique-device-identifier",
  "animals": [
    {
      "local_id": "uuid-local-1",
      "name": "Elephant Alpha",
      "species": "Elephant",
      "collar_id": "COL001",
      "status": "active",
      "health_status": "healthy",
      "gender": "M"
    }
  ],
  "tracking": [
    {
      "local_id": "uuid-local-2",
      "animal": "animal-uuid",
      "lat": -2.1234,
      "lon": 34.5678,
      "timestamp": "2024-11-01T10:30:00Z",
      "collar_id": "COL001"
    }
  ],
  "observations": [
    {
      "local_id": "uuid-local-3",
      "animal": "animal-uuid",
      "observation_type": "sighting",
      "description": "Elephant spotted near waterhole",
      "timestamp": "2024-11-01T10:30:00Z"
    }
  ]
}
```

**Response:**

```json
{
  "sync_id": "uuid-of-sync-session",
  "animals": { "synced": 1, "failed": 0, "conflicts": 0 },
  "tracking": { "synced": 1, "failed": 0, "conflicts": 0 },
  "observations": { "synced": 1, "failed": 0, "conflicts": 0 },
  "summary": {
    "total_items": 3,
    "synced": 3,
    "conflicts": 0,
    "failed": 0,
    "success_rate": "100.0%",
    "duration_seconds": 2.5
  },
  "errors": []
}
```

### Sync Management Endpoints

**Sync Logs:**

- `GET /api/v1/sync/logs/` - All sync sessions
- `GET /api/v1/sync/logs/recent/` - Last 10 syncs
- `GET /api/v1/sync/logs/stats/` - Detailed statistics (success rate, sync efficiency)

**Sync Queue:**

- `GET /api/v1/sync/queue/pending/` - Items waiting to sync
- `GET /api/v1/sync/queue/failed/` - Failed sync items
- `POST /api/v1/sync/queue/retry_failed/` - Retry all failed items
- `POST /api/v1/sync/queue/{id}/retry_item/` - Retry specific item

### Conflict Resolution

The system automatically detects conflicts:

- **Animals**: Duplicate collar_id
- **Tracking**: Same animal, timestamp, and location
- **Observations**: Duplicate entries

Conflicted items are flagged and returned in the response for manual resolution.

### Frontend Integration Example (React/React Native)

**Simple Sync Service with Fetch API:**

```javascript
// services/apiService.js
class WildlifeAPI {
  constructor(baseUrl, getAuthToken) {
    this.baseUrl = baseUrl;
    this.getAuthToken = getAuthToken;
  }

  async syncDataToBackend(localData) {
    // Prepare data payload
    const payload = {
      device_id: this.getDeviceId(),
      animals: localData.animals || [],
      tracking: localData.tracking || [],
      observations: localData.observations || [],
    };

    // Upload to Django backend
    const response = await fetch(`${this.baseUrl}/api/v1/sync/upload/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async createAnimal(animalData) {
    const response = await fetch(`${this.baseUrl}/api/v1/animals/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(animalData),
    });

    return await response.json();
  }

  async uploadTrackingPoint(trackingData) {
    const response = await fetch(`${this.baseUrl}/api/v1/tracking/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(trackingData),
    });

    return await response.json();
      }

  getDeviceId() {
    // Return unique device identifier
    return localStorage.getItem("deviceId") || "web-client";
  }
}

export default WildlifeAPI;
```

**Usage in React Component:**

```javascript
// Example: Upload tracking data
const handleTrackingUpload = async (gpsData) => {
  try {
    const result = await apiService.uploadTrackingPoint({
      animal: animalId,
      lat: gpsData.latitude,
      lon: gpsData.longitude,
      altitude: gpsData.altitude,
      speed_kmh: gpsData.speed,
      directional_angle: gpsData.heading,
      battery_level: "High",
      signal_strength: "Good",
      timestamp: new Date().toISOString(),
      source: "gps",
      collar_id: collarId,
    });

    console.log("Tracking uploaded:", result);
  } catch (error) {
    console.error("Upload failed:", error);
    // Store locally for retry
  }
};
```

### Best Practices for Frontend Integration

**API Request Best Practices:**

**Batch Size:** Limit to 100 items per sync request for optimal performance

**Authentication:** Include JWT token in Authorization header for all requests

**Error Handling:** Implement retry logic with exponential backoff for failed requests

**Offline Support:** Store data locally (localStorage, IndexedDB, etc.) and sync when online

**Data Validation:** Validate data on frontend before sending to minimize API errors

**Conflict Resolution:** Server data takes precedence; update local storage with server IDs

**Network Detection:** Auto-sync when connectivity is restored

### Data Flow

```
User Action
    ↓
Local Storage (Optional)
    ↓
Network Available
    ↓
POST /api/v1/sync/upload/ or individual endpoints
    ↓
Django Backend Validation
    ↓
Supabase PostgreSQL
    ↓
Response with server_id
    ↓
Update Local Storage (if using)
```

## Geospatial Conflict Detection & Corridor Optimization

### Real-Time Conflict Risk Detection

The platform now includes **real-world geospatial analysis** for human-wildlife conflict detection:

**How It Works:**

1. Animals tracked via GPS collars send real-time coordinates
2. System checks position against:
   - Wildlife corridor boundaries (GeoJSON polygons)
   - Conflict zones (agriculture, settlements, roads)
3. Calculates risk level based on spatial proximity
4. Returns actionable data for conservation managers

**Risk Levels:**

- **Low**: Inside protected corridor, >2km from human zones
- **Medium**: 0-2km from conflict zone
- **High**: Inside conflict zone (immediate intervention needed)

**Example Response:**

```json
{
  "animal_id": "uuid",
  "name": "Nafisa",
  "species": "Elephant",
  "current_position": { "lat": -2.1234, "lon": 37.4321 },
  "corridor_status": {
    "inside_corridor": true,
    "corridor_name": "Tsavo–Amboseli Corridor"
  },
  "conflict_risk": {
    "current": {
      "risk_level": "Low",
      "reason": "Inside protected corridor",
      "distance_to_conflict_km": 5.2
    }
  }
}
```

### Corridor Optimization with ML

**Uses Real Data:**

- Last 30 days of GPS tracking (up to 1000 points per species)
- Trained RL models (PPO/DQN)
- Actual conflict zone boundaries
- Environmental cost layers

**Optimization Goals:**

- Minimize human-wildlife overlap
- Avoid high-risk conflict zones
- Reduce elevation/distance costs
- Maintain habitat connectivity

**Example Request:**

```bash
POST /api/v1/corridors/optimize/

{
  "species": "Elephant",
  "start_point": {"lat": -2.5, "lon": 37.5},
  "end_point": {"lat": -3.0, "lon": 38.0},
  "steps": 50
}
```

**Returns:**

- Optimized path as GeoJSON LineString
- Optimization score (0-1, higher is better)
- GPS points used, conflict zones avoided
- Ready for map visualization

## Machine Learning Models

The system integrates five machine learning models that work in sequence:

1. **HMM (Hidden Markov Model)**: Analyzes movement patterns to detect behavioral states such as foraging, migrating, or resting.

2. **BBMM (Brownian Bridge Movement Model)**: Interpolates likely paths between GPS points to fill gaps in tracking data.

3. **XGBoost**: Scores habitat suitability based on environmental factors including NDVI, elevation, water proximity, and land cover.

4. **LSTM (Long Short-Term Memory)**: Uses historical GPS sequences to predict future animal locations and movement trends.

5. **RL (Reinforcement Learning)**: Optimizes wildlife corridors by considering all model outputs, environmental constraints, and conflict risk factors.

The models work together in a pipeline: GPS data flows through HMM for behavioral state detection, BBMM for path interpolation, XGBoost for habitat scoring, LSTM for future location prediction, and finally RL for corridor optimization.

## Real-Time Tracking

The platform provides two main real-time tracking endpoints that integrate all ML models:

**`/api/animals/live_status/`**: Returns current GPS positions, predicted next positions, corridor status, and basic movement metrics for all active animals.

**`/api/v1/tracking/live_tracking/`**: Returns comprehensive real-time data including behavioral states, risk zone detection, and RL-based recommendations. This endpoint processes data through the full HMM → BBMM → XGBoost → LSTM → RL pipeline.

Both endpoints are cached for 5 seconds to optimize performance while maintaining real-time responsiveness.

## Model Files

Trained models are stored in `backend/ml_service/data/` with the following structure:

- `rl/` - Reinforcement Learning models (PPO and DQN) as `.zip` files
- `lstm/` - LSTM models (`.h5` and `.pkl` files) with corresponding scaler files
- `xgboost/` - XGBoost habitat models (`.pkl` files)
- `bbmm/` - BBMM processed GPS data
- `hmm/` - HMM behavioral prediction data
- `rasters/` - Environmental raster files for habitat analysis

Model configuration is managed in `backend/ml_service/config/rl_config.py`. You can specify which RL model to use by setting `FORCED_MODEL_PATH` in the configuration.

## Development

### Testing

The project includes a comprehensive test suite with 2,800+ lines of test code covering all backend modules including geospatial features.

**Test Files:**

- `test_authentication.py` (241 lines) - User registration, login, OTP, JWT
- `test_animals.py` (282 lines) - Animal management, live status
- `test_tracking.py` (293 lines) - GPS tracking, observations
- `test_predictions.py` (255 lines) - ML predictions, model integration
- `test_corridors.py` (260 lines) - Corridor management, RL optimization
- `test_conflict_zones.py` (278 lines) - Conflict zone CRUD, GeoJSON export, filtering
- `test_spatial_utils.py` (230 lines) - Geospatial calculations, point-in-polygon, distance
- `test_geospatial.py` (273 lines) - Live status API, corridor optimization workflows
- `test_sync.py` (285 lines) - Offline uploads, conflict resolution
- `test_integration.py` (316 lines) - End-to-end workflows
- `factories.py` (164 lines) - Test data factories
- `conftest.py` (145 lines) - Fixtures and configuration

**Quick Start:**

```bash
cd backend

# Linux/Mac
chmod +x run_tests.sh
./run_tests.sh

# Windows
run_tests.bat

# Direct pytest
pytest tests/ -v
```

**Run Specific Test Types:**

```bash
./run_tests.sh unit          # Unit tests only
./run_tests.sh integration   # Integration tests
./run_tests.sh api           # API tests
./run_tests.sh auth          # Authentication tests
./run_tests.sh animals       # Animals module
./run_tests.sh tracking      # Tracking module
./run_tests.sh fast          # Exclude slow tests
./run_tests.sh coverage      # With coverage report

# Run specific test files
pytest tests/test_predictions.py -v
pytest tests/test_corridors.py -v
pytest tests/test_sync.py -v
```

**Test Coverage:**

```bash
# Generate coverage report
./run_tests.sh coverage

# View report: htmlcov/index.html
```

**Coverage by Module:**

- Authentication: User registration, login, email-based OTP, JWT, permissions
- Animals: CRUD, live status with conflict detection, filtering, validation
- Tracking: GPS data, observations, real-time tracking, directional angle
- Predictions: ML predictions, corridor generation via RL, model integration
- Corridors: Corridor management, RL optimization with real GPS data, geometry
- Conflict Zones: CRUD operations, GeoJSON export, zone types, risk levels
- Spatial Utils: Point-in-polygon, distance calculations, corridor containment, conflict risk
- Geospatial: Live status workflows, corridor optimization integration
- Sync: Offline uploads, bulk data, conflict resolution, retry logic
- Integration: End-to-end workflows, multi-component testing, prediction workflows

**Test Statistics:**

- Total test files: 12
- Total test code: 2,800+ lines
- Test functions: 141
- Test classes: 50+
- Tests passing: 138
- Tests skipped: 3 (ML service dependent)
- Coverage target: 80%+

**Recent Test Results:**

```
138 passed, 3 skipped in 145.74s (0:02:25)
```

**Skipped Tests:**
- `test_obtain_token_pair` - JWT token endpoint not configured (system uses OTP)
- `test_refresh_token` - JWT refresh endpoint not configured (system uses OTP)
- `test_corridor_prediction_endpoint` - Skipped when ML service is unavailable (graceful degradation)

**Available Fixtures:**

- `admin_user`, `ranger_user`, `viewer_user` - Test users with different roles
- `authenticated_client`, `admin_client` - Authenticated API clients
- `sample_animal`, `sample_tracking`, `sample_corridor` - Pre-created test data
- `jwt_tokens` - JWT token pair for authentication
- `api_client` - Unauthenticated API client for testing public endpoints

**Writing Tests:**

```python
import pytest
from rest_framework import status
from tests.factories import AnimalFactory

pytestmark = pytest.mark.django_db

class TestMyFeature:
    def test_something(self, authenticated_client):
        url = '/api/v1/animals/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
```

**Test Markers:**

```bash
pytest -m unit -v                  # Run unit tests
pytest -m api -v                   # Run API tests
pytest -m integration -v           # Run integration tests
pytest -m "not slow" -v            # Skip slow tests
pytest -m "auth or animals" -v     # Run specific modules
pytest -m "not ml" -v              # Skip ML-dependent tests
```

**Test Improvements:**

Recent updates to the test suite include:

1. **Prediction Workflow Test** (`test_prediction_based_on_tracking`):
   - Fixed pagination handling for prediction list endpoint
   - Now properly tests that predictions can be queried for specific animals
   - Validates both paginated and non-paginated response formats

2. **Corridor Prediction Test** (`test_corridor_prediction_endpoint`):
   - Updated data format to match API expectations (`start_lat/start_lon` instead of nested objects)
   - Improved URL construction using proper reverse name (`prediction-corridor`)
   - Enhanced ML service availability handling (gracefully skips with 503)
   - Validates response structure for successful predictions

3. **Geospatial Feature Tests**:
   - Added 30 new tests covering conflict zones, spatial utilities, and geospatial workflows
   - Tests include point-in-polygon detection, distance calculations, and risk assessment
   - Validates GeoJSON export for map integration
   - Tests corridor optimization with real GPS data

**System Checks:**

```bash
python manage.py check
python manage.py check --deploy  # Production checks
```

### API Documentation

Interactive API documentation is available when the Django server is running:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

### Database Access

Since models use `managed = False`, the system works with your existing Supabase database structure. The Django ORM provides a convenient interface without managing migrations.

**Access the database shell:**

```bash
python manage.py dbshell
```

**Use Django shell for ORM queries:**

```bash
python manage.py shell
```

Example queries:

```python
from apps.animals.models import Animal
from apps.tracking.models import Tracking

# Get all active animals
animals = Animal.objects.filter(status='active')

# Get latest tracking for an animal
latest = Tracking.objects.filter(animal=animals[0]).order_by('-timestamp').first()
```

### Database Management

Common operations:

```bash
# Create cache table for session storage
python manage.py createcachetable

# Check database configuration
python manage.py check --database default

# Backup database (PostgreSQL)
pg_dump -h your-host -U your-user -d your-db > backup.sql

# Clear expired sessions
python manage.py clearsessions
```

### Logging

Application logs are stored in `backend/logs/`:

- `django.log` - Django application logs (API requests, errors, warnings)
- `ml_service.log` - ML service logs (model loading, predictions, errors)

**Log Configuration:**

Logs include timestamps, log levels, and contextual information. Configure log levels in `settings.py`:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
    },
}
```

**View logs:**

```bash
# View Django logs
tail -f backend/logs/django.log

# View ML service logs
tail -f backend/logs/ml_service.log

# Search for errors
grep ERROR backend/logs/django.log
```

## Production Deployment

### Environment Configuration

**Production `.env` settings:**

```env
# Security
DEBUG=False
SECRET_KEY=<generate-strong-secret-key>
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# ML Service
ML_SERVICE_URL=http://ml-service:8001
ML_SERVICE_API_KEY=<secure-api-key>

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Static/Media files (for production)
STATIC_ROOT=/var/www/static
MEDIA_ROOT=/var/www/media
STATIC_URL=/static/
MEDIA_URL=/media/

# Email Configuration (for OTP and notifications)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@wildlife.com
```

### Running with Gunicorn

**Django Backend:**

```bash
cd backend

gunicorn wildlife_backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --threads 2 \
  --timeout 120 \
  --access-logfile logs/gunicorn-access.log \
  --error-logfile logs/gunicorn-error.log \
  --log-level info
```

**Systemd service file (`/etc/systemd/system/wildlife-backend.service`):**

```ini
[Unit]
Description=Wildlife Backend Django Application
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/wildlife_backend/backend
Environment="PATH=/opt/wildlife_backend/backend/venv/bin"
ExecStart=/opt/wildlife_backend/backend/venv/bin/gunicorn \
          --workers 4 \
          --bind unix:/run/wildlife-backend.sock \
          wildlife_backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

### Running ML Service

**ML Service with Uvicorn:**

```bash
cd backend

uvicorn ml_service.main:app \
  --host 0.0.0.0 \
  --port 8001 \
  --workers 2 \
  --log-level info \
  --access-log
```

**Systemd service file (`/etc/systemd/system/wildlife-ml.service`):**

```ini
[Unit]
Description=Wildlife ML Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/wildlife_backend/backend
Environment="PATH=/opt/wildlife_backend/backend/venv/bin"
ExecStart=/opt/wildlife_backend/backend/venv/bin/uvicorn \
          ml_service.main:app \
          --host 0.0.0.0 \
          --port 8001 \
          --workers 2

[Install]
WantedBy=multi-user.target
```

**Enable and start services:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable wildlife-backend wildlife-ml
sudo systemctl start wildlife-backend wildlife-ml
sudo systemctl status wildlife-backend wildlife-ml
```

### Docker Deployment

**Build and run with Docker Compose:**

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**docker-compose.yml structure:**

```yaml
version: "3.8"

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - ml-service
    volumes:
      - ./backend/media:/app/media
      - ./backend/logs:/app/logs

  ml-service:
    build: ./backend/ml_service
    ports:
      - "8001:8001"
    volumes:
      - ./backend/ml_service/data:/app/data
```

### Nginx Configuration

**Reverse proxy configuration (`/etc/nginx/sites-available/wildlife-backend`):**

```nginx
upstream django_backend {
    server unix:/run/wildlife-backend.sock fail_timeout=0;
}

upstream ml_service {
    server localhost:8001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 100M;

    # Static files
    location /static/ {
        alias /var/www/wildlife/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/wildlife/media/;
        expires 7d;
    }

    # Django backend
    location / {
        proxy_pass http://django_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ML Service
    location /api/v1/ml/ {
        proxy_pass http://ml_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Enable site and restart Nginx:**

```bash
sudo ln -s /etc/nginx/sites-available/wildlife-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/HTTPS Setup

**Using Let's Encrypt with Certbot:**

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Static Files Collection

```bash
cd backend

# Collect static files
python manage.py collectstatic --noinput

# Set proper permissions
sudo chown -R www-data:www-data /var/www/wildlife/static
sudo chmod -R 755 /var/www/wildlife/static
```

### Database Migrations

While models use `managed = False`, you may need to create cache tables:

```bash
python manage.py createcachetable
```

### Monitoring and Health Checks

**Health check endpoints:**

- Django: `http://yourdomain.com/health/`
- ML Service: `http://yourdomain.com/api/v1/ml/health`

**Set up monitoring with systemd:**

Create a monitoring script (`/opt/wildlife_backend/monitor.sh`):

```bash
#!/bin/bash
curl -f http://localhost:8000/health/ || systemctl restart wildlife-backend
curl -f http://localhost:8001/health || systemctl restart wildlife-ml
```

Add to crontab:

```bash
*/5 * * * * /opt/wildlife_backend/monitor.sh
```

## Troubleshooting

**ML Service Not Responding**

Check if the service is running: `curl http://localhost:8001/health`

Verify the API key matches in both Django settings and ML service configuration. Check logs in `backend/logs/ml_service.log` for specific errors.

**Database Connection Issues**

Verify the Supabase database URL in your `.env` file. Test the connection using `python manage.py dbshell`. Ensure the database exists and credentials are correct.

**Model Loading Errors**

Verify model files exist in the appropriate `data/` subdirectories. Check that file formats are correct (`.zip` for RL models, `.h5` or `.pkl` for others). Review logs for specific loading error messages.

**Import Errors**

Ensure your virtual environment is activated. Reinstall dependencies with `pip install -r requirements.txt`. Verify you're using Python 3.10 or higher.

## Security Considerations

### API Security

- All API endpoints use JWT authentication (except public health checks)
- OTP-based two-factor authentication for sensitive operations
- Rate limiting on authentication endpoints to prevent brute force
- CORS properly configured for allowed origins only

### Data Security

- Passwords hashed with Argon2
- Sensitive data encrypted at rest in database
- SSL/TLS required for production
- API keys rotated regularly

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY` (generate with `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up firewall rules (allow only 80, 443, SSH)
- [ ] Configure database backups
- [ ] Set up log rotation
- [ ] Review and update CORS settings
- [ ] Set secure cookies (`SESSION_COOKIE_SECURE=True`)

## Performance Optimization

### Caching

The system uses database cache for performance optimization:

```python
# Live status cached for 5 seconds
cache.set('animals_live_status', data, 5)

# Predictions cached for 1 hour
cache.set(f'prediction_{animal_id}', prediction, 3600)
```

**Clear cache:**

```bash
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
```

**Create cache table:**

```bash
python manage.py createcachetable
```

### Database Optimization

**Create indexes for frequently queried fields:**

```sql
CREATE INDEX idx_tracking_animal_timestamp ON tracking(animal_id, timestamp DESC);
CREATE INDEX idx_animals_status ON animals(status) WHERE status = 'active';
```

**Query optimization tips:**

- Use `select_related()` for foreign keys
- Use `prefetch_related()` for many-to-many
- Add database indexes on filter fields
- Use `only()` and `defer()` to limit fields
- Paginate large result sets

### ML Model Optimization

- Models loaded once at startup and cached
- Predictions batched when possible
- Heavy computations offloaded to ML service
- Response caching for frequently requested predictions

## Backup and Recovery

### Database Backup

**Automated daily backup script:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/wildlife"
DB_NAME="wildlife_db"

pg_dump -h your-host -U your-user -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Add to crontab:**

```bash
0 2 * * * /opt/wildlife_backend/backup.sh
```

### Restore from Backup

```bash
gunzip -c backup_20240101_020000.sql.gz | psql -h your-host -U your-user -d wildlife_db
```

### Media Files Backup

```bash
# Backup uploaded files
rsync -avz /var/www/wildlife/media/ /backups/media/

# Restore
rsync -avz /backups/media/ /var/www/wildlife/media/
```

## Troubleshooting

### Common Issues

**1. ML Service Not Responding**

```bash
# Check if service is running
curl http://localhost:8001/health

# Check logs
tail -f backend/logs/ml_service.log

# Restart service
sudo systemctl restart wildlife-ml

# Verify API key configuration
grep ML_SERVICE_API_KEY backend/.env
```

**2. Database Connection Issues**

```bash
# Test connection
python manage.py dbshell

# Check connection in Django shell
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
>>> print("Connected!")

# Verify environment variable
echo $DATABASE_URL
```

**3. Model Loading Errors**

```bash
# Check model files exist
ls -lh backend/ml_service/data/rl/
ls -lh backend/ml_service/data/lstm/

# Verify model paths in config
cat backend/ml_service/config/rl_config.py

# Check permissions
chmod 644 backend/ml_service/data/**/*.pkl
```

**4. Import Errors**

```bash
# Ensure venv is activated
which python  # Should point to venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python version
python --version  # Should be 3.10+
```

**5. High Memory Usage**

```bash
# Check memory usage
free -h

# Reduce Gunicorn workers
gunicorn --workers 2 wildlife_backend.wsgi:application

# Clear Django cache
python manage.py shell -c "from django.core.cache import cache; cache.clear()"

# Restart services
sudo systemctl restart wildlife-backend wildlife-ml
```

**6. Slow API Responses**

```bash
# Check database query performance
python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import override_settings
>>> with override_settings(DEBUG=True):
>>>     # Run your query
>>>     print(len(connection.queries))
>>>     print(connection.queries[-1])

# Enable query logging
# Add to settings.py:
LOGGING['loggers']['django.db.backends'] = {
    'level': 'DEBUG',
    'handlers': ['console'],
}

```

**7. OTP Emails Not Sending**

```bash
# Check email configuration
python manage.py shell
>>> from django.conf import settings
>>> print(settings.EMAIL_BACKEND)
>>> print(settings.EMAIL_HOST_USER)

# Test email sending
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail(
...     'Test Email',
...     'This is a test.',
...     'noreply@wildlife.com',
...     ['your-email@example.com'],
...     fail_silently=False,
... )

# Check Docker logs for OTP codes (development mode)
docker-compose logs -f wildlife_django | grep "OTP for"

# For Gmail: Create an App Password
# Visit: https://myaccount.google.com/apppasswords
# Generate app password and use it in EMAIL_HOST_PASSWORD
```

## Deployment

### Deploying to Render / Heroku / Railway (Low-Memory Platforms)

The platform is optimized for low-memory deployments (512MB RAM). Follow these steps:

**1. Environment Variables for Production**

Set these in your hosting platform's dashboard:

```env
# Required
SUPABASE_DATABASE_URL=postgresql://user:pass@host:port/db
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Email (required for OTP authentication)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=Aureynx Conservation <your-email@gmail.com>

# CRITICAL: Disable local ML to prevent memory issues
DISABLE_LOCAL_ML=True

# ML Service (optional, deploy separately)
ML_SERVICE_URL=https://your-ml-service.com
ML_SERVICE_API_KEY=your-api-key
```

**2. Build Command**

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
```

**3. Start Command**

```bash
gunicorn wildlife_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 180 --max-requests 1000 --max-requests-jitter 50
```

**4. Health Check Endpoint**

Set your platform's health check to: `/health/`

**Why `DISABLE_LOCAL_ML=True` is Critical**

TensorFlow + Django workers = Memory explosion! Each Gunicorn worker loads TensorFlow independently, consuming 500MB+ per worker. On free/basic tiers with 512MB total RAM, this causes:

```
CRITICAL WORKER TIMEOUT
ERROR Worker was sent SIGKILL! Perhaps out of memory?
```

With `DISABLE_LOCAL_ML=True`:
- Django backend: ~100-150MB RAM
- Single worker: Fast startup, no timeouts
- ML features: Use separate ML service or gracefully degrade

**5. Deploying the ML Service Separately**

Deploy `ml_service` as a separate service (it needs 1GB+ RAM):

```bash
# In ml_service directory
pip install -r requirements.txt
uvicorn ml_service.main:app --host 0.0.0.0 --port $PORT
```

Then set `ML_SERVICE_URL` to point to this service.

**6. Gmail Configuration for OTP**

Critical: `DEFAULT_FROM_EMAIL` must match `EMAIL_HOST_USER` or Gmail will reject emails.

```env
EMAIL_HOST_USER=your-email@gmail.com
DEFAULT_FROM_EMAIL=Aureynx Conservation <your-email@gmail.com>
```

Get Gmail App Password:
1. Visit https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Wildlife Platform"
4. Copy the 16-character password
5. Use it in `EMAIL_HOST_PASSWORD`

**7. Troubleshooting Deployment**

Worker timeouts during startup:

```
Set DISABLE_LOCAL_ML=True
Reduce workers to 1
Increase timeout to 180s+
```

Out of memory errors:

```
Upgrade to a plan with 1GB+ RAM
OR keep DISABLE_LOCAL_ML=True
OR deploy ML service separately
```

OTPs not sending:

```
Check EMAIL_HOST_USER matches DEFAULT_FROM_EMAIL
Verify Gmail App Password is correct
Check logs for email sending errors
```

### Deploying with Docker

For self-hosted or cloud VMs with sufficient RAM:

```bash
# Set environment variables in .env file
cp .env.example .env
nano .env

# Build and start services
docker-compose up -d --build

# Check logs
docker-compose logs -f wildlife_django

# Run migrations
docker-compose exec wildlife_django python manage.py migrate

# Create superuser
docker-compose exec wildlife_django python manage.py createsuperuser
```

Docker deployment includes both Django backend and ML service with proper resource allocation.

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `./run_tests.sh`
5. Commit with clear messages: `git commit -m "Add feature X"`
6. Push to your fork: `git push origin feature/your-feature`
7. Create a Pull Request

### Code Standards

- Follow PEP 8 for Python code
- Use type hints where applicable
- Write docstrings for functions and classes
- Keep functions focused and under 50 lines
- Add tests for new features
- Update documentation

### Testing Requirements

- All tests must pass before merging
- Maintain or improve code coverage
- Add integration tests for new endpoints
- Test with real GPS data when possible

## License

MIT License

Copyright (c) 2025 Wildlife Conservation Platform

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

For issues, questions, or contributions:

- Create an issue on GitHub
- Check application logs in `backend/logs/`
- Review API documentation at `/api/docs/`
- Ensure environment variables are properly configured

Built for wildlife conservation to help protect endangered species and manage wildlife corridors effectively.
