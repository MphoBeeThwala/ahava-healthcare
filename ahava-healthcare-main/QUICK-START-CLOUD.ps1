# Quick Start Script for Cloud Database Setup
# This script helps you get started with cloud databases

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AHAVA HEALTHCARE - CLOUD SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up cloud databases (FREE)" -ForegroundColor Yellow
Write-Host ""

# Check if .env exists
$envPath = "apps\backend\.env"
if (Test-Path $envPath) {
    Write-Host "✓ Backend .env file found" -ForegroundColor Green
} else {
    Write-Host "✗ Backend .env file not found" -ForegroundColor Red
    Write-Host "  Creating from template..." -ForegroundColor Yellow
    Copy-Item "apps\backend\env.example" $envPath
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set up FREE cloud databases:" -ForegroundColor Yellow
Write-Host "   - PostgreSQL: https://supabase.com (500MB free)" -ForegroundColor White
Write-Host "   - Redis: https://upstash.com (10K commands/day free)" -ForegroundColor White
Write-Host ""
Write-Host "2. Get your connection strings from the dashboards" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Update apps\backend\.env with your connection strings:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL='your_postgres_url'" -ForegroundColor White
Write-Host "   REDIS_URL='your_redis_url'" -ForegroundColor White
Write-Host ""
Write-Host "4. Run database migrations:" -ForegroundColor Yellow
Write-Host "   cd apps\backend" -ForegroundColor White
Write-Host "   npx prisma generate" -ForegroundColor White
Write-Host "   npx prisma migrate deploy" -ForegroundColor White
Write-Host ""
Write-Host "5. Start the backend:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "6. Start frontend apps (in separate terminals):" -ForegroundColor Yellow
Write-Host "   cd apps\admin && npm run dev" -ForegroundColor White
Write-Host "   cd apps\doctor && npm run dev" -ForegroundColor White
Write-Host "   cd apps\patient && npm run dev" -ForegroundColor White
Write-Host "   cd apps\nurse && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "For detailed instructions, see: SETUP-CLOUD-DB.md" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Open the guide in default browser
Write-Host "Opening cloud setup guide..." -ForegroundColor Yellow
Start-Process "SETUP-CLOUD-DB.md"


