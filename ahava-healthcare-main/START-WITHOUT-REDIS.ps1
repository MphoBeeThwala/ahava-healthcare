# Quick Start Script - Run Backend Without Redis
# This script starts the backend with Redis errors suppressed

Write-Host "🚀 Starting Ahava Healthcare Backend (No Redis Required)" -ForegroundColor Green
Write-Host ""

cd apps\backend

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  No .env file found. Creating from env.example..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ Created .env file. Please update with your database credentials." -ForegroundColor Green
    Write-Host ""
    Write-Host "Press any key to open .env file for editing..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    notepad .env
    Write-Host ""
    Write-Host "After saving .env, press any key to start the backend..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "Starting backend server..." -ForegroundColor Cyan
npm run dev

