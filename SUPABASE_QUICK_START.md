# Supabase Email Auth - Quick Start (5 mins)

## What Changed?

✨ **Cleaner Setup** - Everything is now Supabase-native:
- Password reset emails sent by Supabase (no nodemailer)
- User authentication via Supabase
- Feedback stored in Supabase
- Email configuration in Supabase dashboard

## Quick Setup

### 1. Supabase Configuration (2 mins)

```bash
# In your Supabase Dashboard:

1. Go to Authentication → URL Configuration
2. Add redirect URL:
   http://localhost:3000/reset-password
   https://yourdomain.com/reset-password

3. (Optional) Customize email template:
   Auth → Email Templates → Reset Password
```

### 2. Environment Setup (1 min)

Update `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_URL=http://localhost:3000
```

### 3. Database Setup (1 min)

```bash
# In Supabase SQL Editor:
# Copy entire SUPABASE_SETUP.sql content and run
```

### 4. Install & Run (1 min)

```bash
# Install dependencies (no changes, already have Supabase)
npm install

# Start server
npm start
```

## Test It

### Password Reset
1. `/forgot-password` → Enter email
2. Check email for reset link
3. Click link → Enter new password

### Feedback
1. Login to app
2. `/feedback` → Submit feedback
3. View in "My Feedback" tab

## Files Changed

| File | Change |
|------|--------|
| `lib/auth.js` | Uses Supabase password reset API |
| `server.js` | Removed email service init |
| `package.json` | Removed nodemailer |
| `SUPABASE_SETUP.sql` | Removed password_reset_tokens table |
| `public/reset-password.html` | Uses Supabase.verifyOtp() |

## API Endpoints

### Password Reset Request
```
POST /api/auth/forgot-password
{ "email": "user@example.com" }
```

### Reset Password
```
POST /api/auth/reset-password
{ 
  "password": "newpass",
  "passwordConfirm": "newpass",
  "accessToken": "from-supabase"
}
```

### Submit Feedback
```
POST /api/feedback
Authorization: Bearer <token>
{
  "subject": "...",
  "message": "...",
  "rating": 5,
  "category": "general"
}
```

### Get Feedback
```
GET /api/feedback
Authorization: Bearer <token>
```

## Key Differences from Previous Setup

| Feature | Old | New |
|---------|-----|-----|
| Email Service | Nodemailer + SMTP config | Supabase native |
| Password Reset Tokens | Custom table + crypto | Supabase built-in |
| Email Sending | Via configured SMTP | Via Supabase |
| Configuration | .env SMTP settings | Dashboard Email settings |
| Complexity | Complex token management | Simple OTP flow |

## Production URLs

Add these to Supabase URL Configuration:

```
https://yourdomain.com/forgot-password
https://yourdomain.com/reset-password
```

## Troubleshooting

**No reset email received?**
- Check Supabase Email configuration (Auth → Providers → Email)
- Verify domain authorization
- Check spam folder
- Wait 5-10 minutes

**Reset link shows invalid?**
- Link expires in 1 hour
- Check URL configuration in Supabase
- Ensure APP_URL is correct

**Feedback not saving?**
- Verify RLS policies (should be auto-configured)
- Check user is authenticated
- Check Supabase quota

## Next Steps

1. ✅ Configure Supabase email settings
2. ✅ Update .env file
3. ✅ Run SQL setup
4. ✅ Test password reset
5. ✅ Test feedback
6. ✅ Deploy!

See **SUPABASE_EMAIL_AUTH_GUIDE.md** for full documentation.
