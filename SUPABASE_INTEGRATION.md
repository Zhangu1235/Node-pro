# Supabase Integration Guide

## Overview

This project now includes full Supabase integration for email authentication, user management, and feedback storage. All user passwords are securely hashed and stored in the Supabase database.

## Database Schema

### Users Table (`users`)
Stores user account information with secure password hashing.

```sql
- id (uuid, primary key)
- email (text, unique)
- password_hash (text) - bcrypt hashed password
- first_name (text, nullable)
- last_name (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

### Feedback Table (`feedback`)
Stores user feedback submissions with audit trail.

```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- title (text)
- description (text)
- category (text) - e.g., 'bug', 'feature', 'improvement'
- status (text) - 'open', 'in_progress', 'closed'
- rating (integer, 1-5 scale)
- created_at (timestamp)
- updated_at (timestamp)
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "jwt_token_here"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "message": "Login successful",
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "message": "Logged out successfully"
}
```

### Feedback Routes (`/api/feedback`)

#### Create Feedback
```
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bug Report",
  "description": "App crashes on login",
  "category": "bug",
  "rating": 2
}

Response:
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Bug Report",
  "description": "App crashes on login",
  "category": "bug",
  "status": "open",
  "rating": 2,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Get All User Feedback
```
GET /api/feedback
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid",
    "title": "Bug Report",
    "description": "...",
    "category": "bug",
    "status": "open",
    "rating": 2,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Feedback by ID
```
GET /api/feedback/:id
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  ...feedback details
}
```

#### Update Feedback
```
PUT /api/feedback/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "in_progress",
  "rating": 3
}

Response:
{
  "id": "uuid",
  ...updated feedback details
}
```

#### Delete Feedback
```
DELETE /api/feedback/:id
Authorization: Bearer <token>

Response:
{
  "message": "Feedback deleted successfully"
}
```

## Security Features

### Password Security
- Passwords are hashed using bcrypt with a salt round of 10
- Never stored in plain text
- Compared securely during login

### Authentication
- JWT tokens used for session management
- Token expires in 7 days
- Required for all protected endpoints

### Password Validation
Requirements for registration:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Email Validation
- Valid email format required
- Unique constraint on email field

## Environment Variables

Required environment variables (automatically set via Supabase integration):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-jwt-secret-key (optional, defaults to dev key)
```

## Running Migrations

Database migrations are stored in the `scripts/` folder:

- `01-create-users-table.sql` - Creates the users table
- `02-create-feedback-table.sql` - Creates the feedback table

Run migrations:
```bash
node --env-file-if-exists=/vercel/share/.env.project scripts/run-migrations.js
```

## Files Added/Modified

### New Files
- `/scripts/01-create-users-table.sql` - User schema migration
- `/scripts/02-create-feedback-table.sql` - Feedback schema migration
- `/scripts/run-migrations.js` - Migration runner script
- `/lib/auth-utils.js` - Authentication utilities (hash, token generation, validation)
- `/routes/auth-routes.js` - Authentication API routes
- `/routes/feedback-routes.js` - Feedback API routes

### Modified Files
- `/server.js` - Integrated new route handlers
- `/package.json` - Added bcryptjs and jsonwebtoken dependencies

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found
- `500` - Server error

Error responses include a descriptive error message.

## Testing

Example curl commands:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Create feedback (requires token)
curl -X POST http://localhost:3000/api/feedback \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Great app",
    "description": "Love using this",
    "category": "feature",
    "rating": 5
  }'
```

## Next Steps

1. Test the authentication endpoints with your frontend
2. Implement JWT token storage in client (localStorage, cookies, etc.)
3. Add email verification for new accounts
4. Implement password reset functionality
5. Add admin dashboard for feedback management
6. Set up Row Level Security (RLS) policies in Supabase for additional security
