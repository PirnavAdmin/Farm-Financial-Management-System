param (
    [int]$Port = 5200
)

$ErrorActionPreference = "Continue"
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "   AGRIMAN UNIFIED FARM & FINANCIAL MANAGEMENT PLATFORM" -ForegroundColor Cyan
Write-Host "   Single Unified Database: [Farmersdb] on NIRANJAN\SQLEXPRESS" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Cleaning up old processes on port $Port..." -ForegroundColor Yellow

# Kill existing processes
Stop-Process -Name "AgriMan.Unified.Api" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "SalesApi" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "ngrok" -Force -ErrorAction SilentlyContinue
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*dotnet.exe*' } | ForEach-Object {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

$apiLog = Join-Path $scriptDir "api.log"
$apiErr = Join-Path $scriptDir "api.err"
$ngrokLog = Join-Path $scriptDir "ngrok.log"
$ngrokErr = Join-Path $scriptDir "ngrok.err"

# Locate ngrok executable
$ngrokPath = Join-Path $scriptDir "ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    $ngrokCmd = Get-Command "ngrok" -ErrorAction SilentlyContinue
    if ($ngrokCmd) { $ngrokPath = $ngrokCmd.Source }
}

$dllPath = Join-Path $scriptDir "bin\Debug\net8.0\AgriMan.Unified.Api.dll"

function Start-BackendApi {
    Write-Host "Starting AGRIMAN Unified Backend (All 9 Modules -> Farmersdb)..." -ForegroundColor Green
    if (Test-Path $dllPath) {
        return Start-Process -FilePath "dotnet" `
            -ArgumentList "$dllPath --urls http://0.0.0.0:$Port" `
            -WorkingDirectory $scriptDir `
            -RedirectStandardOutput $apiLog `
            -RedirectStandardError $apiErr `
            -PassThru
    } else {
        return Start-Process -FilePath "dotnet" `
            -ArgumentList "run --no-restore --urls http://0.0.0.0:$Port" `
            -WorkingDirectory $scriptDir `
            -RedirectStandardOutput $apiLog `
            -RedirectStandardError $apiErr `
            -PassThru
    }
}

function Start-NgrokTunnel {
    Write-Host "Starting ngrok tunnel for port $Port..." -ForegroundColor Green
    return Start-Process -FilePath $ngrokPath `
        -ArgumentList "http $Port --log=stdout" `
        -WorkingDirectory $scriptDir `
        -RedirectStandardOutput $ngrokLog `
        -RedirectStandardError $ngrokErr `
        -PassThru
}

$apiProcess = Start-BackendApi
Start-Sleep -Seconds 3

$ngrokProcess = Start-NgrokTunnel
Start-Sleep -Seconds 3

# Fetch ngrok public URL from local tunnel status API
$tunnelUrl = $null
for ($i = 0; $i -lt 15; $i++) {
    try {
        $tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction Stop
        if ($tunnels.tunnels -and $tunnels.tunnels.Count -gt 0) {
            $tunnelUrl = $tunnels.tunnels[0].public_url
            break
        }
    } catch { }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] AGRIMAN UNIFIED PLATFORM IS ONLINE (DATABASE: Farmersdb)!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  LOCAL ENDPOINTS:" -ForegroundColor Cyan
Write-Host "  - Swagger UI:                 http://localhost:$Port/swagger" -ForegroundColor White
Write-Host "  - Sales UI:                   http://localhost:$Port/index.html" -ForegroundColor White
Write-Host "  - API Health Check:           http://localhost:$Port/health" -ForegroundColor White
Write-Host ""

if ($tunnelUrl) {
    Write-Host "  PUBLIC NGROK ENDPOINTS (For Integration & Mobile/Web Apps):" -ForegroundColor Magenta
    Write-Host "  - Public Swagger UI:          $tunnelUrl/swagger" -ForegroundColor Yellow
    Write-Host "  - Public Sales UI:            $tunnelUrl/index.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  API MODULE ENDPOINTS (Stored in Farmersdb):" -ForegroundColor Cyan
    Write-Host "  - 0. Unified Total Data:      $tunnelUrl/api/total-data" -ForegroundColor White
    Write-Host "  - 1. Auth & User API:         $tunnelUrl/api/auth/login" -ForegroundColor White
    Write-Host "  - 2. Farm Management API:     $tunnelUrl/api/farms" -ForegroundColor White
    Write-Host "  - 3. Expenses API:            $tunnelUrl/api/expenses" -ForegroundColor White
    Write-Host "  - 4. Sales API:               $tunnelUrl/api/sales" -ForegroundColor White
    Write-Host "  - 5. Machinery API:           $tunnelUrl/api/machinery" -ForegroundColor White
    Write-Host ""
    Write-Host "  SWAGGER UI ORDERED VIEWS (Top-Right Dropdown):" -ForegroundColor Gray
    Write-Host "    [1] 🌾 All Modules (Unified Platform - Farmersdb) [DEFAULT]" -ForegroundColor Green
    Write-Host "    [2] 1. Auth & User API Only" -ForegroundColor Gray
    Write-Host "    [3] 2. Farmers, Addresses & Bank API Only" -ForegroundColor Gray
    Write-Host "    [4] 3. Farms & Land Holdings API Only" -ForegroundColor Gray
    Write-Host "    [5] 4. Income Management API Only" -ForegroundColor Gray
    Write-Host "    [6] 5. Purchases & Suppliers API Only" -ForegroundColor Gray
    Write-Host "    [7] 6. Inventory & Products API Only" -ForegroundColor Gray
    Write-Host "    [8] 7. Expenses API Only" -ForegroundColor Gray
    Write-Host "    [9] 8. Sales API Only" -ForegroundColor Gray
    Write-Host "    [10] 9. Machinery & Equipment API Only" -ForegroundColor Gray
} else {
    Write-Host "  [NOTICE] Ngrok tunnel is initializing. Check ngrok.log if URL is delayed." -ForegroundColor Yellow
}
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host "Keep this window open to maintain API and ngrok tunnel." -ForegroundColor Cyan
Write-Host "Run stop-api.bat to safely stop." -ForegroundColor Gray
Write-Host ""

# Resilient keeper loop with auto-restart
while ($true) {
    Start-Sleep -Seconds 5
    if ($apiProcess.HasExited) {
        Write-Host "[AUTO-RECOVERY] Backend API exited. Restarting..." -ForegroundColor Yellow
        $apiProcess = Start-BackendApi
    }
    if ($ngrokProcess.HasExited) {
        Write-Host "[AUTO-RECOVERY] Ngrok exited. Restarting..." -ForegroundColor Yellow
        $ngrokProcess = Start-NgrokTunnel
    }
}
