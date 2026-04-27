# Quick Setup Guide: Password Reset & Feedback Features

## Step 1: Install Dependencies

```bash
npm install nodemailer
```

## Step 2: Configure Environment Variables

Create or update your `.env` file with email configuration:

```env
# Email Configuration (choose one method)

# METHOD 1: Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourapp.com

# OR METHOD 2: SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Existing Supabase configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Gmail Setup (Recommended for Testing)
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Windows Computer" (or your device)
4. Use the generated password in `SMTP_PASSWORD`

## Step 3: Set Up Database Tables

1. Open your Supabase project dashboard
2. Go to **SQL Editor** → **New Query**
3. Copy entire content from `SUPABASE_SETUP.sql`
4. Paste into the query editor
5. Click **Run**

This will create:
- `feedback` table
- `password_reset_tokens` table
- Necessary indexes and RLS policies

## Step 4: Update Login Page

Add a link to forgot password in your `login.html`:

```html
<div class="forgot-password-link">
    <a href="/forgot-password">Forgot Password?</a>
</div>
```

## Step 5: Add Feedback Link to Main App

In your main app page (e.g., `index.html`):

```html
<a href="/feedback" class="nav-link">Feedback</a>
```

Or in your navigation menu:

```html
<nav>
    <!-- existing nav items -->
    <a href="/feedback">Send Feedback</a>
    <a href="/api/auth/logout">Logout</a>
</nav>
```

## Step 6: Test the Features

### Test Forgot Password
1. Visit `http://localhost:3000/forgot-password`
2. Enter any registered email
3. Check server logs or email for reset link
4. Click reset link (should have format: `/reset-password?token=...`)
5. Enter new password
6. Should redirect to login after success

### Test Feedback
1. Login to your app at `http://localhost:3000/login`
2. Navigate to `http://localhost:3000/feedback`
3. Submit feedback with subject and message
4. Check email for confirmation
5. View feedback in "My Feedback" tab

## Available Pages/Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/forgot-password` | Request password reset | No |
| `/reset-password?token=...` | Reset password with token | No |
| `/feedback` | Submit and view feedback | Yes |
| `/api/auth/forgot-password` | API endpoint for reset request | No |
| `/api/auth/reset-password` | API endpoint for reset | No |
| `/api/feedback` | API endpoint for feedback | Yes |

## API Testing with cURL

### Request Password Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"your-token-here",
    "password":"newpassword",
    "passwordConfirm":"newpassword"
  }'
```

### Submit Feedback
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{
    "subject":"Great app!",
    "message":"Really love this feature",
    "rating":5,
    "category":"general"
  }'
```

### Get Feedback History
```bash
curl -X GET http://localhost:3000/api/feedback \
  -H "Authorization: Bearer your-auth-token"
```

## Customization

### Email Templates

Edit `lib/email-service.js` to customize:
- Email subject lines
- HTML template styling
- Email sender address
- App URL in reset links

### Feedback Categories

Modify the category options in `public/feedback.html`:

```javascript
<select id="category" name="category">
    <option value="general">General Feedback</option>
    <option value="feature-request">Feature Request</option>
    <option value="bug-report">Bug Report</option>
    <!-- Add more categories here -->
</select>
```

### Password Requirements

Edit validation in `public/reset-password.html` and `lib/auth.js`:

```javascript
if (password.length < 8) {  // Change minimum length
    return { success: false, error: 'Password must be at least 8 characters' };
}
```

## Common Issues & Solutions

### Issue: Emails not sending
**Solution:** 
- Verify SMTP credentials in `.env`
- Check Gmail app passwords are enabled
- Check server logs for error messages
- Try a different email provider

### Issue: Password reset token expired
**Solution:**
- Tokens expire after 24 hours
- User must request a new reset link
- Check `password_reset_tokens` table in Supabase

### Issue: Feedback page shows "not authenticated"
**Solution:**
- Ensure user is logged in before accessing `/feedback`
- Check auth token is stored correctly in localStorage
- Verify token hasn't expired

### Issue: Database tables not found
**Solution:**
- Run the `SUPABASE_SETUP.sql` file again
- Check Supabase project is selected correctly
- Verify you have admin access to the project

## Next Steps

1. **Customize styling** to match your app design
2. **Add admin dashboard** to view all feedback
3. **Set up email notifications** for admins on new feedback
4. **Implement two-factor authentication** for extra security
5. **Add analytics** to track feedback trends

For detailed API documentation, see `PASSWORD_RESET_FEEDBACK_GUIDE.md`
