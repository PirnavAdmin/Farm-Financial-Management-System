@echo off
title Ngrok Tunnel (Port 5147)
echo ===================================================
echo Starting Ngrok Tunnel forwarding to port 5147...
echo Public URL: https://travel-daringly-tapering.ngrok-free.dev
echo ===================================================
ngrok http --url=travel-daringly-tapering.ngrok-free.dev 5147
pause
