@echo off
title AgriMan Unified API (Port 5147 & 5200)
cd /d "%~dp0backend\AgriMan.Unified.Api"
echo ===================================================
echo Starting AgriMan Unified Backend API on ports 5147 and 5200...
echo Connected to MySQL database: agriman_db
echo Swagger Documentation: http://localhost:5147/swagger
echo Ngrok Tunnel Target:   http://localhost:5147
echo ===================================================
dotnet run --urls "http://0.0.0.0:5147;http://0.0.0.0:5200"
pause
