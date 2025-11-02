#!/bin/bash
# Wildlife Backend Test Runner
# Usage: ./run_tests.sh [options]

set -e

echo "Wildlife Backend Test Suite"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse arguments
TEST_TYPE="${1:-all}"
COVERAGE="${2:-}"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install test dependencies if needed
echo "Checking test dependencies..."
pip install -q pytest pytest-django pytest-cov 2>/dev/null || true

echo ""
echo "Running tests..."
echo ""

case $TEST_TYPE in
    "unit")
        echo "Running unit tests only..."
        pytest tests/ -m unit -v
        ;;
    
    "integration")
        echo "Running integration tests only..."
        pytest tests/ -m integration -v
        ;;
    
    "api")
        echo "Running API tests only..."
        pytest tests/ -m api -v
        ;;
    
    "auth")
        echo "Running authentication tests..."
        pytest tests/test_authentication.py -v
        ;;
    
    "animals")
        echo "Running animals tests..."
        pytest tests/test_animals.py -v
        ;;
    
    "tracking")
        echo "Running tracking tests..."
        pytest tests/test_tracking.py -v
        ;;
    
    "fast")
        echo "Running fast tests (excluding slow tests)..."
        pytest tests/ -m "not slow" -v
        ;;
    
    "coverage")
        echo "Running all tests with coverage report..."
        pytest tests/ --cov=apps --cov=wildlife_backend --cov-report=html --cov-report=term -v
        echo ""
        echo "Coverage report generated in htmlcov/index.html"
        ;;
    
    "all")
        echo "Running all tests..."
        if [ "$COVERAGE" = "--coverage" ] || [ "$COVERAGE" = "-c" ]; then
            pytest tests/ --cov=apps --cov=wildlife_backend --cov-report=html --cov-report=term -v
            echo ""
            echo "Coverage report generated in htmlcov/index.html"
        else
            pytest tests/ -v
        fi
        ;;
    
    "quick")
        echo "Running quick smoke tests..."
        pytest tests/ -m "not slow" --maxfail=1 -x -v
        ;;
    
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: ./run_tests.sh [test_type] [--coverage]"
        echo ""
        echo "Test types:"
        echo "  all         - Run all tests (default)"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  api         - Run API tests only"
        echo "  auth        - Run authentication tests"
        echo "  animals     - Run animals module tests"
        echo "  tracking    - Run tracking module tests"
        echo "  fast        - Run fast tests (exclude slow)"
        echo "  quick       - Quick smoke test (fail fast)"
        echo "  coverage    - Run with coverage report"
        echo ""
        echo "Options:"
        echo "  --coverage, -c  - Generate coverage report"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh                    # Run all tests"
        echo "  ./run_tests.sh fast               # Run fast tests"
        echo "  ./run_tests.sh all --coverage     # All tests with coverage"
        echo "  ./run_tests.sh animals            # Animals tests only"
        exit 1
        ;;
esac

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}[PASS] Tests passed successfully!${NC}"
else
    echo -e "${RED}[FAIL] Tests failed!${NC}"
fi

exit $TEST_EXIT_CODE

