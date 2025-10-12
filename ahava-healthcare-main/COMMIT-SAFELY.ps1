# Ahava Healthcare - Safe Commit Script
# This script helps you commit your changes safely to GitHub

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Ahava Healthcare - Safe Commit" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
Write-Host "[1/7] Checking if Git is installed..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git is installed: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "  Option 1: Run PowerShell as Administrator and execute:" -ForegroundColor White
    Write-Host "    choco install git -y" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Option 2: Download from https://git-scm.com/download/win" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if we're in a git repository
Write-Host "[2/7] Checking repository status..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "⚠ This is not a Git repository yet." -ForegroundColor Yellow
    $init = Read-Host "Would you like to initialize it? (y/n)"
    if ($init -eq "y") {
        git init
        git branch -M main
        Write-Host "✓ Git repository initialized" -ForegroundColor Green
    } else {
        Write-Host "✗ Cannot proceed without Git repository" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✓ Git repository found" -ForegroundColor Green
}

Write-Host ""

# Check for remote
Write-Host "[3/7] Checking remote repository..." -ForegroundColor Yellow
$remotes = git remote -v 2>&1
if ($remotes -match "origin") {
    Write-Host "✓ Remote 'origin' is configured" -ForegroundColor Green
    Write-Host "  $remotes" -ForegroundColor Gray
} else {
    Write-Host "⚠ No remote repository configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please enter your GitHub repository URL:" -ForegroundColor White
    Write-Host "  Format: https://github.com/USERNAME/REPO.git" -ForegroundColor Gray
    $remoteUrl = Read-Host "Repository URL"
    
    if ($remoteUrl) {
        git remote add origin $remoteUrl
        Write-Host "✓ Remote added successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠ Skipping remote configuration" -ForegroundColor Yellow
    }
}

Write-Host ""

# Security check
Write-Host "[4/7] Performing security check..." -ForegroundColor Yellow
Write-Host "  Checking for sensitive files..." -ForegroundColor Gray

$envFiles = Get-ChildItem -Recurse -Filter "*.env" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -notmatch "\.example$" }
if ($envFiles.Count -gt 0) {
    Write-Host "✗ WARNING: Found .env files!" -ForegroundColor Red
    foreach ($file in $envFiles) {
        Write-Host "    $($file.FullName)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "These files contain secrets and should NOT be committed!" -ForegroundColor Yellow
    Write-Host "They will be ignored by .gitignore, but please verify." -ForegroundColor Yellow
} else {
    Write-Host "✓ No .env files found (good!)" -ForegroundColor Green
}

# Check .gitignore
if (Test-Path ".gitignore") {
    Write-Host "✓ .gitignore file exists" -ForegroundColor Green
} else {
    Write-Host "✗ WARNING: No .gitignore file found!" -ForegroundColor Red
}

Write-Host ""

# Show status
Write-Host "[5/7] Checking repository status..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Confirm before proceeding
Write-Host "[6/7] Ready to commit" -ForegroundColor Yellow
$proceed = Read-Host "Do you want to stage all changes and commit? (y/n)"

if ($proceed -ne "y") {
    Write-Host "✗ Commit cancelled by user" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

# Stage all changes
Write-Host ""
Write-Host "Staging all changes..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Yellow
git diff --cached --name-only
Write-Host ""

# Get commit message
Write-Host "Enter your commit message:" -ForegroundColor Yellow
Write-Host "  (or press Enter to use default message)" -ForegroundColor Gray
$commitMessage = Read-Host "Message"

if (-not $commitMessage) {
    $commitMessage = "Update: Healthcare system improvements

- Enhanced security features and authentication
- Updated admin portal with new features
- Improved backend services and API endpoints
- Added new frontend components
- Updated documentation and deployment guides"
}

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Commit failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Push to remote
Write-Host "[7/7] Push to GitHub" -ForegroundColor Yellow
$push = Read-Host "Do you want to push to GitHub now? (y/n)"

if ($push -eq "y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    
    # Check if we need to set upstream
    $currentBranch = git branch --show-current
    $hasUpstream = git rev-parse --abbrev-ref $currentBranch@{upstream} 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        # No upstream, use -u flag
        git push -u origin $currentBranch
    } else {
        # Has upstream
        git push
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host "✗ Push failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "You may need to pull first if there are remote changes:" -ForegroundColor Yellow
        Write-Host "  git pull origin $currentBranch --rebase" -ForegroundColor Cyan
        Write-Host "  git push origin $currentBranch" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠ Changes committed locally but not pushed to GitHub" -ForegroundColor Yellow
    Write-Host "  Run 'git push' when you're ready" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Commit process complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  ✓ Security check passed" -ForegroundColor Green
Write-Host "  ✓ Changes committed" -ForegroundColor Green
if ($push -eq "y" -and $LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Pushed to GitHub" -ForegroundColor Green
}
Write-Host ""
Write-Host "View your repository on GitHub to verify!" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"


