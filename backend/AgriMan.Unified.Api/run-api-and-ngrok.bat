@echo off
title AGRIMAN 4-in-1 Unified Backend and ngrok Runner
cd /d "%~dp0"
echo Starting AGRIMAN Unified 4-in-1 API and ngrok Tunnel...
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
