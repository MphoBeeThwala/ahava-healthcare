# GitHub Actions CI/CD Workflows

This directory contains automated workflows for continuous integration and deployment.

## 📋 Available Workflows

### 1. **Test Suite** (`test.yml`)
**Triggers:** Every push and pull request to `master`, `main`, or `develop` branches

**What it does:**
- ✅ Runs all 179 backend tests
- ✅ Checks TypeScript compilation
- ✅ Runs linting (if configured)
- ✅ Generates code coverage reports
- ✅ Uploads coverage to Codecov (if configured)

**Services:**
- PostgreSQL 15 (test database)
- Redis 7 (cache/queue)

**Test Breakdown:**
- Utility tests: 26
- API mock tests: 127
- Integration tests: 26

**Expected Results:**
- ✅ 179 tests passing
- ✅ 27.9% code coverage
- ✅ All TypeScript checks passing

### 2. **Deploy** (`deploy.yml`)
**Triggers:** Push to `main` branch

**What it does:**
- 🐳 Builds Docker images for API and Worker
- 📦 Pushes images to GitHub Container Registry
- 🚀 Deploys to Railway (primary)
- 🌐 Deploys to Render (alternative)
- ✈️ Deploys to Fly.io (alternative)

## 🔧 Setup Instructions

### For Testing (Automatic - No Setup Needed)
The test workflow runs automatically on every push/PR. No secrets required!

### For Code Coverage (Optional)
1. Create account at [Codecov.io](https://codecov.io)
2. Add repository to Codecov
3. Get upload token
4. Add `CODECOV_TOKEN` secret to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov upload token

### For Deployment (Optional)
Add these secrets for automatic deployment:

**Railway (Primary):**
1. Get token from https://railway.app/account/tokens
2. Add `RAILWAY_TOKEN` secret

**Render (Alternative):**
1. Get API key from Render dashboard
2. Add `RENDER_API_KEY` secret

**Fly.io (Alternative):**
1. Get token: `flyctl auth token`
2. Add `FLY_API_TOKEN` secret

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/ahava-healthcare/actions/workflows/test.yml/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/ahava-healthcare/actions/workflows/deploy.yml/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/ahava-healthcare/branch/master/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/ahava-healthcare)
```

## 🚀 How to Use

### Run Tests Locally (Before Pushing)
```bash
cd apps/backend
yarn test
```

### Push Code
```bash
git add .
git commit -m "feat: your changes"
git push origin master
```

### Monitor Workflow
1. Go to repository → Actions tab
2. Click on latest workflow run
3. View logs and results

### Debugging Failed Tests
1. Check workflow logs in Actions tab
2. Run tests locally: `cd apps/backend && yarn test`
3. Fix issues and push again

## 📈 Coverage Goals

Current: **27.9%** (179 tests)

Future targets:
- 🎯 **40%** - Add webhook & worker tests (250+ tests)
- 🎯 **50%** - Add service integration tests (300+ tests)
- 🎯 **60%** - Add frontend component tests (400+ tests)
- 🎯 **80%** - Comprehensive E2E tests (500+ tests)

## 🔍 Workflow Details

### Test Workflow (`test.yml`)

**Jobs:**
1. **test-backend**
   - Sets up PostgreSQL & Redis services
   - Installs dependencies with Yarn
   - Generates Prisma client
   - Runs database migrations
   - Executes test suite
   - Uploads coverage reports

2. **lint-backend**
   - TypeScript compilation check
   - ESLint validation (if configured)

3. **test-results-summary**
   - Generates summary of all checks
   - Shows pass/fail status

**Environment Variables:**
- `NODE_ENV=test`
- `DATABASE_URL` - Test database connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Test JWT secret
- `ENCRYPTION_KEY` - Test encryption key
- `RATE_LIMIT_SKIP=true` - Disable rate limiting

**Performance:**
- ⚡ Average run time: ~3-5 minutes
- 🐳 Uses Docker services for DB/Redis
- 📦 Caches Yarn dependencies

## 🛡️ Security

- ✅ Secrets are never exposed in logs
- ✅ Test database is isolated
- ✅ Environment variables are scoped per job
- ✅ Dependencies are locked with Yarn
- ✅ Docker images are scanned (planned)

## 🆘 Troubleshooting

### Tests Failing in CI but Pass Locally
- Check PostgreSQL version (CI uses 15)
- Check Redis version (CI uses 7)
- Verify environment variables in `test.yml`
- Check for race conditions in tests

### Coverage Upload Failing
- Verify `CODECOV_TOKEN` is set correctly
- Check coverage files are being generated
- Review Codecov integration logs

### Deployment Failing
- Check deployment provider tokens
- Verify Docker images are building
- Review deployment logs in workflow

## 📝 Contributing

When adding new tests:
1. Add tests to `apps/backend/src/__tests__/`
2. Run locally: `yarn test`
3. Verify coverage: `yarn test --coverage`
4. Push to trigger CI workflow
5. Check Actions tab for results

## 🎓 Learn More

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [Codecov Documentation](https://docs.codecov.com/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Status:** ✅ Active  
**Last Updated:** October 2024  
**Maintained By:** Development Team

