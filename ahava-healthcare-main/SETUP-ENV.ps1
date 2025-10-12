# Setup Environment Variables for All Apps

Write-Host "🔧 Setting up environment variables..." -ForegroundColor Cyan

$baseDir = "C:\Users\User\Downloads\ahava-healthcare-main\ahava-healthcare-main"

# Frontend apps env content
$frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:4000
NODE_ENV=development
"@

# Create .env.local for Admin
Write-Host "Creating .env.local for Admin Portal..." -ForegroundColor Yellow
$frontendEnv | Out-File -FilePath "$baseDir\apps\admin\.env.local" -Encoding UTF8

# Create .env.local for Doctor
Write-Host "Creating .env.local for Doctor Portal..." -ForegroundColor Yellow
$frontendEnv | Out-File -FilePath "$baseDir\apps\doctor\.env.local" -Encoding UTF8

# Create .env.local for Patient
Write-Host "Creating .env.local for Patient App..." -ForegroundColor Yellow
$frontendEnv | Out-File -FilePath "$baseDir\apps\patient\.env.local" -Encoding UTF8

# Create .env.local for Nurse
Write-Host "Creating .env.local for Nurse App..." -ForegroundColor Yellow
$frontendEnv | Out-File -FilePath "$baseDir\apps\nurse\.env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Environment files created!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Backend .env file" -ForegroundColor Yellow
Write-Host "Copy apps\backend\env.example to apps\backend\.env" -ForegroundColor Yellow
Write-Host "Then update it with secure keys (see INSTALLATION-GUIDE.md)" -ForegroundColor Yellow
Write-Host ""

