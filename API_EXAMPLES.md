# API Testing Examples

This file contains curl examples for testing all authentication and feedback endpoints.

## 1. Register a New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Expected Response (201):
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 2. Login User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

Expected Response (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 3. Get Current User

Save the token from login response and use it here:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## 4. Create Feedback

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Amazing Feature Suggestion",
    "description": "It would be great to have dark mode support",
    "category": "feature",
    "rating": 4
  }'
```

Expected Response (201):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Amazing Feature Suggestion",
  "description": "It would be great to have dark mode support",
  "category": "feature",
  "status": "open",
  "rating": 4,
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

## 5. Get All User Feedback

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/api/feedback \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response (200):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Amazing Feature Suggestion",
    "description": "It would be great to have dark mode support",
    "category": "feature",
    "status": "open",
    "rating": 4,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

## 6. Get Specific Feedback

```bash
TOKEN="your-jwt-token-here"
FEEDBACK_ID="660e8400-e29b-41d4-a716-446655440001"

curl -X GET http://localhost:3000/api/feedback/$FEEDBACK_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Amazing Feature Suggestion",
  "description": "It would be great to have dark mode support",
  "category": "feature",
  "status": "open",
  "rating": 4,
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

## 7. Update Feedback

```bash
TOKEN="your-jwt-token-here"
FEEDBACK_ID="660e8400-e29b-41d4-a716-446655440001"

curl -X PUT http://localhost:3000/api/feedback/$FEEDBACK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Dark Mode Feature",
    "status": "in_progress",
    "rating": 5
  }'
```

Expected Response (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated: Dark Mode Feature",
  "description": "It would be great to have dark mode support",
  "category": "feature",
  "status": "in_progress",
  "rating": 5,
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

## 8. Delete Feedback

```bash
TOKEN="your-jwt-token-here"
FEEDBACK_ID="660e8400-e29b-41d4-a716-446655440001"

curl -X DELETE http://localhost:3000/api/feedback/$FEEDBACK_ID \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response (200):
```json
{
  "message": "Feedback deleted successfully"
}
```

## 9. Logout User

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

Expected Response (200):
```json
{
  "message": "Logged out successfully"
}
```

## Error Examples

### Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response (400):
```json
{
  "error": "Invalid email format"
}
```

### Weak Password
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "weak",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response (400):
```json
{
  "error": "Password does not meet requirements",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter",
    "Password must contain at least one number"
  ]
}
```

### Unauthorized (Missing Token)
```bash
curl -X GET http://localhost:3000/api/feedback
```

Response (401):
```json
{
  "error": "No token provided"
}
```

### Not Found
```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:3000/api/feedback/nonexistent-id \
  -H "Authorization: Bearer $TOKEN"
```

Response (404):
```json
{
  "error": "Feedback not found"
}
```

## Testing Tips

1. **Store token in variable**: After login, copy the token and set it as an environment variable for easier testing
   ```bash
   TOKEN="your-token-here"
   curl -X GET http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
   ```

2. **Use a REST client**: Tools like Postman, Insomnia, or VS Code REST Client extension make testing easier

3. **Check password requirements**: Passwords must have:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number

4. **Feedback categories**: Use one of: `bug`, `feature`, `improvement`

5. **Feedback statuses**: Use one of: `open`, `in_progress`, `closed`

6. **Rating scale**: Use integers from 1-5
