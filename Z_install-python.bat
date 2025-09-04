@echo off
echo Installing Python dependencies globally...
echo.
echo Checking for administrator privileges...
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Administrator privileges confirmed.
) else (
    echo This script requires administrator privileges to install packages globally.
    echo Please run as administrator.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo Installing Python packages globally from requirements.txt...
pip install -r requirements.txt