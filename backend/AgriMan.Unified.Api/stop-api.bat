@echo off
title Stop AGRIMAN Backend and ngrok
cd /d "%~dp0"
echo Stopping AGRIMAN API, SalesApi, and ngrok processes...
powershell -Command "Stop-Process -Name AgriMan.Unified.Api, SalesApi, ngrok -Force -ErrorAction SilentlyContinue; Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*dotnet.exe*' } | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }"
echo All backend and ngrok processes stopped.
timeout /t 3 >nul
