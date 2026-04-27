# Password Reset & Feedback Features Documentation

## Overview

This document explains the new Password Reset and Feedback features that have been added to the Node-pro application. These features use email authentication and are fully integrated with Supabase.

## Features Added

### 1. **Forgot Password (Email-based)**
- Users can request a password reset by providing their email
- System generates a secure token valid for 24 hours
- Email is sent with a reset link
- Only valid tokens can reset passwords
- Tokens are marked as used after being consumed

### 2. **Reset Password**
- Secure password reset using a valid token
- Password strength validation (minimum 6 characters)
- User-friendly password reset form with strength indicator
- Prevents token reuse

### 3. **Feedback System**
- Users can submit structured feedback
- Optional 5-star rating system
- Categorized feedback (General, Feature Request, Bug Report, etc.)
- Confirmation email sent after submission
- Users can view their feedback history

## Database Schema

### New Tables Created

#### 1. `feedback` Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID - FK to auth.users)
- email (VARCHAR)
- subject (VARCHAR 255)
- message (TEXT)
- rating (INTEGER 1-5, optional)
- category (VARCHAR 50)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. `password_reset_tokens` Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- user_id (UUID - FK to auth.users)
- email (VARCHAR)
- token (VARCHAR 255 UNIQUE)
- expires_at (TIMESTAMP)
- used (BOOLEAN)
- used_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**To set up these tables**, run the updated `SUPABASE_SETUP.sql` file in your Supabase project:
1. Go to Supabase Dashboard > SQL Editor
2. Create a new query
3. Copy and paste the entire content of `SUPABASE_SETUP.sql`
4. Execute the query

## Environment Variables

Add these to your `.env` file for email functionality:

```env
# Email Configuration
# Option 1: Using SMTP (Gmail, SendGrid, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourapp.com

# OR Option 2: Using SendGrid (requires sendgrid package)
SENDGRID_API_KEY=your-sendgrid-api-key

# Supabase Configuration (already set up)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Email Service Setup

#### Gmail SMTP Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASSWORD`
4. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`

#### SendGrid Setup
1. Create a SendGrid account
2. Create an API key from Settings > API Keys
3. Install SendGrid email package: `npm install @sendgrid/mail`
4. Use the API key in `SENDGRID_API_KEY`

## API Endpoints

### 1. Request Password Reset
**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

**Note:** Always returns success for security (doesn't reveal if email exists)

### 2. Reset Password
**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "new-password",
  "passwordConfirm": "new-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 3. Submit Feedback
**Endpoint:** `POST /api/feedback`

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Request Body:**
```json
{
  "subject": "Feedback subject",
  "message": "Detailed feedback message",
  "rating": 4,
  "category": "feature-request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your feedback!",
  "feedbackId": 123
}
```

### 4. Get User Feedback
**Endpoint:** `GET /api/feedback`

**Headers:**
```
Authorization: Bearer <auth-token>
```

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": 1,
      "subject": "Great app!",
      "message": "Love the features",
      "rating": 5,
      "category": "general",
      "created_at": "2024-04-27T10:30:00Z"
    }
  ]
}
```

## Frontend Pages

### 1. **Forgot Password Page**
- **URL:** `/forgot-password`
- **File:** `public/forgot-password.html`
- **Features:**
  - Email input with validation
  - Success message with auto-redirect to login
  - Error handling

### 2. **Reset Password Page**
- **URL:** `/reset-password?token=<token>`
- **File:** `public/reset-password.html`
- **Features:**
  - Password strength indicator
  - Confirm password validation
  - Auto-redirect to login on success
  - Prevents invalid/expired token usage

### 3. **Feedback Page**
- **URL:** `/feedback`
- **File:** `public/feedback.html`
- **Features:**
  - Two tabs: "Submit Feedback" and "My Feedback"
  - Star rating system (1-5 stars)
  - Category selection
  - Character counter for subject/message
  - Feedback history view
  - Responsive design

## Integration with Existing Login

### Add to Login Page
Add links to forgot password and feedback in your `login.html`:

```html
<a href="/forgot-password">Forgot Password?</a>
```

Add to your main app after login:

```html
<a href="/feedback">Send Feedback</a>
```

## Code Files Modified/Created

### Created Files:
1. **`lib/email-service.js`** - Email sending utility for password reset and feedback confirmations
2. **`public/forgot-password.html`** - Forgot password form page
3. **`public/reset-password.html`** - Password reset form page
4. **`public/feedback.html`** - Feedback submission and history page

### Modified Files:
1. **`lib/auth.js`** - Added password reset and feedback functions:
   - `requestPasswordReset(email)`
   - `resetPassword(token, newPassword)`
   - `submitFeedback(userId, email, subject, message, rating, category)`
   - `getUserFeedback(userId)`

2. **`server.js`** - Added new API endpoints and HTML routes:
   - `POST /api/auth/forgot-password`
   - `POST /api/auth/reset-password`
   - `POST /api/feedback`
   - `GET /api/feedback`
   - `GET /forgot-password`
   - `GET /reset-password`
   - `GET /feedback`

3. **`SUPABASE_SETUP.sql`** - Added new database tables:
   - `feedback` table
   - `password_reset_tokens` table

4. **`package.json`** - Added nodemailer dependency

## Security Considerations

1. **Password Reset Tokens:**
   - Tokens expire after 24 hours
   - Tokens are marked as used after single use
   - Cannot be reused even if valid
   - Uses secure random token generation

2. **Email Verification:**
   - Email addresses are verified during signup
   - Feedback only accessible to authenticated users
   - Reset requests don't reveal if email exists (prevents user enumeration)

3. **Row Level Security (RLS):**
   - Users can only view their own feedback
   - Password reset tokens only accessible to service role
   - Policies enforce strict access control

## Testing

### Test Password Reset Flow
1. Go to `/forgot-password`
2. Enter a registered email
3. Check the email inbox (or logs if not fully configured)
4. Click reset link from email
5. Enter new password
6. Should redirect to login

### Test Feedback Flow
1. Login to the application
2. Go to `/feedback`
3. Submit feedback with subject and message
4. View submitted feedback in "My Feedback" tab
5. Check email for confirmation

## Troubleshooting

### Emails Not Sending
- Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` in `.env`
- Ensure Gmail has app-specific passwords enabled
- Check server logs for email service initialization messages

### Password Reset Tokens Expired
- Tokens are valid for 24 hours
- After expiry, user must request a new reset
- Check `expires_at` in `password_reset_tokens` table

### Feedback Not Showing
- Ensure user is authenticated (has valid token)
- Check if `user_id` matches in database
- Verify Supabase RLS policies are correctly set up

## Future Enhancements

1. Admin dashboard to view all feedback
2. Email templates customization
3. Feedback notification for admins
4. Two-factor authentication (2FA)
5. OAuth integration (Google, GitHub)
6. Bulk email sending for newsletters
7. Feedback analytics and reporting

## Support

For issues or questions, check:
- Server logs for error messages
- Browser console for frontend errors
- Supabase dashboard for database issues
- Email provider logs for delivery status
