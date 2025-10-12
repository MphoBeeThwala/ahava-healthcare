# Git Commit Guide - Ahava Healthcare

## ✅ Security Verification Complete

Your project has been verified and is **SAFE TO COMMIT**:

- ✅ `.gitignore` properly configured
- ✅ All `.env` files excluded
- ✅ Only `.env.example` files (with placeholder values) will be committed
- ✅ `node_modules/` excluded
- ✅ Build outputs excluded
- ✅ No sensitive data detected

## 📝 Step-by-Step Commit Process

### Step 1: Install Git (if not already installed)

Open PowerShell **as Administrator** and run:

```powershell
choco install git -y
```

After installation, **close and reopen your terminal**, then verify:

```powershell
git --version
```

### Step 2: Configure Git (First Time Only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 3: Navigate to Project Directory

```powershell
cd "C:\Users\User\OneDrive\Documentos\Projects\ahava-healthcare-main\ahava-healthcare-main"
```

### Step 4: Initialize Git Repository (if not already initialized)

```powershell
git init
```

### Step 5: Add Remote Repository (if not already added)

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub details:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

Or if using SSH:

```powershell
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

Check if remote exists:

```powershell
git remote -v
```

### Step 6: Stage All Changes

```powershell
# Stage all changes
git add .

# Review what will be committed
git status
```

### Step 7: Verify No Secrets Are Staged

```powershell
# Check that no .env files are staged (should show nothing)
git status | Select-String ".env$"

# List all files that will be committed
git diff --cached --name-only
```

### Step 8: Commit Changes

```powershell
git commit -m "Update: Healthcare system improvements

- Enhanced security features
- Updated admin portal
- Improved backend services
- Added new frontend features
- Updated documentation"
```

### Step 9: Push to GitHub

For first push:

```powershell
git branch -M main
git push -u origin main
```

For subsequent pushes:

```powershell
git push
```

## 🔐 Security Best Practices

### Files That Are Protected (in .gitignore):

- `*.env` - All environment variable files
- `.env.local`, `.env.development.local`, etc.
- `node_modules/` - Dependencies
- `dist/`, `build/`, `.next/` - Build outputs
- `*.db`, `*.sqlite*` - Database files
- `uploads/`, `exports/` - User data
- `dump.rdb` - Redis dumps

### Files That Will Be Committed:

- `*.env.example` - Template files with NO actual secrets
- Source code (`*.ts`, `*.tsx`, `*.js`, etc.)
- Configuration files (`*.json`, `*.config.*`)
- Documentation (`*.md`)
- Docker and deployment configs

## 🚨 Emergency: If You Accidentally Committed Secrets

If you accidentally committed a file with secrets:

```powershell
# Remove file from git but keep local copy
git rm --cached path/to/secret/file

# Commit the removal
git commit -m "Remove sensitive file"

# Force push (⚠️ use with caution)
git push --force
```

**Then:**
1. Immediately rotate/change all exposed secrets (API keys, passwords, etc.)
2. Update your `.gitignore` to prevent future commits
3. Consider using tools like `git-secrets` or `truffleHog` to scan history

## 📞 Need Help?

If you encounter issues:

1. **Check Git Status**: `git status`
2. **View Recent Commits**: `git log --oneline -5`
3. **View Remotes**: `git remote -v`
4. **Check Branch**: `git branch`

## 🎯 Quick Reference

```powershell
# View changes
git status
git diff

# Stage changes
git add .
git add path/to/specific/file

# Commit
git commit -m "Your message"

# Push
git push

# Pull latest changes
git pull

# View commit history
git log --oneline
```

---

**Generated on**: 2025-10-11
**Project**: Ahava Healthcare
**Status**: ✅ Ready to commit safely


