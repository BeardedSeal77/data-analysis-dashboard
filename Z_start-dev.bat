@echo off
chcp 65001 >nul
echo Starting BIN381 Data Analysis Dashboard Development Environment...
echo.
echo This will start:
echo - Next.js frontend (port 3000) from app/
echo - Task Management Flask API (port 5000) from 01_TaskManagement/api/
echo - Project Analysis API (DISABLED - using CSV files)
echo.

cd /d "%~dp0"

echo Starting development servers...
npx concurrently "npm run next-dev" "npm run flask-task"
if errorlevel 1 (
  echo Error: Failed to start development servers
  pause
)
pause