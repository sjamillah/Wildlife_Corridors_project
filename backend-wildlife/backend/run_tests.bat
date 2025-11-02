@echo off
REM Wildlife Backend Test Runner for Windows
REM Usage: run_tests.bat [test_type] [--coverage]

echo.
echo Wildlife Backend Test Suite
echo.

set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all

set COVERAGE=%2

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo Checking test dependencies...
pip install -q pytest pytest-django pytest-cov 2>nul

echo.
echo Running tests...
echo.

if "%TEST_TYPE%"=="unit" (
    echo Running unit tests only...
    pytest tests\ -m unit -v
    goto :end
)

if "%TEST_TYPE%"=="integration" (
    echo Running integration tests only...
    pytest tests\ -m integration -v
    goto :end
)

if "%TEST_TYPE%"=="api" (
    echo Running API tests only...
    pytest tests\ -m api -v
    goto :end
)

if "%TEST_TYPE%"=="auth" (
    echo Running authentication tests...
    pytest tests\test_authentication.py -v
    goto :end
)

if "%TEST_TYPE%"=="animals" (
    echo Running animals tests...
    pytest tests\test_animals.py -v
    goto :end
)

if "%TEST_TYPE%"=="tracking" (
    echo Running tracking tests...
    pytest tests\test_tracking.py -v
    goto :end
)

if "%TEST_TYPE%"=="fast" (
    echo Running fast tests (excluding slow tests^)...
    pytest tests\ -m "not slow" -v
    goto :end
)

if "%TEST_TYPE%"=="coverage" (
    echo Running all tests with coverage report...
    pytest tests\ --cov=apps --cov=wildlife_backend --cov-report=html --cov-report=term -v
    echo.
    echo Coverage report generated in htmlcov\index.html
    goto :end
)

if "%TEST_TYPE%"=="all" (
    echo Running all tests...
    if "%COVERAGE%"=="--coverage" (
        pytest tests\ --cov=apps --cov=wildlife_backend --cov-report=html --cov-report=term -v
        echo.
        echo Coverage report generated in htmlcov\index.html
    ) else if "%COVERAGE%"=="-c" (
        pytest tests\ --cov=apps --cov=wildlife_backend --cov-report=html --cov-report=term -v
        echo.
        echo Coverage report generated in htmlcov\index.html
    ) else (
        pytest tests\ -v
    )
    goto :end
)

if "%TEST_TYPE%"=="quick" (
    echo Running quick smoke tests...
    pytest tests\ -m "not slow" --maxfail=1 -x -v
    goto :end
)

echo Unknown test type: %TEST_TYPE%
echo.
echo Usage: run_tests.bat [test_type] [--coverage]
echo.
echo Test types:
echo   all         - Run all tests (default^)
echo   unit        - Run unit tests only
echo   integration - Run integration tests only
echo   api         - Run API tests only
echo   auth        - Run authentication tests
echo   animals     - Run animals module tests
echo   tracking    - Run tracking module tests
echo   fast        - Run fast tests (exclude slow^)
echo   quick       - Quick smoke test (fail fast^)
echo   coverage    - Run with coverage report
echo.
echo Options:
echo   --coverage, -c  - Generate coverage report
echo.
echo Examples:
echo   run_tests.bat                    # Run all tests
echo   run_tests.bat fast               # Run fast tests
echo   run_tests.bat all --coverage     # All tests with coverage
echo   run_tests.bat animals            # Animals tests only
goto :eof

:end
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [PASS] Tests passed successfully!
) else (
    echo.
    echo [FAIL] Tests failed!
)

