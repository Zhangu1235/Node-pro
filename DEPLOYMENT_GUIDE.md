# Deployment & Hosting Guide - Complete Setup

## Hosting Options Comparison

| Platform | Cost | Ease | Scaling | Best For |
|----------|------|------|---------|----------|
| **Vercel** | Free-$$$ | ⭐⭐⭐⭐⭐ | Auto | Quick deployment, Node.js apps |
| **Railway** | Free-$$ | ⭐⭐⭐⭐ | Auto | Full-stack apps, simple setup |
| **Render** | Free-$$ | ⭐⭐⭐⭐ | Auto | Node.js, easy GitHub integration |
| **Heroku** | $$-$$$ | ⭐⭐⭐⭐ | Manual | Established platform |
| **DigitalOcean** | $$/month | ⭐⭐⭐ | Manual | More control, VPS |
| **AWS** | Free tier | ⭐⭐ | Auto | Enterprise, complex setup |

## Quick Start: Recommended Deployments

### 🚀 **Option 1: Vercel (Recommended for Beginners)**
**Best for:** Quick, free deployment with automatic updates

**Cost:** Free tier available, $20+/month for production

**Setup Time:** 5 minutes

[See detailed guide below](#vercel-deployment-guide)

### 🚀 **Option 2: Railway (Recommended for Full-Stack)**
**Best for:** Full Node.js backend with Supabase

**Cost:** $5+/month (includes free credits)

**Setup Time:** 10 minutes

[See detailed guide below](#railway-deployment-guide)

### 🚀 **Option 3: Render (Free Tier Available)**
**Best for:** Learning and small projects

**Cost:** Free tier, $7+/month for paid

**Setup Time:** 10 minutes

[See detailed guide below](#render-deployment-guide)

---

## Vercel Deployment Guide

### Prerequisites
- GitHub account with repository
- Vercel account (free)
- Supabase project set up

### Step 1: Push Code to GitHub

```bash
cd Node-pro
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/Node-pro.git
git push -u origin main
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Select your "Node-pro" repository
5. Click "Import"

### Step 3: Configure Environment Variables

In Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add these variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_URL=https://your-domain.vercel.app
PORT=3000
```

### Step 4: Configure API Routes

For Node.js backend with Vercel, create `/api/index.js`:

```javascript
// api/index.js
module.exports = require('../server.js');
```

### Step 5: Update vercel.json

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 6: Deploy

```bash
git add vercel.json
git commit -m "Add Vercel config"
git push
```

Vercel automatically deploys on push!

### Step 7: Configure Custom Domain

1. Go to Vercel project **Settings**
2. Click **Domains**
3. Add your domain (yourdomain.com)
4. Follow DNS configuration instructions
5. Add CNAME to your DNS provider

### Step 8: Update Supabase URL Configuration

In Supabase dashboard:

1. **Authentication → URL Configuration**
2. Update redirect URLs:
   ```
   https://yourdomain.com/reset-password
   https://yourdomain.com/forgot-password
   ```

### Step 9: Update App Configuration

Update `.env` in production:
```env
APP_URL=https://yourdomain.com
```

### ✅ Vercel Deployment Complete!

**Your app is now live at:** https://yourdomain.com

---

## Railway Deployment Guide

### Prerequisites
- GitHub account with repository
- Railway account (free signup)
- Supabase project set up

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repos

### Step 2: Create New Project

1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select your "Node-pro" repository
4. Click **Deploy**

### Step 3: Configure Environment Variables

1. In Railway dashboard, click **Variables**
2. Add environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_URL=https://yourdomain.com
PORT=3000
NODE_ENV=production
```

### Step 4: Configure Port

1. Click **Service** in Railway
2. Go to **Settings**
3. Set Port to `3000`

### Step 5: Add Domain

1. In Railway, go to **Deployments → Domain**
2. Add custom domain or use Railway's default
3. If custom domain, configure DNS:

```
CNAME: yourdomain.com → railway-proxy.up.railway.app
```

### Step 6: Deploy

Railway automatically deploys when you push to GitHub!

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 7: Monitor Deployment

Check Railway dashboard for:
- Build logs
- Deployment status
- Real-time logs

### ✅ Railway Deployment Complete!

---

## Render Deployment Guide

### Prerequisites
- GitHub account with code pushed
- Render account (free)
- Supabase project

### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Connect GitHub account

### Step 2: Create New Web Service

1. Click **New +**
2. Select **Web Service**
3. Connect your GitHub repository
4. Select "Node-pro" repository

### Step 3: Configure Service

**Name:** node-pro
**Environment:** Node
**Build Command:** `npm install`
**Start Command:** `npm start`

### Step 4: Add Environment Variables

In Render dashboard:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_URL=https://yourdomain.com
PORT=3000
```

### Step 5: Set Plan

- **Free tier:** Spins down after 15 min of inactivity
- **Paid tier:** $7+/month for always-on

### Step 6: Deploy

Click **Create Web Service** - Render automatically deploys!

### Step 7: Add Custom Domain

1. Go to **Settings**
2. Click **Custom Domain**
3. Add your domain
4. Update DNS CNAME:

```
yourdomain.com CNAME render-dot-com.com
```

### ✅ Render Deployment Complete!

---

## Environment Configuration for Production

### Production `.env` Template

```env
# Server
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# Supabase - KEEP THESE SECRET
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend Supabase Keys (can be public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: APIs
APIFY_API_TOKEN=your-token
GEMINI_API_KEY=your-key
TURNSTILE_SITE_KEY=your-key

# Analytics (optional)
SENTRY_DSN=your-sentry-dsn
```

### Update Supabase for Production

**In Supabase Dashboard:**

1. **Authentication → URL Configuration**

Add these redirect URLs:
```
https://yourdomain.com/reset-password
https://yourdomain.com/forgot-password
https://yourdomain.com/login
https://yourdomain.com
```

2. **Settings → General**

- Enable HTTPS (automatic)
- Enable rate limiting
- Set up backups

---

## Domain Setup

### Step 1: Get a Domain

Popular registrars:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare

**Recommended:** Namecheap or Cloudflare (cheaper, better support)

### Step 2: DNS Configuration

For **Vercel:**
```
Domain → Your DNS Provider → Add CNAME Record
Name: @
Value: cname.vercel-dns.com
```

For **Railway/Render:**
```
Name: yourdomain.com
Type: CNAME
Value: railway-proxy.up.railway.app  (or render equivalent)
```

### Step 3: Wait for Propagation

DNS changes can take up to 48 hours, but usually 5-15 minutes.

Check propagation:
```bash
nslookup yourdomain.com
# or
dig yourdomain.com
```

### Step 4: Enable HTTPS

Most platforms provide free SSL automatically.

Verify HTTPS:
```bash
curl -I https://yourdomain.com
# Should show: HTTP/2 200
```

---

## SSL/TLS Certificate Setup

### Automatic (Recommended)

All platforms provide automatic SSL:
- ✅ Vercel - automatic
- ✅ Railway - automatic  
- ✅ Render - automatic

Just add your domain and it's automatically secured!

### Custom Certificate (If Needed)

Use Let's Encrypt (free):
```bash
certbot certonly --standalone -d yourdomain.com
```

---

## Monitoring & Maintenance

### Health Checks

Set up monitoring at:
```
https://yourdomain.com/health
```

### Uptime Monitoring

Use free services:
- UptimeRobot (free tier)
- Statuspages

Add this endpoint:
```
https://yourdomain.com/health
```

### Error Tracking

Add Sentry (optional):
```env
SENTRY_DSN=https://key@sentry.io/project-id
```

### Logs

Check logs via your hosting platform:
- **Vercel:** Deployments → Function logs
- **Railway:** Logs tab
- **Render:** Logs tab

---

## Performance Optimization

### Enable Caching

Create `.vercelignore` or `.renderignore`:
```
node_modules
.git
*.md
.env.local
```

### Optimize Package Size

```bash
# Check bundle size
npm ls

# Remove unused packages
npm prune --production
```

### Enable Gzip Compression

Already included in `server.js` via Express

---

## Database Backups

### Supabase Automatic Backups

Supabase automatically backs up your data daily.

To access backups:
1. Go to Supabase **Backups** (in settings)
2. You can restore to any previous backup

### Manual Backup

Export your data:
```bash
# Export feedback table
curl -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/rest/v1/feedback?select=*&format=csv \
  > feedback_backup.csv
```

---

## Cost Breakdown

### Monthly Costs (Estimated)

**Vercel:**
- Free tier: $0
- Pro: $20/month
- Total: $0-20

**Railway:**
- Usage-based: $5-50/month
- Total: $5-50

**Render:**
- Free tier: $0 (spins down)
- Paid: $7+/month
- Total: $0-7+

**Supabase:**
- Free tier: $0 (generous limits)
- Pro: $25/month
- Total: $0-25

**Domain:**
- ~$12/year
- Total: $1/month

**Total Estimate:**
- Budget: $1-10/month (using free tiers)
- Production: $30-100/month (with paid services)

---

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Service keys NOT in code
- [ ] RLS policies enabled in Supabase
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Sensitive data encrypted
- [ ] Regular backups enabled
- [ ] Error tracking set up
- [ ] Monitoring enabled

---

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] Supabase URL configuration updated
- [ ] Database migrations applied
- [ ] Domain purchased and configured
- [ ] DNS records updated
- [ ] HTTPS verified
- [ ] Health check endpoint working
- [ ] Email functionality tested
- [ ] Password reset tested
- [ ] Feedback system tested
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Backups enabled

---

## Troubleshooting Deployments

### 500 Errors

**Cause:** Missing environment variables

**Solution:**
```bash
# Check all env vars are set
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Redeploy if needed
git push origin main
```

### Connection Timeout

**Cause:** Firewall or DNS issues

**Solution:**
```bash
# Test connection
curl https://yourdomain.com/health

# Check DNS
nslookup yourdomain.com
```

### Database Connection Failed

**Cause:** Wrong Supabase URL or key

**Solution:**
1. Check Supabase dashboard
2. Verify URL and keys match
3. Restart deployment

### Email Not Sending

**Cause:** Supabase email not configured

**Solution:**
1. Go to Supabase → Authentication
2. Configure email provider
3. Add domain (if using custom)

---

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Set up monitoring and alerts
3. ✅ Configure backups
4. ✅ Enable error tracking
5. ✅ Monitor logs regularly
6. ✅ Plan scaling strategy
7. ✅ Set up CI/CD pipeline
8. ✅ Document your setup

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Render Docs:** https://render.com/docs
- **Supabase Docs:** https://supabase.com/docs

Choose your hosting platform and follow the corresponding guide above to get started!
