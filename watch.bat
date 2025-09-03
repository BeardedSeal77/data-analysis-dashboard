@echo off
echo Starting Tailwind CSS compilation for the entire project...
echo.
echo Input:  app/input.css
echo Output: app/globals.css
echo Config: tailwind.config.js
echo.

cd /d "%~dp0"

echo Starting CSS watch mode...
npm run css-watch

pause