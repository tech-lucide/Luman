# Supabase OAuth Configuration for Production

## ✅ Code Implementation Status

Your OAuth implementation is **already production-ready**! All authentication flows use the dynamic redirect pattern:

```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

This automatically:
- Uses `http://localhost:3000` in development
- Uses `https://yourdomain.com` in production
- No code changes needed when deploying!

**Files verified:**
- ✅ `/app/login/page.tsx` - Line 51
- ✅ `/app/register/page.tsx` - Line 46
- ✅ `/app/debug-oauth/page.tsx` - Line 28

---

## 🔧 Supabase Dashboard Configuration

### Required Setup in Supabase

1. **Navigate to Authentication Settings**
   - Go to your Supabase project dashboard
   - Click **Authentication** → **URL Configuration**

2. **Configure Site URL**
   ```
   Site URL: https://yourdomain.com
   ```
   ⚠️ **Important:** Use your PRODUCTION domain only. This is the primary URL for OAuth redirects.

3. **Add Redirect URLs**
   Add BOTH of these URLs to the "Redirect URLs" section:
   ```
   https://yourdomain.com/**
   http://localhost:3000/**
   ```
   
   **Why both?**
   - `https://yourdomain.com/**` - Allows production users to authenticate
   - `http://localhost:3000/**` - Allows YOU to test authentication locally

4. **Enable Google OAuth Provider**
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Add your Google OAuth credentials:
     - Client ID (from Google Cloud Console)
     - Client Secret (from Google Cloud Console)

---

## 🌐 Google Cloud Console Configuration

Your Google OAuth app also needs matching redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project → **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these **Authorized redirect URIs**:
   ```
   https://<your-supabase-project-ref>.supabase.co/auth/v1/callback
   ```

---

## 🧪 Testing Guide

### Local Development
1. Start your dev server: `pnpm dev`
2. Visit: `http://localhost:3000/login`
3. Click "Sign in with Google"
4. **Expected:** Redirects to `http://localhost:3000/auth/callback` after auth

### Production
1. Deploy to production (Vercel/Netlify/etc.)
2. Visit: `https://yourdomain.com/login`
3. Click "Sign in with Google"
4. **Expected:** Redirects to `https://yourdomain.com/auth/callback` after auth

---

## 🚨 Common Issues & Fixes

### Issue: "redirect_uri_mismatch" error
**Cause:** Redirect URL not whitelisted in Supabase or Google Console

**Fix:**
1. Check Supabase → Authentication → URL Configuration
2. Ensure both `https://yourdomain.com/**` and `http://localhost:3000/**` are listed
3. Check Google Cloud Console redirect URIs match Supabase callback URL

### Issue: Auth works locally but fails in production
**Cause:** Production domain not added to Supabase redirect URLs

**Fix:**
1. Verify `https://yourdomain.com/**` is in Supabase redirect URLs
2. Verify environment variable `NEXT_PUBLIC_SITE_URL` is set correctly
3. Clear browser cache and cookies

### Issue: "Site URL not configured" error
**Cause:** Missing Site URL in Supabase

**Fix:**
1. Go to Supabase → Authentication → URL Configuration
2. Set Site URL to `https://yourdomain.com`
3. Save changes and redeploy

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] **Supabase Site URL** set to production domain
- [ ] **Supabase Redirect URLs** include both production (`https://yourdomain.com/**`) and localhost (`http://localhost:3000/**`)
- [ ] **Google OAuth** credentials configured in Supabase
- [ ] **Google Cloud Console** has correct Supabase callback URL
- [ ] **NEXT_PUBLIC_SUPABASE_URL** environment variable set
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** environment variable set
- [ ] **OPENROUTER_API_KEY** environment variable set (for AI features)
- [ ] Test auth flow in production after deployment

---

## 🎯 Environment Variables

Ensure these are set in your deployment platform (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Optional, for email redirects
```

---

## ✨ Benefits of This Setup

✅ **Zero Code Changes** - Same code works in dev and production  
✅ **Secure** - Each environment redirects to its own URL  
✅ **Flexible** - Easy to test locally while production runs  
✅ **Best Practice** - Industry-standard OAuth implementation  

Your authentication is production-ready! 🚀
