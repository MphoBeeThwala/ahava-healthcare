# Start All Development Services
# Run this after setting up databases

param(
    [switch]$Backend,
    [switch]$Workers,
    [switch]$Admin,
    [switch]$Doctor,
    [switch]$Patient,
    [switch]$Nurse,
    [switch]$All
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AHAVA HEALTHCARE - START SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to start a service in a new window
function Start-Service {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Yellow
    $scriptBlock = "cd '$Path'; $Command; Read-Host 'Press Enter to close'"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
    Write-Host "✓ $Name started in new window" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

# Check if databases are configured
$envPath = "apps\backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "✗ ERROR: Backend .env file not found!" -ForegroundColor Red
    Write-Host "  Please run QUICK-START-CLOUD.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Get current directory
$baseDir = Get-Location

if ($All -or (-not $Backend -and -not $Workers -and -not $Admin -and -not $Doctor -and -not $Patient -and -not $Nurse)) {
    Write-Host "Starting ALL services..." -ForegroundColor Cyan
    Write-Host ""
    
    # Start Backend
    Start-Service "Backend API" "$baseDir\apps\backend" "npm run dev"
    
    # Start Workers
    Start-Service "Background Workers" "$baseDir\apps\backend" "npm run dev:worker"
    
    # Start Frontend Apps
    Start-Service "Admin Portal" "$baseDir\apps\admin" "npm run dev"
    Start-Service "Doctor Portal" "$baseDir\apps\doctor" "npm run dev"
    Start-Service "Patient App" "$baseDir\apps\patient" "npm run dev"
    Start-Service "Nurse App" "$baseDir\apps\nurse" "npm run dev"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "All services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your applications:" -ForegroundColor Yellow
    Write-Host "  Backend API:    http://localhost:4000" -ForegroundColor White
    Write-Host "  Admin Portal:   http://localhost:3000" -ForegroundColor White
    Write-Host "  Doctor Portal:  http://localhost:3001" -ForegroundColor White
    Write-Host "  Patient App:    http://localhost:3002" -ForegroundColor White
    Write-Host "  Nurse App:      http://localhost:3003" -ForegroundColor White
    Write-Host ""
    Write-Host "Check backend health: http://localhost:4000/health" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    if ($Backend) {
        Start-Service "Backend API" "$baseDir\apps\backend" "npm run dev"
    }
    if ($Workers) {
        Start-Service "Background Workers" "$baseDir\apps\backend" "npm run dev:worker"
    }
    if ($Admin) {
        Start-Service "Admin Portal" "$baseDir\apps\admin" "npm run dev"
    }
    if ($Doctor) {
        Start-Service "Doctor Portal" "$baseDir\apps\doctor" "npm run dev"
    }
    if ($Patient) {
        Start-Service "Patient App" "$baseDir\apps\patient" "npm run dev"
    }
    if ($Nurse) {
        Start-Service "Nurse App" "$baseDir\apps\nurse" "npm run dev"
    }
    
    Write-Host ""
    Write-Host "Services started!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Press Ctrl+C in each window to stop services" -ForegroundColor Yellow


