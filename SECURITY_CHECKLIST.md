# Security Checklist - Before Pushing to GitHub

## ✅ Pre-Push Security Check

Before pushing this repository to GitHub, verify:

### 1. No Hardcoded Secrets
- [x] No API keys in code files
- [x] No Supabase project URLs with actual project IDs
- [x] No service role keys
- [x] No anon keys
- [x] Seed data files use placeholders

### 2. Environment Files Ignored
- [x] `.env` files are in `.gitignore`
- [x] `.env.local` files are in `.gitignore`
- [x] All `.env.*` patterns are ignored

### 3. Sensitive Files Ignored
- [x] `node_modules/` is ignored
- [x] `.next/` build folder is ignored
- [x] Supabase local files are ignored
- [x] Lock files (if not committing)

### 4. Code Review
- [x] All secrets use environment variables
- [x] No credentials in comments
- [x] No passwords in code (except example/test passwords in docs)

## Files to Review

### Safe to Commit ✅
- `README.md` - Uses placeholders
- `backend/schema.sql` - No secrets
- `backend/rls_policies.sql` - No secrets
- `backend/seed_data_ready.sql` - Uses placeholders (updated)
- All `.ts`, `.tsx` files - Use environment variables

### Already Ignored ✅
- `.env*` files
- `node_modules/`
- `.next/`
- `.supabase/`

## What Users Need to Do

1. Create their own Supabase project
2. Get their own API keys from Supabase Dashboard
3. Create `.env.local` file with their keys
4. Update `backend/seed_data_ready.sql` with their user IDs

## Quick Verification Command

Before pushing, run:
```bash
# Check for any remaining secrets (should return nothing)
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" . --exclude-dir=node_modules --exclude="*.lock"
grep -r "fvcnbmwywqliynbdgofn" . --exclude-dir=node_modules
grep -r "4936138b-1a99-41ab-a7fb-997b13bd855d" . --exclude-dir=node_modules
```

All checks should return empty (no matches).

