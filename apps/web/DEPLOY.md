# Deploying to Vercel

This guide will help you deploy the Novel Next.js app to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Supabase account](https://supabase.com) (required for database)
3. An [OpenRouter API key](https://openrouter.ai/keys) (required for chat functionality)
4. Optional: [OpenAI API key](https://platform.openai.com/account/api-keys) (for generate feature)

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/yourrepo)

## Manual Deployment Steps

### 1. Set Up Supabase Database

1. Create a new Supabase project at https://supabase.com/dashboard
2. Go to **Settings** → **API**
3. Copy your:
   - **Project URL** (for `NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon/Public key** (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

4. Create the required tables by running this SQL in the Supabase SQL Editor:

```sql
-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_note_id ON chat_messages(note_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
```

### 2. Get API Keys

#### Required: OpenRouter (for Chat)
1. Go to https://openrouter.ai/keys
2. Create a new API key
3. Copy the key (for `OPENROUTER_API_KEY`)

#### Optional: OpenAI (for Generate Feature)
1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy the key (for `OPENAI_API_KEY`)

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to the web app directory
cd apps/web

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `.next`

4. Add environment variables (see below)

### 4. Configure Environment Variables

Add these environment variables in your Vercel project settings:

#### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

#### Optional Variables

```env
# OpenAI API (for generate feature)
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Site URL (automatically set by Vercel, but can override)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Vercel KV (for rate limiting)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

### 5. Set Up Optional Vercel Services

#### Vercel Blob (Image Uploads)
1. Go to your Vercel project → **Storage** → **Create Database**
2. Select **Blob**
3. The environment variable `BLOB_READ_WRITE_TOKEN` will be automatically added

#### Vercel KV (Rate Limiting)
1. Go to your Vercel project → **Storage** → **Create Database**
2. Select **KV**
3. The environment variables `KV_REST_API_URL` and `KV_REST_API_TOKEN` will be automatically added

### 6. Deploy

Once environment variables are configured, click **Deploy**. Your app will be live at `https://your-project.vercel.app`.

## Monorepo Configuration

This project uses a monorepo structure with Turborepo. The web app is located in `apps/web`.

### Important Files for Vercel

- **`vercel.json`**: Vercel configuration
- **`next.config.js`**: Next.js configuration
- **`package.json`**: Dependencies and scripts
- **`.env.example`**: Template for environment variables

### Build Configuration

Vercel will automatically detect the monorepo structure. Make sure:
- Root Directory is set to `apps/web`
- Build command uses `pnpm` if you're using pnpm workspace

## Troubleshooting

### Build Failures

1. **Missing environment variables**: Ensure all required env vars are set in Vercel dashboard
2. **TypeScript errors**: Run `pnpm typecheck` locally to catch issues before deploying
3. **Dependency issues**: Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

### Runtime Errors

1. **Supabase connection errors**: Verify your Supabase URL and anon key are correct
2. **API rate limits**: Consider setting up Vercel KV for rate limiting
3. **Image upload failures**: Set up Vercel Blob storage

### Common Issues

**Q: My environment variables aren't working**  
A: Make sure you've redeployed after adding environment variables. Vercel requires a redeploy for env var changes to take effect.

**Q: I'm getting CORS errors**  
A: Check that `NEXT_PUBLIC_SITE_URL` is set correctly and matches your deployment URL.

**Q: Chat feature isn't working**  
A: Verify your `OPENROUTER_API_KEY` is valid and has credits/quota available.

## Production Optimizations

The app is already optimized for production with:

- ✅ Server-side rendering (SSR) for dynamic pages
- ✅ Static generation for optimal performance
- ✅ Image optimization with Next.js Image component
- ✅ Code splitting and lazy loading
- ✅ Gzip compression
- ✅ Production source maps for debugging

## Monitoring

Once deployed, you can monitor your app using:

- **Vercel Analytics**: Automatically enabled for performance monitoring
- **Vercel Logs**: View runtime logs in the Vercel dashboard
- **Supabase Dashboard**: Monitor database queries and performance

## Support

For issues and questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Check the [Vercel documentation](https://vercel.com/docs)
- Check the [Supabase documentation](https://supabase.com/docs)
