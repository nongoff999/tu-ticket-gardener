@echo off
title TU Ticket Gardener Server
echo ====================================
echo   TU Ticket Gardener - Local Server
echo ====================================
echo.
echo Starting server at http://127.0.0.1:3000
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
cmd /c npx -y http-server . -p 3000 -o

pause
