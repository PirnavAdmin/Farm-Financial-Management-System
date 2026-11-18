@echo off
title AgriMan Unified API (Port 5200)
cd /d "%~dp0backend\AgriMan.Unified.Api"
echo ===================================================
echo Starting AgriMan Unified Backend API on ports 5200 and 5147...
echo Connected to MySQL database: agriman_db
echo Swagger Documentation: http://localhost:5200/swagger
echo ===================================================
dotnet run --urls "http://localhost:5200;http://localhost:5147"
pause
