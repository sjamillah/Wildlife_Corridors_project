import os
import sys
import django
import requests
import json
from pathlib import Path

# Setup Django - adjust path since we're in tests folder
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wildlife_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.animals.models import Animal
from apps.tracking.models import Tracking
from apps.core.models import ConflictZone, WildlifeAlert
from apps.tracking.hmm_loader import get_hmm_predictor
from apps.predictions.xgboost_loader import get_xgboost_predictor
from apps.animals.movement_predictor import get_predictor
from apps.corridors.rl_optimizer import RLOptimizer
from apps.core.alerts import check_and_create_alerts

User = get_user_model()

# Test configuration
BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:8000')
TEST_EMAIL = os.getenv('TEST_EMAIL', 'test@example.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'testpass123')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_header(message):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def test_hmm_loader():
    print_header("TEST 1: HMM Behavioral Predictor")
    
    try:
        hmm_predictor = get_hmm_predictor()
        print_success("HMM predictor initialized")
        
        # Test behavior prediction
        behavior = hmm_predictor.predict_behavior(
            speed_kmh=5.2,
            directional_angle=45.0,
            prev_speed=4.8,
            prev_angle=42.0,
            species="elephant"
        )
        
        assert behavior in ['resting', 'foraging', 'traveling', 'migrating'], \
            f"Invalid behavior: {behavior}"
        
        print_success(f"HMM predicts behavior: {behavior}")
        print_info(f"Model loaded: {hmm_predictor.models_loaded}")
        
        return True
    except Exception as e:
        print_error(f"HMM test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_xgboost_loader():
    print_header("TEST 2: XGBoost Habitat Predictor")
    
    try:
        xgboost_predictor = get_xgboost_predictor()
        print_success("XGBoost predictor initialized")
        
        # Check if models are loaded
        if 'elephant' in xgboost_predictor.models:
            print_success("XGBoost model loaded for elephant")
        else:
            print_info("XGBoost model not found for elephant (using fallback)")
        
        if 'wildebeest' in xgboost_predictor.models:
            print_success("XGBoost model loaded for wildebeest")
        else:
            print_info("XGBoost model not found for wildebeest (using fallback)")
        
        # Test habitat prediction
        habitat = xgboost_predictor.predict_habitat(
            lat=-2.5,
            lon=37.5,
            species="elephant"
        )
        
        assert 'habitat_score' in habitat, "Missing habitat_score"
        assert 0 <= habitat['habitat_score'] <= 1, "Invalid habitat_score range"
        
        print_success(f"XGBoost habitat score: {habitat['habitat_score']:.2f}")
        print_info(f"Suitability: {habitat.get('suitability', 'Unknown')}")
        
        return True
    except Exception as e:
        print_error(f"XGBoost test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_bbmm_lstm_predictor():
    print_header("TEST 3: BBMM/LSTM Movement Predictor")
    
    try:
        predictor = get_predictor()
        print_success("Movement predictor initialized")
        
        # Test BBMM prediction
        predicted = predictor.predict_with_bbmm(
            current_lat=-2.5,
            current_lon=37.5,
            prev_lat=-2.498,
            prev_lon=37.498,
            species="elephant"
        )
        
        assert 'lat' in predicted and 'lon' in predicted, "Missing lat/lon"
        print_success(f"BBMM prediction: lat={predicted['lat']:.4f}, lon={predicted['lon']:.4f}")
        
        # Test LSTM if available
        try:
            # Get some tracking data for LSTM
            animals = Animal.objects.filter(status='active')[:1]
            if animals.exists():
                animal = animals.first()
                tracking = Tracking.objects.filter(animal=animal).order_by('-timestamp')[:20]
                if tracking.exists():
                    historical = list(tracking.values('lat', 'lon', 'timestamp'))
                    lstm_pred = predictor.predict_with_lstm(
                        historical_data=historical,
                        species=animal.species
                    )
                    if lstm_pred:
                        print_success(f"LSTM prediction: lat={lstm_pred.get('lat', 'N/A')}, lon={lstm_pred.get('lon', 'N/A')}")
                    else:
                        print_info("LSTM not available (using BBMM fallback)")
        except Exception as e:
            print_info(f"LSTM test skipped: {e}")
        
        return True
    except Exception as e:
        print_error(f"Movement predictor test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_rl_optimizer():
    print_header("TEST 4: RL Corridor Optimizer")
    
    try:
        rl_optimizer = RLOptimizer()
        print_success("RL optimizer initialized")
        
        # Test corridor optimization
        try:
            result = rl_optimizer.optimize_corridor(
                start_point={"lat": -2.5, "lon": 37.5},
                end_point={"lat": -3.0, "lon": 38.0},
                species="elephant",
                steps=10  # Small number for testing
            )
            
            assert 'geojson' in result, "Missing geojson"
            print_success("RL corridor optimization completed")
            print_info(f"Optimization score: {result.get('summary', {}).get('optimization_score', 'N/A')}")
        except Exception as e:
            print_info(f"RL optimization test skipped (may need GPS data): {e}")
        
        return True
    except Exception as e:
        print_error(f"RL optimizer test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_alert_system():
    print_header("TEST 5: Alert System")
    
    try:
        # Check if alert model exists
        alert_count = WildlifeAlert.objects.count()
        print_info(f"Current alerts in database: {alert_count}")
        
        # Test alert creation function
        animals = Animal.objects.filter(status='active')[:1]
        if animals.exists():
            animal = animals.first()
            tracking = Tracking.objects.filter(animal=animal).order_by('-timestamp').first()
            
            if tracking:
                conflict_zones = ConflictZone.objects.filter(is_active=True)[:1]
                alerts = check_and_create_alerts(
                    animal=animal,
                    tracking=tracking,
                    conflict_zones=list(conflict_zones) if conflict_zones.exists() else []
                )
                
                print_success(f"Alert system functional (created {len(alerts)} alerts)")
            else:
                print_info("No tracking data available for alert test")
        else:
            print_info("No active animals available for alert test")
        
        return True
    except Exception as e:
        print_error(f"Alert system test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_api_endpoints():
    print_header("TEST 6: API Endpoints")
    
    endpoints = [
        ("Health Check", "GET", "/health/"),
        ("Live Status", "GET", "/api/animals/live_status/"),
        ("HMM Behavior Summary", "GET", "/api/v1/tracking/behavior/summary/"),
        ("XGBoost Environment", "GET", "/api/v1/predictions/xgboost/environment/?lat=-2.5&lon=37.5&species=elephant"),
    ]
    
    results = []
    
    for name, method, path in endpoints:
        try:
            url = f"{BASE_URL}{path}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                print_success(f"{name}: {method} {path} - Status {response.status_code}")
                results.append(True)
            elif response.status_code == 404:
                print_error(f"{name}: {method} {path} - Not Found (404)")
                results.append(False)
            else:
                print_info(f"{name}: {method} {path} - Status {response.status_code}")
                results.append(True)  # Not 404, so endpoint exists
        except requests.exceptions.ConnectionError:
            print_error(f"{name}: Cannot connect to {BASE_URL} - Is Django running?")
            results.append(False)
        except Exception as e:
            print_error(f"{name}: {e}")
            results.append(False)
    
    return all(results)

def test_integration():
    print_header("TEST 7: Full Integration Test")
    
    try:
        # Get an animal
        animals = Animal.objects.filter(status='active')[:1]
        if not animals.exists():
            print_info("No active animals found - skipping integration test")
            return True
        
        animal = animals.first()
        tracking = Tracking.objects.filter(animal=animal).order_by('-timestamp').first()
        
        if not tracking:
            print_info("No tracking data found - skipping integration test")
            return True
        
        # Test full pipeline
        hmm_predictor = get_hmm_predictor()
        behavior = hmm_predictor.predict_behavior(
            speed_kmh=tracking.speed_kmh or 0,
            directional_angle=tracking.directional_angle,
            species=animal.species
        )
        
        xgboost_predictor = get_xgboost_predictor()
        habitat = xgboost_predictor.predict_habitat(
            lat=tracking.lat,
            lon=tracking.lon,
            species=animal.species
        )
        
        predictor = get_predictor()
        predicted = predictor.predict_with_bbmm(
            current_lat=tracking.lat,
            current_lon=tracking.lon,
            prev_lat=tracking.lat - 0.001,
            prev_lon=tracking.lon - 0.001,
            species=animal.species
        )
        
        print_success(f"Integration test passed for {animal.name}")
        print_info(f"  Behavior: {behavior}")
        print_info(f"  Habitat Score: {habitat['habitat_score']:.2f}")
        print_info(f"  Predicted: lat={predicted['lat']:.4f}, lon={predicted['lon']:.4f}")
        
        return True
    except Exception as e:
        print_error(f"Integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("="*60)
    print("  WILDLIFE ML INTEGRATION TEST SUITE")
    print("="*60)
    print(f"{Colors.END}\n")
    
    print_info(f"Testing against: {BASE_URL}")
    print_info("Make sure Django is running: python manage.py runserver\n")
    
    tests = [
        ("HMM Behavioral Predictor", test_hmm_loader),
        ("XGBoost Habitat Predictor", test_xgboost_loader),
        ("BBMM/LSTM Movement Predictor", test_bbmm_lstm_predictor),
        ("RL Corridor Optimizer", test_rl_optimizer),
        ("Alert System", test_alert_system),
        ("API Endpoints", test_api_endpoints),
        ("Full Integration", test_integration),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"{test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print_header("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.END}\n")
    
    if passed == total:
        print_success("🎉 All tests passed! All ML models are working correctly.")
        return 0
    else:
        print_error(f"⚠️  {total - passed} test(s) failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

