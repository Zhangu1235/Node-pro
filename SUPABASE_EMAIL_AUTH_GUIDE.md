# Supabase Email Authentication & Storage - Complete Setup

## Overview

This setup uses **Supabase's native features** for:
- ✅ Email-based password reset (built-in Supabase Auth)
- ✅ User authentication (Supabase Auth)
- ✅ Feedback storage (Supabase Database)
- ✅ Email delivery (Supabase Email)

No external email service (nodemailer) needed!

## Prerequisites

1. Supabase account: https://supabase.com
2. Node.js and npm installed
3. Your app running on a server (for email links to work)

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign up
2. Create a new project
3. Note your **Project URL** and **Anon/Public Key**
4. Generate an API key with **service_role** access

### 1.2 Configure Email Settings in Supabase
1. Go to **Authentication → Providers → Email**
2. Enable **Confirm email (Double Opt-in)** - optional but recommended
3. Go to **Email Templates** (Auth section)
4. Customize the password reset email template (optional):
   - Template name: `Reset Password`
   - Subject: `Reset your password`
   - Example variables: `{{ .ConfirmationURL }}`

### 1.3 Set Email Redirect URLs
1. Go to **Authentication → URL Configuration**
2. Add your app URLs:
   ```
   http://localhost:3000/reset-password
   https://yourdomain.com/reset-password
   https://yourdomain.com/forgot-password
   ```

## Step 2: Environment Configuration

Create/update `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: App URL for redirect links
APP_URL=http://localhost:3000

# Existing configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Database Setup

### 3.1 Run SQL Setup
1. Open your Supabase project dashboard
2. Go to **SQL Editor → New Query**
3. Copy entire content from `SUPABASE_SETUP.sql`
4. Execute the query

This creates:
- `feedback` table with RLS policies
- Indexes for performance
- User feedback storage system

### 3.2 Storage Bucket Setup (Optional - for user uploads)

If you need to store files (like attachment in feedback):

1. Go to **Storage** in Supabase
2. Create a new bucket: `feedback-attachments`
3. Make it public or private based on your needs
4. Configure CORS if needed

## Step 4: Installation & Dependencies

```bash
# Install dependencies
npm install

# The existing packages already include Supabase:
# @supabase/supabase-js@^2.39.0
```

Since we're using Supabase's native email, we removed nodemailer.

## Step 5: Frontend Configuration

### 5.1 Add Supabase Configuration to Login Page

In your `login.html` or main app, add:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
    // Store Supabase config in localStorage for use in other pages
    localStorage.setItem('supabaseUrl', '{{ SUPABASE_URL }}');
    localStorage.setItem('supabaseAnonKey', '{{ SUPABASE_ANON_KEY }}');
</script>
```

### 5.2 Add Navigation Links

In your main app, add links to:

```html
<!-- In header/navbar -->
<a href="/forgot-password">Forgot Password?</a>
<a href="/feedback">Send Feedback</a>
```

## Step 6: API Endpoints

### Password Reset Flow

**1. Request Password Reset:**
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

**2. User receives email** with link: `/reset-password?token=xxx#type=recovery`

**3. User resets password:**
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "password": "newpassword",
  "passwordConfirm": "newpassword",
  "accessToken": "token-from-supabase-verify"
}
```

### Feedback Endpoints

**Submit Feedback:**
```bash
POST /api/feedback
Authorization: Bearer <auth-token>
Content-Type: application/json

{
  "subject": "Great app!",
  "message": "Love the features",
  "rating": 5,
  "category": "general"
}
```

**Get Feedback:**
```bash
GET /api/feedback
Authorization: Bearer <auth-token>
```

## Step 7: Testing

### Test Password Reset
1. Go to `/forgot-password`
2. Enter your email (must be a registered user)
3. Check your email for reset link
4. Click link → redirects to `/reset-password?token=xxx`
5. Enter new password
6. Should confirm success

### Test Feedback
1. Login to app
2. Go to `/feedback`
3. Submit feedback with details
4. View in "My Feedback" tab
5. Data stored in Supabase

## Features & Flows

### Email Authentication Flow

```
User registers → Supabase creates auth.users entry
       ↓
User logs in → Supabase validates credentials
       ↓
Token generated → Stored in localStorage
       ↓
User requests password reset → Supabase sends email
       ↓
User clicks email link → Exchanges token for session
       ↓
Frontend calls /api/auth/reset-password with access token
       ↓
Password updated in Supabase auth.users
```

### Feedback Storage Flow

```
User submits feedback → Validated on backend
       ↓
Stored in Supabase feedback table
       ↓
User ID & email captured for tracking
       ↓
RLS policies ensure users only see their own
       ↓
Admins can query all feedback via service role
```

## Database Schema

### `feedback` Table
```sql
- id: BIGSERIAL (primary key)
- user_id: UUID (foreign key to auth.users)
- email: VARCHAR(255)
- subject: VARCHAR(255)
- message: TEXT
- rating: INTEGER (1-5, optional)
- category: VARCHAR(50)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Indexes:
- user_id
- created_at
- category
```

### Row Level Security

```sql
-- Users can view only their own feedback
SELECT: auth.uid() = user_id

-- Users can insert their own feedback
INSERT: auth.uid() = user_id

-- Service role can manage all feedback
All operations with service role
```

## Environment Variables Summary

```env
# Required
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
APP_URL=http://localhost:3000
PORT=3000
```

## Troubleshooting

### Issue: Password reset emails not sending

**Solution:**
- Check Supabase Email configuration in dashboard
- Verify domain is authorized
- Check email templates are set up
- Wait 5-10 minutes for email delivery
- Check spam folder

### Issue: Reset link shows "Invalid token"

**Solution:**
- Token expires after 1 hour by default
- User must click link before expiration
- Check email template configuration
- Ensure `APP_URL` is correctly set

### Issue: Feedback not appearing

**Solution:**
- Check RLS policies in Supabase
- Verify user is authenticated (has valid token)
- Check user_id matches in database
- Ensure feedback table was created

### Issue: Supabase configuration not found

**Solution:**
- Check localStorage for supabaseUrl and supabaseAnonKey
- Verify these are set in login page
- Check browser console for errors
- Verify `.env` has correct values

## Security Features

✅ **Built-in Security:**
- Email verification for password resets
- Time-limited tokens (1 hour default)
- Single-use recovery codes
- Secure password hashing (bcrypt)
- Row-level security (RLS) for data
- Service role separation

✅ **Best Practices Implemented:**
- Never reveal if email exists (consistent response)
- Token validation on backend
- HTTPS recommended for production
- Secure cookie handling
- Rate limiting on API endpoints

## Production Checklist

- [ ] Update `APP_URL` to production domain
- [ ] Enable HTTPS
- [ ] Configure custom email domain (optional)
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy
- [ ] Enable audit logging
- [ ] Test email delivery
- [ ] Set up error tracking
- [ ] Configure CORS properly
- [ ] Review RLS policies

## Admin Management

### View All Feedback (Admin)

```javascript
// In admin panel
const { data } = await supabase
  .from('feedback')
  .select('*')
  .order('created_at', { ascending: false });
```

### Export Feedback Data

```javascript
const { data } = await supabase
  .from('feedback')
  .select('*')
  .csv();
// Returns CSV formatted data
```

### Query Feedback by Category

```javascript
const { data } = await supabase
  .from('feedback')
  .select('*')
  .eq('category', 'bug-report');
```

## API Rate Limits

- Password reset requests: 5 per minute per email
- General API requests: 100 per 15 minutes
- Feedback submission: 10 per hour per user

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Auth Reference: https://supabase.com/docs/reference/javascript/auth
- Email: https://supabase.com/docs/guides/auth/email
- Database: https://supabase.com/docs/reference/javascript/select

## File Structure

```
Node-pro/
├── lib/
│   ├── auth.js                 # Auth functions (password reset, feedback)
│   ├── email-service.js        # REMOVED - no longer needed
│   └── ...
├── public/
│   ├── forgot-password.html    # Request password reset
│   ├── reset-password.html     # Reset password form
│   ├── feedback.html           # Submit & view feedback
│   └── ...
├── SUPABASE_SETUP.sql          # Database schema (no password_reset_tokens)
├── server.js                   # API endpoints
└── .env                        # Configuration
```

## Next Steps

1. Run SQL setup in Supabase
2. Configure environment variables
3. Test password reset flow
4. Test feedback submission
5. Deploy to production
6. Monitor usage and errors
7. Customize email templates as needed
