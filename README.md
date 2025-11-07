# Aureynx Wildlife Conservation Platform

Real-time wildlife tracking and conservation management with AI-powered predictions.

---

## Table of Contents

1. [Demo Video](#demo-video)
2. [Deployed Application](#deployed-application)
3. [Overview](#overview)
4. [Project Structure](#project-structure)
5. [Installation Guide](#installation-guide)
6. [Key Features](#key-features)
7. [Machine Learning Models](#machine-learning-models)
8. [Testing Summary](#testing-summary)
9. [API Documentation](#api-documentation)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

## Demo Video

**5-Minute Platform Demo**: [Insert Video Link Here]

The demo showcases:
- Live animal tracking with intelligent map visualization
- AI predictions for movement patterns and behavior
- Corridor monitoring and risk assessment systems
- Real-time alerts when animals enter danger zones
- Ranger patrol coordination interface
- Data analytics and reporting features

---

## Deployed Application

**Backend API**: https://wildlife-project-backend.onrender.com

**API Documentation**: https://wildlife-project-backend.onrender.com/api/docs/

**Frontend**: Follow the installation steps below to run locally

*Note: First API request may take 30-60 seconds as the free-tier server spins up*

---

## Overview

This platform helps track wildlife and predict corridor usage using machine learning. Rangers can monitor animal locations in real-time, receive alerts when animals leave safe zones, and use AI predictions to anticipate where animals might move next.

The system runs on Django REST backend with React dashboard. Five ML models trained on 472,307 GPS records from Kenya-Tanzania corridors handle behavior classification, movement prediction, habitat analysis, and corridor planning. The platform passed 137 automated tests before going live.

What makes this different: instead of just showing dots on a map, the system actually predicts what animals might do next and warns rangers before problems happen.

---

## Project Structure

```
Wildlife_Corridors_project/
├── backend-wildlife/
│   ├── backend/
│   │   ├── apps/              # 8 Django applications
│   │   │   ├── animals/       # Animal management
│   │   │   ├── tracking/      # GPS data handling
│   │   │   ├── predictions/   # ML predictions
│   │   │   ├── corridors/     # Corridor management
│   │   │   ├── authentication/# Auth system
│   │   │   ├── sync/          # Data synchronization
│   │   │   ├── users/         # User management
│   │   │   └── wildlife/      # Core wildlife logic
│   │   ├── ml_models/         # Trained model files
│   │   │   ├── hmm/           # Behavior classification
│   │   │   ├── bbmm/          # Movement prediction
│   │   │   ├── xgboost/       # Habitat suitability
│   │   │   ├── lstm/          # Position forecasting
│   │   │   └── rl/            # Corridor optimization
│   │   └── requirements.txt   # Python dependencies
│   ├── data/                  # Training datasets
│   ├── notebooks/             # Jupyter analysis notebooks
│   └── docker-compose.yml     # Database containers
└── frontend/
    └── web/
        ├── src/
        │   ├── screens/       # Main UI screens
        │   │   ├── Dashboard.js
        │   │   ├── AnimalTracking.js
        │   │   ├── CorridorMap.js
        │   │   └── Analytics.js
        │   ├── components/    # Reusable UI components
        │   │   ├── Map/
        │   │   ├── Alerts/
        │   │   └── Charts/
        │   ├── services/      # API integration layer
        │   │   ├── api.js
        │   │   ├── auth.js
        │   │   └── websocket.js
        │   └── constants/     # Configuration
        └── package.json       # Node dependencies
```

---

## Installation Guide

### Prerequisites

Before starting, install:
- **Python 3.9+** (backend)
- **Node.js 16+** (frontend)
- **Docker Desktop** (database)
- **Git** (version control)

Check installations:
```bash
python --version  # Should show 3.9 or higher
node --version    # Should show 16 or higher
docker --version  # Should show Docker version
```

---

### Database Setup

**Step 1: Navigate to backend directory**
```bash
cd Wildlife_Corridors_project/backend-wildlife
```

**Step 2: Start PostgreSQL and Redis containers**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432 (main database)
- Redis on port 6379 (caching and real-time data)

**Step 3: Verify containers are running**
```bash
docker ps
```

Should see two containers: `postgres` and `redis`

**Troubleshooting**: If port 5432 is already in use, stop any other PostgreSQL instances or modify `docker-compose.yml` to use different ports.

---

### Backend Setup

**Step 1: Create virtual environment**
```bash
cd backend
python -m venv venv
```

**Step 2: Activate virtual environment**

On Mac/Linux:
```bash
source venv/bin/activate
```

On Windows:
```bash
venv\Scripts\activate
```

Terminal prompt should now show `(venv)` prefix.

**Step 3: Install Python dependencies**
```bash
pip install -r requirements.txt
```

This installs Django, Django REST Framework, ML libraries, and other dependencies. Takes 2-3 minutes.

**Step 4: Configure environment variables**

Create `.env` file in `backend/` directory:
```
SECRET_KEY=your-secret-key-here-change-this
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wildlife_db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
DEBUG=True

# Email for OTP (optional for local development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Step 5: Run database migrations**
```bash
python manage.py migrate
```

This creates all database tables. Should see green "OK" messages for each migration.

**Step 6: Create admin user**
```bash
python manage.py createsuperuser
```

Enter email, name, and password when prompted. This account accesses the admin panel.

**Step 7: Load sample data (optional)**
```bash
python manage.py loaddata sample_animals
python manage.py loaddata sample_corridors
```

**Step 8: Start Django server**
```bash
python manage.py runserver
```

Server starts on `http://localhost:8000/`

**Verify backend is working**:
- Open `http://localhost:8000/api/docs/` - should see API documentation
- Open `http://localhost:8000/admin/` - should see Django admin login

Keep this terminal window open. Backend must be running for frontend to work.

---

### Frontend Setup

**Step 1: Open new terminal and navigate to frontend**
```bash
cd Wildlife_Corridors_project/frontend/web
```

**Step 2: Install Node dependencies**
```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag resolves React version conflicts. Takes 3-5 minutes.

**Step 3: Configure environment**

Create `.env` file in `frontend/web/` directory:
```
REACT_APP_ENV=development
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MAPBOX_TOKEN=your-mapbox-token-here
```

To get Mapbox token:
1. Go to https://www.mapbox.com/
2. Sign up for free account
3. Copy default public token from account dashboard
4. Paste in `.env` file

**Step 4: Start React development server**
```bash
npm start
```

Browser automatically opens to `http://localhost:3000/`

**Verify frontend is working**:
- Should see login screen
- No console errors in browser DevTools (F12)
- Map tiles load correctly (Mapbox is working)

---

### First Time Setup Complete

Both servers should now be running:
- Backend: `http://localhost:8000/`
- Frontend: `http://localhost:3000/`

**Test the connection**:
1. On frontend login screen, click "Register"
2. Enter email, name, and select role
3. Check email for 4-digit code (or check backend terminal for code if email not configured)
4. Enter code to complete registration
5. Should see dashboard with sample animals on map

**Common issues**:
- If map doesn't load: Check Mapbox token in `.env`
- If API calls fail: Ensure backend is running on port 8000
- If OTP doesn't arrive: Check backend terminal for code (it prints there during development)

---

## Key Features

### Interactive Wildlife Tracking Map

The map shows live animal positions with color-coded risk indicators:

- **Green markers**: Animals safely inside corridors
- **Orange markers**: Animals outside designated zones
- **Red markers**: Animals in poaching hotspots or danger areas

Click any marker to see animal details, recent movement history, and AI predictions for where it might go next.

### Corridor Visualization

Sky blue polylines show designated wildlife corridors with semi-transparent buffer zones. Corridors display:
- Target species
- Protection status  
- Usage statistics (how many animals use it)
- Risk zones along the route

### Real-Time Alert System

Automatic alerts trigger when:
- Animals exit corridor boundaries
- Animals approach human settlements
- Animals enter known conflict zones
- Unusual behavior patterns detected by ML

Each alert shows animal name, species, location, and risk level. Rangers can acknowledge or dismiss alerts after responding.

### Movement Predictions

Purple dotted lines show where AI predicts animals will move in the next few hours. Predictions update every 30 seconds as new GPS data arrives. Based on two models:
- BBMM for trajectory forecasting
- LSTM for directional trends

### Ranger Patrol Routes

Cyan dashed lines show active ranger patrols with live position markers. Click routes to see:
- Team member names
- Current patrol status
- Estimated arrival times at key locations

### Behavioral Analysis

Hidden Markov Models automatically classify animal behavior from GPS patterns:
- Resting (low movement, random directions)
- Foraging (moderate movement, some direction changes)
- Traveling (high movement, straight lines)

The system alerts rangers to unusual behavior that might indicate stress or danger.

### Layer Controls

Toggle visibility for different map layers:
- Wildlife corridors
- Risk zones
- Predicted paths
- Ranger patrols
- Habitat suitability overlays

Filter by species to focus on specific animals during operations.

### Data Analytics

Dashboard includes:
- Time spent in each behavioral state
- Distance traveled per day
- Corridor usage rates
- Human-wildlife conflict statistics
- Movement pattern visualizations

Export data as CSV or GeoJSON for GIS analysis.

---

## Machine Learning Models

Five specialized models handle different prediction tasks. All trained on 472,307 real GPS records from elephants and wildebeest in Kenya-Tanzania.

### Behavioral Analysis (HMM)

**What it does**: Automatically figures out if animals are resting, foraging, or traveling just from GPS movement patterns.

**Elephant model performance**:
- Trained on 187,937 GPS points from 30 elephants
- 61.5% accuracy (accounting for class imbalance)
- Identifies 5 behavioral states

Elephant time budget turns out pretty interesting. They spend almost half their time (47%) resting across two different rest patterns - one where they barely move (median 0.44 km steps), another with slightly more movement (median 0.46 km). Foraging takes up 40% of their time with step lengths around 0.5 km and high directional persistence (0.83) - meaning they move purposefully while feeding, not randomly wandering. Only 13% goes to actual traveling, but when they travel they're extremely direct (0.97 persistence), basically moving in straight lines toward wherever they're headed.

**Wildebeest model performance**:
- Trained on 278,532 GPS points from 36 wildebeest  
- 65.1% accuracy
- Better performance than elephants

Wildebeest are more balanced: 42% resting, 41% foraging, 18% traveling. They move in much smaller steps (median 0.12-0.22 km vs elephants' 0.44-0.58 km), which makes sense for grazers constantly moving while eating grass. When traveling, they show even higher directional persistence (0.94) than elephants, consistent with those famous long-distance migrations where the whole herd moves together.

**Prediction errors**: Step length predictions have relatively high errors (0.83 km MAE for elephants, 0.35 km for wildebeest). Turning angle predictions are better (0.36 and 0.31 radians). The model is better at classifying what animals are doing than predicting exactly where they'll step next.

**Real use**: Runs automatically on incoming GPS data. When an animal's movement pattern doesn't match what's expected for that location and time, rangers get alerted. Helps catch early signs of stress, injury, or approaching danger before serious problems develop.

### Movement Prediction (BBMM)

**What it does**: Predicts where animals will be in the next few hours based on recent movement and typical patterns.

**Elephant predictions**:
- 193,225 GPS records processed
- Average error: 344 meters
- Movement variance: 0.314 km²/hour

For elephants moving at typical speeds (2-5 km/h), predicting position within 344 meters gives rangers about 7-17 minutes of lead time. That's enough to respond before animals reach conflict zones or exit corridors. The high movement variance (0.314) reflects how unpredictable elephants can be - they might suddenly stop to investigate food, respond to herd dynamics, or avoid perceived threats.

**Wildebeest predictions**:
- 279,082 GPS records processed  
- Average error: 108 meters (3x better than elephants!)
- Movement variance: 0.085 km²/hour

Wildebeest are way more predictable. The 108-meter average error reflects their coordinated herd movement. During migrations, they follow consistent trajectories toward seasonal grazing areas. Lower variance (0.085) means they rarely make sudden unexpected moves.

Interestingly, turning angle errors are reversed - wildebeest have higher errors (2.03 degrees) than elephants (0.10 degrees). Suggests that while wildebeest trajectories are predictable overall, they make more frequent small direction adjustments following vegetation gradients while grazing.

**Real use**: Powers the purple prediction arrows on the tracking map. Updates every 30 seconds. Rangers use this to position ahead of animal movements, coordinate traffic during road crossings, and prepare villages before animals approach agricultural areas.

### Habitat Suitability (XGBoost)

**What it does**: Identifies which areas provide good habitat for each species based on environmental variables.

**Performance**:
- Elephant model: 79% AUC-ROC, 52% F1-score
- Wildebeest model: 75% AUC-ROC, 62% F1-score
- Geographic scope: Kenya-Tanzania corridor (29.0°E to 42.0°E)

Time of day emerged as the strongest predictor - 15% importance for elephants, 29% for wildebeest. Animals use different areas at different times based on temperature, water availability, and predation risk. Elephants are more flexible (hence lower importance), while wildebeest show stronger temporal patterns, probably driven by needing water at specific times.

The AUC-ROC scores (79% and 75%) mean the models successfully distinguish suitable from unsuitable habitat most of the time. Given a random good habitat patch and a random poor patch, the elephant model correctly ranks the good one 79% of the time.

F1-scores are moderate (52% and 62%), reflecting the real challenge of habitat modeling. These scores are good enough to prioritize conservation areas but not good enough to exclude areas from consideration based solely on model output.

**Real use**: Identifies core areas needing the highest protection. Helps place new corridors connecting high-quality habitat patches. The time-of-day importance enables dynamic management - monitoring certain corridor segments more intensively during predicted high-usage periods.

### Position Forecasting (LSTM)

**What it does**: Neural network learns sequential patterns in animal movement to predict future positions.

**Performance**:
- Mean error: 57 meters
- RMSE: 111 meters  
- R² score: 0.155 (explains only 15% of variance)

Being honest here - the LSTM shows limited predictive power. The R² of 0.155 means animal movement is way more complex than simple trajectory continuation. Animals respond to environmental cues, social dynamics, and threats that aren't captured in raw GPS sequences.

However, the 57-meter average error for very short-term predictions (next few minutes) still provides useful heading information. At this timescale, momentum and immediate behavior dominate, making sequential patterns more relevant.

The distance error of 151 meters (higher than MAE of 57m) indicates occasional large mistakes when animals suddenly change behavior. Like when an elephant traveling consistently suddenly stops to feed, or wildebeest abruptly change direction responding to perceived threat.

**Why LSTM struggles**:
- GPS coordinates alone don't show vegetation quality, water sources, or other animals
- Can't predict when animals switch between behavioral states  
- GPS fixes every 15-60 minutes create huge information gaps
- Individual animals have unique personalities not captured in population data

**Real use**: Combined with BBMM for ensemble forecasting. When LSTM and BBMM agree, confidence increases. When they diverge, signals potential behavior change needing investigation. Also useful for high-speed situations where even 2-5 minute predictions matter.

### Corridor Optimization (Reinforcement Learning)

**What it does**: Learns optimal corridor routes through trial-and-error, balancing animal safety against human-wildlife conflict.

**Algorithm comparison** (5 training episodes each):
- PPO (Proximal Policy Optimization): 136.0 mean reward - **Winner**
- A2C (Advantage Actor-Critic): 103.9 mean reward
- DQN (Deep Q-Network): 66.8 mean reward

PPO crushed it - 2x better than DQN and 30% better than A2C. This isn't surprising since PPO is designed for exactly this type of continuous control problem. PPO limits how much the policy can change per update, preventing it from forgetting good solutions while exploring. Also more sample-efficient than DQN, important since running environmental simulations is computationally expensive.

The high variance in PPO results (±52.3) reflects genuine problem difficulty. Some scenarios have obvious solutions (short direct path through uniform good habitat), others require complex routing around multiple constraints (settlements, industrial areas, degraded habitat while maintaining water access).

A2C has lower variance (±11.4) and decent average performance, making it a reliable backup. But its lower maximum reward (118 vs 238) means it struggles with complex scenarios.

DQN's poor performance (67 mean reward) shows value-based approaches don't work well for continuous corridor design problems.

**Reward function** balances:
- Habitat quality (higher scores for good habitat)
- Human avoidance (penalties near settlements)
- Water access (rewards for regular water along route)
- Path directness (penalties for excessive detours)
- Connectivity (rewards for linking protected areas)

**Real use**: Generates corridor recommendations between user-specified points. Conservation planners can run multiple scenarios with different constraint weights to explore trade-offs. As habitat suitability shifts with climate, corridors can be re-optimized for projected future conditions.

### What These Numbers Actually Mean

**Behavior classification works**: 61-65% accuracy means the system correctly identifies what animals are doing most of the time. Good enough for automatic alerting, not perfect enough to ignore human judgment.

**Movement predictions are useful**: Errors of 100-350 meters give enough lead time for rangers to respond before animals reach problem areas.

**Habitat models are actionable**: 75-79% discrimination ability works for prioritizing conservation areas and predicting corridor usage.

**LSTM has limits**: Only 15% explained variance, but short-term predictions still add value when combined with other models.

**PPO dominates corridor planning**: Doubling DQN's performance makes it the obvious choice for automated corridor design.

The models augment ranger capabilities rather than replacing human expertise. Conservation decisions still need local knowledge and ground-truthing. These tools just help focus limited resources on the highest-priority situations.

### Model Limitations

**Geographic specificity**: Everything trained on Kenya-Tanzania corridor data only. Performance likely degrades in other regions with different terrain, climate, or species populations. Before deploying elsewhere, retrain on local data or at minimum validate thoroughly.

**Class imbalance**: Both HMM models deal with 3:1 ratios between common and rare behaviors. Rare behaviors might get underdetected. Don't rely solely on automated alerts - maintain regular observation protocols.

**Temporal coverage**: Models reflect seasonal patterns in training data. May perform differently during droughts, floods, or unusual migration years. Interpret predictions cautiously during extraordinary conditions.

**Species specificity**: Only elephants and wildebeest have dedicated models currently. Other species use rule-based heuristics until enough GPS data accumulates. Each species needs 20-30 individuals tracked over multiple seasons for reliable models.

**Missing context**: Models use GPS patterns and basic environmental variables but miss weather conditions, predator presence, human activity patterns, social dynamics, and vegetation phenology. Animals may change behavior due to factors the models can't see.

---

## Testing Summary

The backend went through comprehensive testing before deployment. Started with 106 failing tests due to database configuration issues, ended with 137 passing tests.

### Test Results

![Test Overview](./tests/test_results_overview.png)

| Category | Passing Tests | Coverage |
|----------|--------------|----------|
| API Tests | 65 | CRUD, filtering, pagination, real-time features |
| Unit Tests | 27 | Model validation, calculations, utilities |
| Integration Tests | 11 | End-to-end workflows |
| Geospatial Tests | 30 | Corridor management, spatial operations |
| Performance Tests | 1 | Bulk data processing |
| **Total** | **137** | **100% pass rate** |

### What Broke Initially

![Initial Failures](./tests/initial_test_failures.png)

All tests failed at first because Django couldn't create database tables. Root cause: models had `managed = False` (for external Supabase production database) combined with `--nomigrations` flag. Test environment ended up with no tables at all.

Fixed by configuring conditional SQLite for testing, setting `managed = True` in test mode, and removing the no-migrations flag. Let Django handle test database setup normally.

### Major Issues Fixed

![Debugging Process](./tests/debugging_process.png)

**Model misalignment**: Prediction model switched from separate fields to JSON fields for input/results. Test fixtures still used old schema. Fixed by updating all fixtures to current models.

**API configuration**: List endpoints didn't support filtering because Django Filter Backend wasn't in settings. URL patterns had conflicts between `live/` endpoint and tracking records with id='live'. Fixed by adding filter backend and refactoring URLs with more specific patterns.

**Response handling**: Tests expected lists but APIs returned paginated dictionaries with 'results', 'count', 'next', 'previous'. Standardized pattern:
```python
response = self.client.get(url)
results = response.data.get('results', response.data)
```

**Authentication flow**: Tests written for password auth, but system uses OTP. Rewrote entire auth test suite for two-step OTP verification.

**ML service degradation**: Tests failed when optional ML service unavailable. Implemented fallback logic so core functionality works even when ML service is down.

### Test Coverage

Tests validate:
- All 55+ API endpoints
- OTP authentication workflows
- GPS data synchronization
- Real-time tracking updates
- Geospatial operations (point-in-polygon, buffer zones)
- Behavioral classification
- Movement predictions
- Corridor optimization
- Bulk data processing (10,000+ records)

Coverage at 87% of codebase:
- Models: 94%
- API views: 89%  
- Utilities: 92%
- Business logic: 85%

Platform considered production-ready after passing all tests.

---

## API Documentation

Backend provides 55+ REST endpoints across six categories:

**Authentication (10 endpoints)**
- OTP-based registration and login
- JWT token management and refresh
- User profile retrieval and updates
- Password reset for legacy accounts

**Animals (7 endpoints)**
- Create, retrieve, update, delete animals
- List with filtering (species, status, risk level)
- Live tracking with real-time positions
- Bulk animal import

**Tracking (14 endpoints)**
- GPS location upload
- Bulk data synchronization
- Historical trajectory queries
- Field observation recording
- Movement pattern analysis
- Corridor crossing detection

**Predictions (8 endpoints)**
- Behavioral state classification
- Movement trajectory forecasting
- Habitat suitability scoring
- Risk assessment
- Prediction confidence metrics

**Corridors (6 endpoints)**
- Corridor creation and management
- Usage statistics
- Containment checking
- RL-based optimization
- GeoJSON export

**Sync (10 endpoints)**
- Offline queue management
- Conflict resolution
- Sync status tracking
- Data integrity verification

Full documentation with examples: https://wildlife-project-backend.onrender.com/api/docs/

### Example API Calls

**Get all animals**:
```bash
GET /api/animals/
```

**Get live tracking data**:
```bash
GET /api/tracking/live/?species=elephant
```

**Predict movement**:
```bash
POST /api/predictions/movement/
{
  "animal_id": 123,
  "hours_ahead": 3
}
```

**Check corridor containment**:
```bash
POST /api/corridors/check-containment/
{
  "latitude": -1.2345,
  "longitude": 36.7890,
  "animal_id": 123
}
```

All endpoints require JWT authentication except registration and login.

---

## Troubleshooting

### Backend won't start

**Error**: `django.db.utils.OperationalError: FATAL: database "wildlife_db" does not exist`

**Fix**: Docker containers aren't running. Start them:
```bash
cd backend-wildlife
docker-compose up -d
```

Then rerun migrations:
```bash
cd backend
python manage.py migrate
```

---

### Frontend shows "Network Error"

**Problem**: Can't connect to backend API

**Check**:
1. Backend server running on port 8000?
2. `.env` file has correct API_URL?
3. First request after inactivity takes 30-60 seconds on free tier

**Fix**: Ensure backend terminal shows:
```
Starting development server at http://127.0.0.1:8000/
```

---

### Map doesn't load

**Problem**: White screen or missing map tiles

**Check**: Mapbox token in `frontend/web/.env`

**Get token**:
1. Sign up at https://www.mapbox.com
2. Copy default public token
3. Add to `.env`:
```
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZX...
```

Restart frontend server after adding token.

---

### OTP codes not arriving

**During development**: Check backend terminal - codes print there:
```
OTP Code for user@example.com: 1234
```

**In production**: Check email spam folder. Codes expire after 2 minutes.

---

### "401 Unauthorized" errors

**Problem**: JWT token expired (valid 24 hours)

**Fix**: Logout and login again to get fresh tokens. System should auto-refresh, but manual login works if that fails.

---

### Tests failing after git pull

**Problem**: Database schema changed but test DB not updated

**Fix**: Delete test database and rerun:
```bash
python manage.py test --keepdb=False
```

For specific failing tests:
```bash
python manage.py test wildlife.tests.test_api --verbosity=2
```

---

### Docker containers won't start

**Error**: `port is already allocated`

**Fix**: Another service using ports 5432 or 6379

**Check what's using ports**:
```bash
# Mac/Linux
lsof -i :5432
lsof -i :6379

# Windows
netstat -ano | findstr :5432
netstat -ano | findstr :6379
```

**Options**:
1. Stop conflicting service
2. Modify `docker-compose.yml` to use different ports

---

### Python packages won't install

**Error**: `error: Microsoft Visual C++ 14.0 is required` (Windows)

**Fix**: Install C++ build tools:
https://visualstudio.microsoft.com/visual-cpp-build-tools/

**Error**: `command 'gcc' failed` (Mac)

**Fix**: Install Xcode command line tools:
```bash
xcode-select --install
```

---

## License

MIT License

Copyright (c) 2024 Aureynx Conservation Technology

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

Built for wildlife conservation. Powered by machine learning. Tested for production.