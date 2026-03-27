# CI/CD Pipeline Configuration Guide

## ✅ Local Test Results

All CI/CD steps tested successfully locally:

```bash
✅ Lint Check         - PASSED
✅ Type Check         - PASSED
✅ Format Check       - PASSED
✅ Tests with Coverage - PASSED
✅ Build              - PASSED
```

## 🔧 Required GitHub Secrets

Add these secrets to your GitHub repository:

### Settings → Secrets and variables → Actions → New repository secret

1. **CODECOV_TOKEN** (Optional)
   - Get from: https://codecov.io/
   - Used for: Code coverage reporting

2. **NEXT_PUBLIC_HOST** (Optional)
   - Default: `http://localhost:3000`
   - Production: Your production URL

## 🚀 Vercel Deployment Setup

### Step 1: Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

**Required:**

```
NEXT_PUBLIC_HOST=https://your-domain.vercel.app
```

**Optional (if using):**

```
NEXT_PUBLIC_RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_RESEND_FROM_EMAIL=your@email.com
NEXT_PUBLIC_RESEND_TO_EMAIL=recipient@email.com
NEXT_PUBLIC_GA_ID=your_ga_id
NEXT_PUBLIC_REVALIDATE_SECRET=your_secret
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Step 2: Vercel Integration with GitHub

1. Go to Vercel Dashboard → Settings → Git
2. Connect your GitHub repository
3. Enable "Required Checks" from GitHub

### Step 3: GitHub Branch Protection (Optional but Recommended)

1. Go to GitHub → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - Select checks:
     - `Lint & Type Check`
     - `Run Tests`
     - `Build Application`

This will prevent deployment if CI/CD fails.

## 📝 Coverage Thresholds

Current settings (Realistic for early project):

- Lines: 10%
- Functions: 30%
- Branches: 50%
- Statements: 10%

Gradually increase as you add more tests.

## 🐛 Troubleshooting

### Issue: "Coverage threshold failed"

**Solution:** Lower thresholds in `vitest.config.ts` or add more tests

### Issue: "Build failed - environment variable missing"

**Solution:** Add required variables to Vercel environment settings

### Issue: "Tests fail in CI but pass locally"

**Solution:** Check NODE_ENV and ensure all dependencies in package.json

### Issue: "Vercel deploys even when CI fails"

**Solution:** Enable GitHub Branch Protection Rules
