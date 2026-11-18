@echo off
title AGRIMAN Unified Backend (All Modules -> Farmersdb)
echo ===============================================================================
echo   AGRIMAN UNIFIED BACKEND PLATFORM (ALL 9 MODULES)
echo   Single Database: [Farmersdb] on NIRANJAN\SQLEXPRESS
echo ===============================================================================
echo   [0] Unified Total Data       : /api/total-data, /api/total-data/summary, /api/health
echo   [1] Auth ^& User API          : Login, Register, OTP, Roles, Permissions
echo   [2] Farmers Registry         : Farmers, Addresses, Bank Accounts
echo   [3] Farm Management          : Farms, Lands, Documents, Masters
echo   [4] Income Management        : Categories, Transactions, Payments
echo   [5] Purchases ^& Suppliers    : Suppliers, Purchase Orders, Payments
echo   [6] Inventory ^& Products     : Products, Categories, Units, Stock
echo   [7] Expenses API             : Ledger, Categories, Voucher Numbers, CSV
echo   [8] Sales API                : Records, Pricing, Summary Analytics, Seed
echo   [9] Machinery ^& Equipment    : Fleet, Lookups, Summary, Operating Expenses
echo.
echo   Local Swagger UI             : http://localhost:5200/swagger
echo   Sales Management Dashboard   : http://localhost:5200/index.html
echo   All Modules Listening On     : http://0.0.0.0:5200
echo   ngrok Tunnel Target          : Port 5200 (Run run-api-and-ngrok.bat)
echo ===============================================================================
echo.
cd /d "%~dp0"
dotnet run --urls "http://0.0.0.0:5200"
pause
