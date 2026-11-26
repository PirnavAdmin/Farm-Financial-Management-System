@echo off
title Start MySQL Service
echo Requesting Administrator permission to start MySQL80 service...
powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c net start MySQL80' -Verb RunAs -Wait"
echo.
powershell -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 3306); $client.Dispose(); Write-Host 'MySQL Service is running successfully on port 3306!' -ForegroundColor Green } catch { Write-Host 'Failed to connect to MySQL on port 3306. Please check Windows Services (services.msc).' -ForegroundColor Red }"
pause
