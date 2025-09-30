# Railway Deployment Guide - Critical Designer Alphabet

This guide will help you deploy both services separately on Railway.

## 🏗️ Architecture Overview

- **Service 1**: SvelteKit Frontend (`designeralphabet/`)
- **Service 2**: Sanity CMS (`content/`)

## 📋 Prerequisites

1. Railway account ([railway.app](https://railway.app))
2. GitHub repository pushed with latest changes
3. Railway CLI installed (optional but recommended)

## 🚀 Deployment Steps

### Service 1: SvelteKit Frontend

1. **Create New Railway Project**
   - Go to [railway.app/new](https://railway.app/new)
   - Click "Deploy from GitHub repo"
   - Select your `Critical-Designer-Alphabet` repository

2. **Configure Root Path**
   - Railway will automatically detect the `railway.toml` in the root
   - This configures the SvelteKit service from `designeralphabet/`

3. **Set Environment Variables**
   Railway will read these from the `railway.toml`, but verify they're set:
   ```
   VITE_SANITY_PROJECT_ID=pctfp1xq
   VITE_SANITY_DATASET=production
   VITE_SANITY_API_VERSION=2024-09-01
   OPENAI_API_KEY=your-actual-openai-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   VITE_SUPABASE_URL=https://egdqbsalufeppxbopsfu.supabase.co
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE=your-supabase-service-role-key
   ```

4. **Deploy**
   - Railway will build: `cd designeralphabet && npm ci && npm run build`
   - Railway will start: `cd designeralphabet && PORT=${PORT:-4173} npm run preview -- --host 0.0.0.0 --port $PORT`

### Service 2: Sanity CMS

1. **Create Second Railway Service**
   - In Railway dashboard, click "New Service"
   - Select "GitHub Repo"
   - Choose the same `Critical-Designer-Alphabet` repository

2. **Configure Root Path for Sanity**
   - Go to Settings → General
   - Set **Root Directory** to: `content`
   - This tells Railway to use `content/railway.toml`

3. **Environment Variables**
   Railway will read these from `content/railway.toml`:
   ```
   VITE_SANITY_PROJECT_ID=pctfp1xq
   VITE_SANITY_DATASET=production
   VITE_SANITY_API_VERSION=2024-09-01
   ```

4. **Deploy**
   - Railway will build: `npm ci && npm run build`
   - Railway will start: `PORT=${PORT:-3333} npm run start -- --host 0.0.0.0 --port $PORT`

## 🔧 Railway CLI Method (Alternative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy SvelteKit service
railway project new
railway up

# Deploy Sanity service in new project
cd content
railway project new
railway up
```

## 🌐 Service URLs

After deployment, you'll get two URLs:
- **SvelteKit Frontend**: `https://your-svelte-app.railway.app`
- **Sanity CMS**: `https://your-sanity-cms.railway.app`

## 🔗 Connecting Services

The SvelteKit app will connect to Sanity via the environment variables:
- `VITE_SANITY_PROJECT_ID`
- `VITE_SANITY_DATASET`
- `VITE_SANITY_API_VERSION`

No additional configuration needed - they communicate via Sanity's API.

## 🐛 Troubleshooting

### Build Failures

1. **SvelteKit Build Issues**
   - Check that `SUPABASE_SERVICE_ROLE` is set correctly
   - Verify all environment variables are present

2. **Sanity Build Issues**
   - Ensure `content/railway.toml` exists
   - Check that root directory is set to `content`

### Environment Variables

1. **Missing Variables**
   - Go to Railway project → Variables tab
   - Add any missing environment variables manually

2. **Secret Variables**
   - Replace placeholder values with actual API keys:
     - `OPENAI_API_KEY`
     - Supabase keys (if using different ones)

## 🔒 Security Notes

- ✅ API keys are stored as environment variables (not in code)
- ✅ Supabase service role key is only used server-side
- ✅ OpenAI API key is properly configured
- ⚠️ Remember to replace placeholder API keys with real ones

## 📱 Post-Deployment

1. **Test SvelteKit App**: Visit your Railway URL and test functionality
2. **Test Sanity Studio**: Access the Sanity studio at its Railway URL
3. **Verify Connection**: Ensure SvelteKit can fetch data from Sanity

## 🔄 Updates

For future deployments:
1. Push changes to GitHub
2. Railway will automatically redeploy both services
3. Environment variables persist across deployments
