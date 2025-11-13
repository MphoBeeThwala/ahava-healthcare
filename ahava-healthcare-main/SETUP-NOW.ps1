# Ahava Healthcare - Quick Setup Script
# Guides database configuration and optionally starts local services

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Ahava Healthcare - Database Setup Helper" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host

 = Join-Path C:\Users\User\AppData\Local\Temp "apps\backend"
 = Join-Path  ".env"

if (-not (Test-Path )) {
    Write-Host "Creating backend .env file from template..." -ForegroundColor Yellow
    Copy-Item (Join-Path  "env.example") 
    Write-Host "Backend .env file created." -ForegroundColor Green
    Write-Host
}

Write-Host "Database prerequisites" -ForegroundColor Yellow
Write-Host "Ensure you have:" -ForegroundColor White
Write-Host "  • Supabase PostgreSQL connection string" -ForegroundColor White
Write-Host "  • Upstash Redis URL" -ForegroundColor White
Write-Host

 = Read-Host "Have you already created Supabase and Upstash connections? (Y/N)"

if ( -notin @("Y", "y")) {
    Write-Host
    Write-Host "Setup steps:" -ForegroundColor Cyan
    Write-Host "  1. Create a project at https://supabase.com and copy the PostgreSQL connection string." -ForegroundColor White
    Write-Host "  2. Create a Redis database at https://console.upstash.com and copy the Redis URL." -ForegroundColor White
    Write-Host "  3. Follow SETUP-DATABASES-NOW.md for a detailed walkthrough." -ForegroundColor Yellow
    Write-Host
    Pause
    Exit
}

Write-Host
Write-Host "Configuring database connections" -ForegroundColor Yellow
Write-Host

 = Get-Content  -Raw
 =  -match "DATABASE_URL=.*postgresql://"

if (-not  -or  -match "DATABASE_URL=.*localhost") {
    Write-Host "Update DATABASE_URL in " -ForegroundColor Yellow
     = Read-Host "Enter your Supabase PostgreSQL URL (or press Enter to skip)"
    if () {
         = (Get-Content  -Raw) -replace "DATABASE_URL=.*", "DATABASE_URL="""
        Set-Content -Path  -Value 
        Write-Host "DATABASE_URL updated." -ForegroundColor Green
    }
} else {
    Write-Host "DATABASE_URL already configured." -ForegroundColor Green
}

 = Get-Content  -Raw
 =  -match "REDIS_URL=.*redis://"

if (-not  -or  -match "REDIS_URL=.*localhost") {
    Write-Host "Update REDIS_URL in " -ForegroundColor Yellow
     = Read-Host "Enter your Upstash Redis URL (or press Enter to skip)"
    if () {
         = (Get-Content  -Raw) -replace "REDIS_URL=.*", "REDIS_URL="""
        Set-Content -Path  -Value 
        Write-Host "REDIS_URL updated." -ForegroundColor Green
    }
} else {
    Write-Host "REDIS_URL already configured." -ForegroundColor Green
}

Write-Host
Write-Host "Running Prisma migrations" -ForegroundColor Yellow
Write-Host

Set-Location 

Write-Host "Generating Prisma client..." -ForegroundColor Cyan
try {
    npx prisma generate
    Write-Host "Prisma client generated." -ForegroundColor Green
} catch {
    Write-Host "Failed to generate Prisma client." -ForegroundColor Red
    Write-Host .Exception.Message -ForegroundColor Red
    Pause
    Exit
}

Write-Host
Write-Host "Applying database migrations..." -ForegroundColor Cyan
try {
    npx prisma migrate deploy
    Write-Host "Migrations applied." -ForegroundColor Green
} catch {
    Write-Host "Failed to apply migrations." -ForegroundColor Red
    Write-Host .Exception.Message -ForegroundColor Red
    Write-Host "Check DATABASE_URL in the .env file." -ForegroundColor Yellow
    Pause
    Exit
}

Write-Host
Write-Host "Seeding database with test users..." -ForegroundColor Cyan
try {
    npm run prisma:seed
    Write-Host "Database seeded successfully." -ForegroundColor Green
} catch {
    Write-Host "Failed to seed database." -ForegroundColor Red
    Write-Host .Exception.Message -ForegroundColor Red
}

Write-Host
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Database setup complete" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host

Write-Host "Test users:" -ForegroundColor Yellow
Write-Host "  Admin:   admin@ahava.com" -ForegroundColor White
Write-Host "  Doctor:  doctor@ahava.com" -ForegroundColor White
Write-Host "  Nurse:   nurse@ahava.com" -ForegroundColor White
Write-Host "  Patient: patient@ahava.com" -ForegroundColor White
Write-Host "  Password: Test@123456789" -ForegroundColor Gray
Write-Host

 = Read-Host "Start all services now? (Y/N)"

if ( -in @("Y", "y")) {
    Write-Host
    Write-Host "Starting services..." -ForegroundColor Cyan
    Write-Host
    Set-Location C:\Users\User\AppData\Local\Temp
    if (Test-Path "START-DEVELOPMENT.ps1") {
        Write-Host "Running START-DEVELOPMENT.ps1" -ForegroundColor Cyan
        .\START-DEVELOPMENT.ps1
    } else {
        Write-Host "START-DEVELOPMENT.ps1 not found. Start each service manually:" -ForegroundColor Yellow
        Write-Host "  Backend API:      cd apps\backend && npm run dev" -ForegroundColor Gray
        Write-Host "  Workers:          cd apps\backend && npm run dev:worker" -ForegroundColor Gray
        Write-Host "  Admin Portal:     cd apps\admin && npm run dev" -ForegroundColor Gray
        Write-Host "  Doctor Portal:    cd apps\doctor && npm run dev" -ForegroundColor Gray
        Write-Host "  Patient App:      cd apps\patient && npm run dev" -ForegroundColor Gray
        Write-Host "  Nurse App:        cd apps\nurse && npm run dev" -ForegroundColor Gray
    }
} else {
    Write-Host
    Write-Host "Manual startup commands:" -ForegroundColor Yellow
    Write-Host "  .\START-DEVELOPMENT.ps1" -ForegroundColor White
    Write-Host "Or run each service individually as listed above." -ForegroundColor White
}

Write-Host
Write-Host "Service endpoints:" -ForegroundColor Cyan
Write-Host "  Backend API:  http://localhost:4000/health" -ForegroundColor White
Write-Host "  Admin:        http://localhost:3000" -ForegroundColor White
Write-Host "  Doctor:       http://localhost:3001" -ForegroundColor White
Write-Host "  Patient:      http://localhost:3002" -ForegroundColor White
Write-Host "  Nurse:        http://localhost:3003" -ForegroundColor White
Write-Host

Pause
