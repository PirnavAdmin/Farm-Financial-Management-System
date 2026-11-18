@echo off
title Ngrok Tunnel (Port 5200)
echo ===================================================
echo Starting Ngrok Tunnel forwarding to port 5200...
echo Public URL: https://travel-daringly-tapering.ngrok-free.dev
echo ===================================================
ngrok http 5200
pause
