# Vercel Deployment Guide for Al-Mishk

## Environment Variables Setup

Before deploying to Vercel, you need to set up the following environment variables in your Vercel project settings:

### Required Environment Variables:

1. **VITE_SUPABASE_PROJECT_ID**
   - Value: `erzobddhkwpnfilbwktv`

2. **VITE_SUPABASE_PUBLISHABLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyem9iZGRoa3dwbmZpbGJ3a3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNDE3NjIsImV4cCI6MjA4NDgxNzc2Mn0.6F0Dc0REC1EWCbmpNyEjlvdI0JUGVJM1RzLqptEVkTI`

3. **VITE_SUPABASE_URL**
   - Value: `https://erzobddhkwpnfilbwktv.supabase.co`

## How to Add Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its name and value
4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Save the changes

## Deployment Settings:

The project uses the following build configuration (already set in `vercel.json`):

- **Framework**: Vite
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## After Setting Environment Variables:

1. Trigger a new deployment by pushing to GitHub, or
2. Redeploy from the Vercel dashboard

## Troubleshooting:

If deployment fails:
- Verify all environment variables are correctly set
- Check the build logs for specific errors
- Ensure Node.js version is 18.x or higher
- Clear build cache and redeploy

## Local Development:

For local development, copy `.env.example` to `.env` and fill in your values.
