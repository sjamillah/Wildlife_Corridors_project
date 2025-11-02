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

CORS_ALLOWED_ORIGINS=http://localhost:3000
```

5. Set up the database:

The system connects to your existing Supabase PostgreSQL database. Models use `managed = False` to work with existing tables.

```bash
python manage.py createcachetable
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

## Project Structure

```
Wildlife_Backend/
├── backend/
│   ├── apps/                    # Django applications
│   │   ├── authentication/      # User authentication & OTP
│   │   ├── animals/            # Animal management & tracking
│   │   ├── tracking/           # GPS data & observations
│   │   ├── predictions/        # ML prediction storage
│   │   ├── corridors/          # Wildlife corridor management
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

- `POST /register/` - Start user registration (sends OTP)
- `POST /verify-otp/` - Verify OTP and complete registration
- `POST /login/` - Start login (sends OTP)
- `POST /login/verify/` - Complete login with OTP verification
- `POST /logout/` - Logout user
- `POST /refresh/` - Refresh JWT access token
- `GET /me/` - Get current user profile
- `PUT /me/` - Update user profile

### Animals (`/api/v1/animals/`)

- `GET /` - List all animals (supports filtering and search)
- `POST /` - Create new animal
- `GET /{id}/` - Get animal details
- `PUT /{id}/` - Update animal
- `DELETE /{id}/` - Delete animal
- `GET /live_status/` - Real-time animal status with current and predicted positions

### Tracking (`/api/v1/tracking/`)

- `GET /` - List tracking data
- `POST /` - Upload single GPS point
- `POST /bulk_upload/` - Bulk upload multiple GPS points
- `GET /by_animal/?animal_id={id}` - Get tracking data for specific animal
- `GET /live_tracking/` - Real-time tracking with full ML pipeline processing

### Predictions (`/api/v1/predictions/`)

- `GET /` - List all predictions
- `POST /` - Create prediction
- `GET /corridor/` - Generate corridor prediction (calls ML service)
- `GET /ml_status/` - Check ML service health and model status

### Corridors (`/api/v1/corridors/`)

- `GET /` - List corridors
- `POST /` - Create corridor
- `POST /optimize/` - Optimize corridor using RL models

### ML Service (`/api/v1/ml/`)

- `GET /health/live` - Service health check
- `POST /corridor/generate` - Generate optimal corridor
- `POST /corridor/evaluate` - Evaluate corridor quality

## Mobile App Integration & Offline Sync

The platform provides full offline support for field rangers collecting data in areas with limited connectivity using **WatermelonDB** for local storage.

### Architecture

**Frontend (Mobile/Web):**

- **WatermelonDB** - Local reactive database for offline data storage
- Stores animals, tracking points, and observations locally
- Automatic sync when internet connectivity is detected

**Backend (Django):**

- Receives bulk sync data from frontend
- Validates and processes each item
- Saves to Supabase PostgreSQL database
- Returns sync results with conflict detection

**Flow:** WatermelonDB (Frontend) → Django API → Supabase Database

### Offline Data Collection

Mobile/web apps using WatermelonDB collect data offline, then sync when connectivity is restored.

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

### WatermelonDB Integration

**Installation:**

```bash
# React Native
npm install @nozbe/watermelondb @nozbe/with-observables

# React
npm install @nozbe/watermelondb
```

**Define Schema:**

```javascript
// model/schema.js
import { appSchema, tableSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "animals",
      columns: [
        { name: "local_id", type: "string", isIndexed: true },
        { name: "server_id", type: "string", isOptional: true },
        { name: "name", type: "string" },
        { name: "species", type: "string" },
        { name: "collar_id", type: "string" },
        { name: "status", type: "string" },
        { name: "health_status", type: "string" },
        { name: "gender", type: "string" },
        { name: "synced", type: "boolean" },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "tracking",
      columns: [
        { name: "local_id", type: "string", isIndexed: true },
        { name: "server_id", type: "string", isOptional: true },
        { name: "animal_id", type: "string", isIndexed: true },
        { name: "lat", type: "number" },
        { name: "lon", type: "number" },
        { name: "altitude", type: "number", isOptional: true },
        { name: "speed_kmh", type: "number", isOptional: true },
        { name: "heading", type: "number", isOptional: true },
        { name: "timestamp", type: "number" },
        { name: "collar_id", type: "string" },
        { name: "synced", type: "boolean" },
      ],
    }),
  ],
});
```

**Create Models:**

```javascript
// model/Animal.js
import { Model } from "@nozbe/watermelondb";
import { field, date } from "@nozbe/watermelondb/decorators";

export default class Animal extends Model {
  static table = "animals";

  @field("local_id") localId;
  @field("server_id") serverId;
  @field("name") name;
  @field("species") species;
  @field("collar_id") collarId;
  @field("status") status;
  @field("health_status") healthStatus;
  @field("gender") gender;
  @field("synced") synced;
  @date("created_at") createdAt;
}
```

**Sync Service:**

```javascript
// services/syncService.js
import { Q } from "@nozbe/watermelondb";

class SyncService {
  constructor(database, apiUrl, getAuthToken) {
    this.database = database;
    this.apiUrl = apiUrl;
    this.getAuthToken = getAuthToken;
  }

  async syncToServer() {
    // Get unsynced records
    const unsyncedAnimals = await this.database
      .get("animals")
      .query(Q.where("synced", false))
      .fetch();

    const unsyncedTracking = await this.database
      .get("tracking")
      .query(Q.where("synced", false))
      .fetch();

    // Prepare data for Django
    const payload = {
      device_id: await this.getDeviceId(),
      animals: unsyncedAnimals.map((animal) => ({
        local_id: animal.localId,
        name: animal.name,
        species: animal.species,
        collar_id: animal.collarId,
        status: animal.status,
        health_status: animal.healthStatus,
        gender: animal.gender,
      })),
      tracking: unsyncedTracking.map((track) => ({
        local_id: track.localId,
        animal: track.animalId,
        lat: track.lat,
        lon: track.lon,
        altitude: track.altitude,
        speed_kmh: track.speedKmh,
        heading: track.heading,
        timestamp: new Date(track.timestamp).toISOString(),
        collar_id: track.collarId,
      })),
    };

    // Upload to Django
    const response = await fetch(`${this.apiUrl}/api/v1/sync/upload/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAuthToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    // Mark synced records
    await this.markAsSynced(unsyncedAnimals, unsyncedTracking, result);

    return result;
  }

  async markAsSynced(animals, tracking, syncResult) {
    await this.database.write(async () => {
      // Mark synced animals
      for (const animal of animals) {
        await animal.update((record) => {
          record.synced = true;
        });
      }

      // Mark synced tracking
      for (const track of tracking) {
        await track.update((record) => {
          record.synced = true;
        });
      }
    });
  }

  async getDeviceId() {
    // Get unique device ID
    return DeviceInfo.getUniqueId();
  }
}

export default SyncService;
```

**Auto-Sync on Network Change:**

```javascript
// App.js or useEffect
import NetInfo from "@react-native-community/netinfo";

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      // Auto-sync when online
      syncService
        .syncToServer()
        .then((result) => {
          console.log("Sync completed:", result.summary);
        })
        .catch((error) => {
          console.error("Sync failed:", error);
        });
    }
  });

  return () => unsubscribe();
}, []);
```

### Best Practices

**WatermelonDB Best Practices:**

**Batch Size:** Limit to 100 items per sync request for optimal performance

**Local IDs:** Use UUIDs for `local_id` to prevent conflicts

**Sync Status:** Add `synced` boolean field to all WatermelonDB tables

**Network Detection:** Use NetInfo to auto-sync when connectivity is restored

**Error Handling:** Store sync errors in WatermelonDB and implement exponential backoff

**Conflict Resolution:** Server data takes precedence; update local WatermelonDB with server IDs

**Data Validation:** Validate data in WatermelonDB before upload to minimize errors

### WatermelonDB → Django → Supabase Flow

```
User Action (Offline)
    ↓
WatermelonDB (Local Storage)
    ↓
Network Detected
    ↓
POST /api/v1/sync/upload/
    ↓
Django Validation
    ↓
Supabase PostgreSQL
    ↓
Response with server_id
    ↓
Update WatermelonDB (mark synced, save server_id)
```

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

The project includes a comprehensive test suite with 2,000+ lines of test code covering all backend modules.

**Test Files:**

- `test_authentication.py` (241 lines) - User registration, login, OTP, JWT
- `test_animals.py` (260 lines) - Animal management, live status
- `test_tracking.py` (293 lines) - GPS tracking, observations
- `test_predictions.py` (200 lines) - ML predictions, model integration
- `test_corridors.py` (232 lines) - Corridor management, RL optimization
- `test_sync.py` (285 lines) - Offline uploads, conflict resolution
- `test_integration.py` (290 lines) - End-to-end workflows
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

- Authentication: User registration, login, OTP, JWT, permissions
- Animals: CRUD, live status, filtering, validation
- Tracking: GPS data, observations, real-time tracking
- Predictions: ML predictions, corridor generation, model integration
- Corridors: Corridor management, RL optimization, geometry
- Sync: Offline uploads, bulk data, conflict resolution, retry logic
- Integration: End-to-end workflows, multi-component testing

**Test Statistics:**

- Total test files: 9
- Total test code: 2,000+ lines
- Test functions: 120+
- Test classes: 40+
- Coverage target: 80%+

**Available Fixtures:**

- `admin_user`, `ranger_user`, `viewer_user` - Test users with different roles
- `authenticated_client`, `admin_client` - Authenticated API clients
- `sample_animal`, `sample_tracking`, `sample_corridor` - Pre-created test data
- `jwt_tokens` - JWT token pair for authentication

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
pytest -m unit -v            # Run unit tests
pytest -m "not slow" -v      # Skip slow tests
pytest -m "auth or animals" -v  # Run specific modules
```

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

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
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

**7. OTP Not Sending**

```bash
# Verify Twilio credentials
python manage.py shell
>>> from decouple import config
>>> print(config('TWILIO_ACCOUNT_SID'))

# Test Twilio connection
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/Messages.json \
  --data-urlencode "From=+1234567890" \
  --data-urlencode "To=+1234567890" \
  --data-urlencode "Body=Test" \
  -u $TWILIO_SID:$TWILIO_TOKEN
```

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
