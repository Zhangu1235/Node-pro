# Vercel Deployment Guide for StartupEvents

## Environment Variables Setup

Before deploying to Vercel, configure these environment variables in your Vercel project settings:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:
   - `APIFY_API_TOKEN` - Your Apify API token
   - `APIFY_WEBHOOK_SECRET` - Your webhook secret key
   - `APIFY_ACTOR_ID` - The actor ID (default: 9dardaZ3akeIhRfs3)

## Key Changes for Vercel

This project has been configured for Vercel's serverless architecture:

✅ **Serverless API Routes** - API endpoints are in `/api/handler.js`
✅ **Removed Socket.IO** - Replaced with polling (incompatible with Vercel serverless)
✅ **Static File Serving** - Public folder serves static files
✅ **Vercel Configuration** - `vercel.json` configured for optimal deployment

## Deployment Steps

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables:**
   - During deployment, Vercel will prompt you
   - Or set them in project settings afterward

## Local Testing

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Polling vs WebSockets

- **Local Development**: Server supports Socket.IO for real-time updates
- **Vercel Production**: Uses polling (every 30 seconds) since serverless doesn't support WebSockets

## Webhook Configuration

Set your Apify webhook to:
```
https://your-vercel-app.vercel.app/api/webhooks/apify?secret=YOUR_WEBHOOK_SECRET
```

## Troubleshooting

- **Static files not loading**: Ensure `public/` folder is preserved in deployment
- **API calls failing**: Check environment variables are set in Vercel dashboard
- **Events not updating**: Verify APIFY_API_TOKEN is correct and has proper permissions

