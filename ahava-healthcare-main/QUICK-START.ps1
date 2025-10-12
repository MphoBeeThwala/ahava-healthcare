# Ahava Healthcare - Quick Start Script
# This script helps you start all services

Write-Host "Ahava Healthcare - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = "C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main"

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found. Please install Node.js first!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Function to check and install dependencies
function Install-Dependencies {
    param($appPath, $appName)
    
    Write-Host ""
    Write-Host "Checking $appName..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$appPath\node_modules")) {
        Write-Host "Installing dependencies for $appName..." -ForegroundColor Yellow
        Push-Location $appPath
        npm install
        Pop-Location
        Write-Host "$appName dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "$appName dependencies already installed" -ForegroundColor Green
    }
}

# Install dependencies for all apps
Write-Host ""
Write-Host "Installing Dependencies..." -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

Install-Dependencies "$baseDir\apps\backend" "Backend"
Install-Dependencies "$baseDir\apps\admin" "Admin Portal"
Install-Dependencies "$baseDir\apps\doctor" "Doctor Portal"
Install-Dependencies "$baseDir\apps\patient" "Patient App"
Install-Dependencies "$baseDir\apps\nurse" "Nurse App"

Write-Host ""
Write-Host "All dependencies installed!" -ForegroundColor Green
Write-Host ""

# Instructions
Write-Host "Ready to Start Services!" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open 6 separate PowerShell terminals and run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\backend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 (Workers):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\backend" -ForegroundColor Gray
Write-Host "  npm run dev:worker" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 3 (Admin Portal):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\admin" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 4 (Doctor Portal):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\doctor" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 5 (Patient App):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\patient" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 6 (Nurse App):" -ForegroundColor White
Write-Host "  cd $baseDir\apps\nurse" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Backend API:    http://localhost:4000" -ForegroundColor White
Write-Host "  Admin Portal:   http://localhost:3000" -ForegroundColor White
Write-Host "  Doctor Portal:  http://localhost:3001" -ForegroundColor White
Write-Host "  Patient App:    http://localhost:3002" -ForegroundColor White
Write-Host "  Nurse App:      http://localhost:3003" -ForegroundColor White
Write-Host ""
Write-Host "Platform is ready to run!" -ForegroundColor Green

