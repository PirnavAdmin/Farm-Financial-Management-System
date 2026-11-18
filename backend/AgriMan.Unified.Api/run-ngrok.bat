@echo off
title AGRIMAN ngrok Tunnel for All 4 APIs
echo ===============================================================================
echo   Starting ngrok Tunnel for AGRIMAN Unified APIs (Port 5200)...
echo ===============================================================================
echo   Once ngrok starts:
echo   1. Copy the Forwarding HTTPS URL (e.g. https://xxxx.ngrok-free.app)
echo   2. Open {Forwarding-URL}/swagger in your browser for Swagger 4-in-1 Dashboard
echo   3. Open {Forwarding-URL}/index.html in your browser for Sales UI
echo   4. Top-right dropdown in Swagger switches between all 4 data definitions!
echo ===============================================================================
echo.
cd /d "%~dp0"
if exist "%~dp0ngrok.exe" (
    "%~dp0ngrok.exe" http 5200
) else if exist "C:\Users\ADMIN\AppData\Roaming\npm\ngrok.cmd" (
    call "C:\Users\ADMIN\AppData\Roaming\npm\ngrok.cmd" http 5200
) else (
    ngrok http 5200
)
pause
