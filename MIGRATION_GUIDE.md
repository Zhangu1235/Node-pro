# Migration Guide: From Nodemailer to Supabase Email

If you were previously using the nodemailer-based password reset and email setup, here's how to migrate to the new Supabase-native approach.

## Why Migrate?

✅ **Advantages:**
- No external email service needed
- Built-in email authentication
- Better security with Supabase's token handling
- Simpler configuration
- Better reliability
- No SMTP credentials to manage
- Scales automatically

## What's Changing

### Removed Components
```
❌ lib/email-service.js (now deprecated)
❌ password_reset_tokens table (Supabase handles this)
❌ nodemailer package dependency
❌ SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD env vars
❌ sendEmailConfirmation function calls
```

### New Components
```
✅ Supabase's resetPasswordForEmail() API
✅ Supabase's verifyOtp() method
✅ Streamlined password reset flow
✅ Simpler database schema
```

## Migration Steps

### Step 1: Update Your Code

**Before (Nodemailer):**
```javascript
const { sendPasswordResetEmail } = require('./email-service');

async function requestPasswordReset(email) {
    // Generate custom token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Save to custom table
    await saveResetToken(token, email);
    
    // Send via nodemailer
    await sendPasswordResetEmail(email, token);
}
```

**After (Supabase):**
```javascript
async function requestPasswordReset(email, redirectUrl) {
    // Supabase handles everything
    await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
    });
}
```

### Step 2: Update Environment Variables

**Remove these:**
```env
# OLD - NO LONGER NEEDED
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@app.com
```

**Keep these:**
```env
# NEW - ALREADY IN PLACE
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
APP_URL=http://localhost:3000
```

### Step 3: Update Database

**Run this SQL to clean up:**
```sql
-- Drop old table (data will be lost)
DROP TABLE IF EXISTS public.password_reset_tokens;

-- Supabase auth.recovery_tokens handles this now
```

**Or manually run SUPABASE_SETUP.sql** which doesn't include the old table.

### Step 4: Update Frontend

**Old reset-password.html:**
```javascript
// Sent token directly to API
const response = await fetch('/api/auth/reset-password', {
    body: JSON.stringify({ token, password })
});
```

**New reset-password.html:**
```javascript
// Exchange token for session first
const { data } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery'
});

// Use access token
const response = await fetch('/api/auth/reset-password', {
    body: JSON.stringify({ 
        accessToken: data.session.access_token,
        password 
    })
});
```

### Step 5: Update Server Endpoints

**Old /api/auth/forgot-password:**
```javascript
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    // Email sent via nodemailer
});
```

**New /api/auth/forgot-password:**
```javascript
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const appUrl = process.env.APP_URL;
    const result = await requestPasswordReset(email, `${appUrl}/reset-password`);
    // Email sent by Supabase
});
```

**Old /api/auth/reset-password:**
```javascript
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const result = await resetPassword(token, password);
});
```

**New /api/auth/reset-password:**
```javascript
app.post('/api/auth/reset-password', async (req, res) => {
    const { accessToken, password } = req.body;
    const result = await resetPassword(accessToken, password);
});
```

## Testing Migration

### 1. Backup Your Data
```sql
-- Save feedback data
SELECT * FROM feedback;

-- Your user data is safe in auth.users
```

### 2. Run New Setup
```bash
# Update code
git pull origin main

# Install dependencies
npm install

# Run database migration
# Copy SUPABASE_SETUP.sql into Supabase
```

### 3. Test Each Feature
```bash
# Start server
npm start

# Test forgot password
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test feedback (with token)
curl -X POST http://localhost:3000/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","message":"Works!"}'
```

## Rollback Plan

If something goes wrong:

### 1. Revert Code
```bash
git revert HEAD
npm install  # Reinstall nodemailer
```

### 2. Restore Database
```sql
-- Restore backup if needed
-- Or recreate tables from old SUPABASE_SETUP.sql
```

### 3. Revert Environment
```env
# Add back SMTP settings
SMTP_HOST=...
```

## Comparison: Old vs New

| Aspect | Old (Nodemailer) | New (Supabase) |
|--------|-----------------|----------------|
| Email Setup | SMTP configuration | Dashboard click |
| Token Management | Custom + Database | Built-in |
| Security | Manual token handling | Supabase managed |
| Reliability | Depends on SMTP | Enterprise grade |
| Scalability | Limited | Automatic |
| Cost | Free (SMTP) | Free tier included |
| Configuration | Complex | Simple |
| Maintenance | Regular | Zero |

## Common Issues

### Issue: "Email service not configured"

**Cause:** Old code still looking for SMTP settings
**Solution:** Update to latest code from repository

### Issue: Password reset emails not arriving

**Cause:** Supabase email not configured
**Solution:** 
1. Go to Supabase Dashboard
2. Auth → Providers → Email
3. Enable email provider
4. Configure custom domain (optional)

### Issue: Reset link goes to wrong page

**Cause:** URL configuration not set in Supabase
**Solution:**
1. Auth → URL Configuration
2. Add `/reset-password` redirect URL

## Data Preservation

### Feedback Data ✅
```sql
-- Feedback table remains unchanged
-- All existing data preserved
SELECT * FROM feedback;  -- Still works
```

### User Data ✅
```sql
-- User data in auth.users preserved
-- User profiles table unchanged
-- No data loss
```

### Password Reset Tokens ⚠️
```sql
-- Old password_reset_tokens table deprecated
-- Any pending tokens will be lost
-- Users must request new reset links
-- This is fine - tokens expire anyway
```

## Benefits of Migration

1. **Simpler Operations**
   - No SMTP configuration needed
   - No email service monitoring
   - No rate limits to manage

2. **Better Security**
   - Supabase handles token generation
   - Automatic token rotation
   - Built-in rate limiting
   - Enterprise-grade security

3. **Lower Costs**
   - No third-party email service needed
   - Included in Supabase free tier
   - No additional charges

4. **Better Reliability**
   - Supabase's global infrastructure
   - 99.9% uptime SLA
   - Automatic failover

5. **Less Maintenance**
   - No email service to manage
   - No configuration to update
   - Supabase handles updates

## Support

- See **SUPABASE_EMAIL_AUTH_GUIDE.md** for full documentation
- See **SUPABASE_QUICK_START.md** for quick setup
- Check Supabase docs: https://supabase.com/docs/guides/auth/email

## Checklist

- [ ] Backup current data
- [ ] Update .env file
- [ ] Update auth.js with new functions
- [ ] Update server.js endpoints
- [ ] Update reset-password.html
- [ ] Update forgot-password.html
- [ ] Run SUPABASE_SETUP.sql
- [ ] Test password reset flow
- [ ] Test feedback flow
- [ ] Remove nodemailer from package.json
- [ ] Run npm install
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Update team documentation

## Questions?

Refer to the migration docs or check:
- GitHub issues
- Supabase Discord community
- Stack Overflow
