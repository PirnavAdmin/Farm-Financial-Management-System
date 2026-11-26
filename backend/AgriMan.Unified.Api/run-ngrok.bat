@echo off
title AGRIMAN ngrok Tunnel (travel-daringly-tapering.ngrok-free.dev -> Port 5147)
echo ===============================================================================
echo   Starting ngrok Tunnel for AGRIMAN Unified APIs (Port 5147)...
echo   Domain: https://travel-daringly-tapering.ngrok-free.dev
echo ===============================================================================
echo   Once ngrok starts:
echo   1. Active Tunnel: https://travel-daringly-tapering.ngrok-free.dev
echo   2. Swagger UI:    https://travel-daringly-tapering.ngrok-free.dev/swagger
echo   3. Local Swagger: http://localhost:5147/swagger
echo ===============================================================================
echo.
cd /d "%~dp0"
if exist "%~dp0ngrok.exe" (
    "%~dp0ngrok.exe" http --url=travel-daringly-tapering.ngrok-free.dev 5147
) else if exist "C:\Users\ADMIN\AppData\Roaming\npm\ngrok.cmd" (
    call "C:\Users\ADMIN\AppData\Roaming\npm\ngrok.cmd" http --url=travel-daringly-tapering.ngrok-free.dev 5147
) else (
    ngrok http --url=travel-daringly-tapering.ngrok-free.dev 5147
)
pause
