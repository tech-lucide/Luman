# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment Checklist

### ✅ Required Setup
- [ ] **Supabase Account Created**
  - Create at: https://supabase.com
  - Project created
  - URL and anon key copied
  
- [ ] **Database Tables Created**
  - SQL schema from `DEPLOY.md` executed
  - Tables: `notes` and `chat_messages` exist
  - Indexes created for performance

- [ ] **OpenRouter API Key Obtained**
  - Create at: https://openrouter.ai/keys
  - Key copied and ready
  - (Required for chat functionality)

### 📋 Optional Setup
- [ ] **OpenAI API Key** (for generate feature)
  - Create at: https://platform.openai.com/account/api-keys
  
- [ ] **Vercel Blob Storage** (for image uploads)
  - Will auto-configure in Vercel
  
- [ ] **Vercel KV** (for rate limiting)
  - Will auto-configure in Vercel

## Deployment Steps

### Step 1: Prepare Repository
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub/GitLab/Bitbucket
- [ ] `.env.local` is NOT committed (should be in `.gitignore`)

### Step 2: Vercel Configuration
- [ ] Go to https://vercel.com/new
- [ ] Import Git repository
- [ ] **Configure Build Settings:**
  - [ ] Framework Preset: `Next.js` (auto-detected)
  - [ ] Root Directory: `apps/web` ⚠️ **IMPORTANT for monorepo!**
  - [ ] Build Command: `pnpm build` (or leave default)
  - [ ] Output Directory: `.next` (default)
  - [ ] Install Command: `pnpm install` (default)

### Step 3: Environment Variables
Add these in Vercel's environment variables section:

#### Required Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = _your_supabase_url_
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = _your_supabase_anon_key_
- [ ] `OPENROUTER_API_KEY` = _your_openrouter_key_

#### Optional Variables
- [ ] `OPENAI_API_KEY` = _your_openai_key_ (if using generate feature)
- [ ] `NEXT_PUBLIC_SITE_URL` = _your_vercel_url_ (auto-set, can override)
- [ ] `BLOB_READ_WRITE_TOKEN` (auto-set if using Vercel Blob)
- [ ] `KV_REST_API_URL` (auto-set if using Vercel KV)
- [ ] `KV_REST_API_TOKEN` (auto-set if using Vercel KV)

### Step 4: Deploy
- [ ] Click "Deploy" button
- [ ] Wait for build to complete (usually 2-5 minutes)
- [ ] Check build logs for any errors
- [ ] Deployment successful! 🎉

## Post-Deployment Validation

### Test Core Functionality
- [ ] **Homepage loads** - Visit your Vercel URL
- [ ] **Create a note** - Test editor functionality
- [ ] **Chat works** - Try the AI chat feature
- [ ] **Images upload** (if Blob configured)
- [ ] **No console errors** - Check browser DevTools

### Performance Check
- [ ] **Lighthouse Score**
  - Performance > 90
  - Accessibility > 90
  - SEO > 90
  
- [ ] **Vercel Analytics**
  - Check page load times
  - Monitor Core Web Vitals

### Security Check
- [ ] **Environment Variables Secure**
  - Not exposed in browser console
  - Not in source code
  
- [ ] **HTTPS Enabled** (automatic with Vercel)
- [ ] **Supabase RLS Policies** (if applicable)

## Common Issues & Solutions

### Build Failed
**Issue:** Build fails with "Module not found"
- [ ] Check that Root Directory = `apps/web`
- [ ] Verify pnpm workspace configuration
- [ ] Clear build cache in Vercel

**Issue:** TypeScript errors during build
- [ ] Run `pnpm typecheck` locally first
- [ ] Fix any type errors before deploying

### Runtime Errors
**Issue:** "Missing Supabase environment variables"
- [ ] Double-check env vars in Vercel dashboard
- [ ] Ensure you redeployed after adding env vars

**Issue:** Chat not working
- [ ] Verify `OPENROUTER_API_KEY` is set
- [ ] Check OpenRouter dashboard for API status
- [ ] Check Vercel function logs for errors

**Issue:** 500 Internal Server Error
- [ ] Check Vercel function logs
- [ ] Verify database connection
- [ ] Check API key validity

## Optimization Tips

### Performance
- [ ] Enable Vercel Analytics
- [ ] Set up Image Optimization domains
- [ ] Consider upgrading to Pro for better performance

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor Supabase query performance
- [ ] Track API usage for cost management

### SEO
- [ ] Add custom domain
- [ ] Configure meta tags
- [ ] Submit sitemap to Google

## Resources

- **Quick Start**: See `VERCEL_QUICKSTART.md`
- **Detailed Guide**: See `apps/web/DEPLOY.md`
- **Environment Template**: See `apps/web/.env.example`

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review Supabase logs
3. Check browser console for errors
4. Refer to `DEPLOY.md` for troubleshooting

---

## ✅ Deployment Complete Checklist

Once deployed, verify:
- [ ] App is accessible at Vercel URL
- [ ] All features working as expected
- [ ] No errors in Vercel logs
- [ ] No errors in browser console
- [ ] Performance is satisfactory
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic)

**Congratulations! Your app is now live on Vercel! 🚀**
