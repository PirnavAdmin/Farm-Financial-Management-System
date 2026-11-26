@echo off
title AgriMan Unified API (Port 5147 & 5200)
cd /d "%~dp0backend\AgriMan.Unified.Api"

echo ===================================================
echo [1/2] Checking MySQL Database Service (Port 3306)...
echo ===================================================
powershell -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 3306); $client.Dispose(); exit 0 } catch { exit 1 }"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MySQL is NOT running on port 3306!
    echo Requesting Administrator permission to start MySQL80 service...
    powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c net start MySQL80' -Verb RunAs -Wait"
    timeout /t 3 /nobreak >nul
)

echo.
echo ===================================================
echo [2/2] Starting AgriMan Unified Backend API...
echo Local URLs:     http://localhost:5147 ; http://localhost:5200
echo Swagger Docs:   http://localhost:5147/swagger
echo Ngrok Target:   http://localhost:5147
echo ===================================================
dotnet run --urls "http://0.0.0.0:5147;http://0.0.0.0:5200"
pause
