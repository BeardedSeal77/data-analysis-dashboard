@echo off
chcp 65001 >nul
echo ============================================================
echo BIN381 Data Analysis Dashboard - Development Environment
echo ============================================================
echo.
echo This will:
echo 1. Install npm dependencies (if needed)
echo 2. Setup Python virtual environments (if needed)
echo 3. Start all 3 servers:
echo    - Next.js frontend (port 3000)
echo    - Task Management Flask API (port 5000)
echo    - Project ML API (port 5001)
echo.
echo ============================================================
echo.

cd /d "%~dp0"

REM ============================================================
REM Step 1: Check and install npm dependencies
REM ============================================================
echo [1/4] Checking npm dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
    echo npm packages installed successfully
) else (
    echo npm packages already installed
)
echo.

REM ============================================================
REM Step 2: Setup Task Management API venv
REM ============================================================
echo [2/4] Setting up Task Management API environment...
if not exist "01_TaskManagement\api\venv" (
    echo Creating virtual environment for Task Management API...
    cd "01_TaskManagement\api"
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create venv for Task Management
        cd ..\..
        pause
        exit /b 1
    )
    echo Installing Python packages for Task Management...
    venv\Scripts\python.exe -m pip install --upgrade pip
    venv\Scripts\python.exe -m pip install Flask flask-cors pymongo python-dotenv
    cd ..\..
    echo Task Management API venv setup complete
) else (
    echo Task Management API venv already exists
)
echo.

REM ============================================================
REM Step 3: Setup Project ML API venv
REM ============================================================
echo [3/4] Setting up Project ML API environment...
if not exist "02_Project\api\venv" (
    echo Creating virtual environment for Project ML API...
    cd "02_Project\api"
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create venv for Project ML API
        cd ..\..
        pause
        exit /b 1
    )
    echo Installing Python packages for Project ML API...
    venv\Scripts\python.exe -m pip install --upgrade pip
    venv\Scripts\python.exe -m pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install Python packages for Project ML API
        cd ..\..
        pause
        exit /b 1
    )
    cd ..\..
    echo Project ML API venv setup complete
) else (
    echo Project ML API venv already exists
)
echo.

REM ============================================================
REM Step 4: Start all development servers
REM ============================================================
echo [4/4] Starting development servers...
echo.
echo ============================================================
echo All servers starting...
echo - Next.js:          http://localhost:3000
echo - Task Management:  http://localhost:5000/api/health
echo - Project ML API:   http://localhost:5001/api/health
echo ============================================================
echo.

npx concurrently --names "NEXT,TASK-API,ML-API" --prefix-colors "cyan,magenta,yellow" "npm run next-dev" "npm run flask-task" "npm run flask-project"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start development servers
    pause
    exit /b 1
)

pause