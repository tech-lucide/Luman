# Quick Start Guide for Vercel Deployment

## ✅ What's Been Optimized

Your Novel app is now fully optimized for Vercel deployment with the following improvements:

### 1. **Build Configuration**
- ✅ Optimized `next.config.js` for production
- ✅ Disabled source maps in production for better performance
- ✅ Added image optimization for Vercel Blob and Supabase
- ✅ Configured console.log removal in production (keeping errors/warnings)
- ✅ Server actions configured with proper body size limits

### 2. **Environment Variables**
- ✅ Updated `.env.example` with all required variables
- ✅ Fixed Supabase client with proper error handling
- ✅ Renamed `client.js` to `client.ts` for better type safety

### 3. **Deployment Files**
- ✅ Created comprehensive `DEPLOY.md` guide
- ✅ Added `.vercelignore` to reduce deployment size
- ✅ Created root `vercel.json` for monorepo support

### 4. **Build Verification**
- ✅ Successful production build (no errors)
- ✅ TypeScript type checking passed
- ✅ All linting passed

## 🚀 Deploy Now (3 Steps)

### Step 1: Set up Supabase
1. Create account at https://supabase.com
2. Create a new project
3. Copy your URL and anon key from Settings → API
4. Run the SQL from `DEPLOY.md` to create required tables

### Step 2: Get API Keys
1. Get OpenRouter key: https://openrouter.ai/keys (REQUIRED for chat)
2. Get OpenAI key: https://platform.openai.com/account/api-keys (OPTIONAL)

### Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your Git repository
3. Set **Root Directory** to `apps/web` (important for monorepo!)
4. Add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_value
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   OPENROUTER_API_KEY=your_value
   ```
5. Click **Deploy**

## 📋 Required Environment Variables

Copy these to your Vercel project settings:

```env
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter (Chat API)
OPENROUTER_API_KEY=your_openrouter_api_key
```

## 🔧 Optional Environment Variables

```env
# OpenAI (for generate feature)
OPENAI_API_KEY=your_openai_api_key

# Vercel Blob (image uploads)
BLOB_READ_WRITE_TOKEN=auto_set_by_vercel

# Vercel KV (rate limiting)
KV_REST_API_URL=auto_set_by_vercel
KV_REST_API_TOKEN=auto_set_by_vercel
```

## 📄 Important Files

- **`apps/web/DEPLOY.md`** - Detailed deployment guide with SQL schemas
- **`apps/web/.env.example`** - Environment variable template
- **`apps/web/next.config.js`** - Optimized Next.js configuration
- **`vercel.json`** - Root monorepo configuration
- **`apps/web/vercel.json`** - App-specific configuration

## 🎯 Monorepo Notes

This is a monorepo using:
- **Turborepo** for build orchestration
- **pnpm** for package management
- **Workspace structure**: `apps/web` contains the Next.js app

When deploying to Vercel:
1. Point to the **root** of the repository
2. Set **Root Directory** to `apps/web`
3. Vercel will automatically detect the monorepo structure

## ✨ What Happens on Deploy

1. Vercel installs dependencies with `pnpm install`
2. Builds the novel package first
3. Builds the web app with optimizations enabled
4. Deploys to global edge network
5. Your app is live! 🎉

## 🐛 Troubleshooting

**Build fails?**
- Check that Root Directory is set to `apps/web`
- Verify all required env vars are set
- Check build logs for specific errors

**Runtime errors?**
- Verify Supabase credentials
- Check that database tables are created
- Confirm API keys are valid

**Need help?**
See the detailed `DEPLOY.md` for comprehensive troubleshooting.

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [OpenRouter Dashboard](https://openrouter.ai/activity)
- [Next.js Docs](https://nextjs.org/docs)

---

**Ready to deploy?** Follow the 3 steps above and you'll be live in minutes! 🚀
