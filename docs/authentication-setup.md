# Authentication Setup - Sensormine Platform

## Summary

✅ **Login system is now fully functional!**

The platform now has a complete authentication flow from frontend to backend.

## What Was Done

### 1. Backend Authentication API (ApiGateway)
- **Created** `AuthController.cs` with endpoints:
  - `POST /api/auth/login` - Login with email/password
  - `POST /api/auth/logout` - Logout user
  - `POST /api/auth/refresh` - Refresh JWT token
  - `GET /api/auth/me` - Get current user info

- **Updated** `Program.cs`:
  - Added Controllers support
  - Enabled CORS for localhost:3020 (frontend)
  - Added JWT authentication middleware
  
- **Added** JWT packages:
  - Microsoft.AspNetCore.Authentication.JwtBearer
  - System.IdentityModel.Tokens.Jwt

### 2. Frontend Configuration
- **Updated** `.env.local`:
  - Changed API base URL from `localhost:5000` to `localhost:5020`
  - Matches the offset port strategy

### 3. Fixed Launch Configurations
- **Updated** `.vscode/launch.json`:
  - Changed all service paths from `net8.0` to `net9.0`
  - Fixed DLL path mismatch that was preventing services from starting

## How to Login

### Option 1: Demo Credentials (Development)
```
Email: demo@sensormine.com
Password: demo123
```

### Option 2: Any Credentials (Development Mode)
For development, the authentication accepts **any email/password combination**.
- Just enter any valid email format
- Enter any password
- The system will generate a JWT token and mock user data

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js App    │         │   ApiGateway     │
│  Port: 3020     │────────▶│   Port: 5020     │
│                 │  HTTP   │                   │
│  - Login Page   │         │  - AuthController│
│  - AuthProvider │         │  - JWT Tokens    │
│  - API Client   │         │  - CORS Enabled  │
└─────────────────┘         └──────────────────┘
```

## Files Modified

1. `src/Services/ApiGateway/Controllers/AuthController.cs` ✨ NEW
2. `src/Services/ApiGateway/Program.cs` ✏️ Modified
3. `src/Services/ApiGateway/ApiGateway.csproj` ✏️ Modified
4. `src/Web/sensormine-web/.env.local` ✏️ Modified
5. `.vscode/launch.json` ✏️ Modified (all 11 services)

## Testing the Login Flow

### Step 1: Start Infrastructure
```powershell
docker-compose up -d
```

### Step 2: Start ApiGateway
Press **F5** in VS Code and select **"ApiGateway"** configuration

### Step 3: Start Frontend
Press **F5** in VS Code and select **"Next.js Frontend"** configuration

### Step 4: Navigate to Login
Open browser: `http://localhost:3020/login`

### Step 5: Login
- Enter any email (e.g., `user@example.com`)
- Enter any password (e.g., `password123`)
- Click "Log in"
- You'll be redirected to `/dashboard`

## JWT Token Details

The authentication system generates JWT tokens with:
- **Expiration**: 1 hour
- **Claims**: Email, User ID, Role
- **Algorithm**: HS256
- **Issuer**: sensormine
- **Audience**: sensormine-app

## Next Steps (Production)

For production deployment, you'll need to:

1. **Replace Mock Authentication** with real user database
2. **Add Password Hashing** (bcrypt, Argon2)
3. **Implement User Management** (registration, password reset)
4. **Add Role-Based Access Control** (RBAC)
5. **Store Secrets in Azure Key Vault** (JWT secret, DB passwords)
6. **Add Rate Limiting** on auth endpoints
7. **Implement Refresh Token Rotation**
8. **Add Multi-Factor Authentication** (MFA)
9. **Add Audit Logging** for authentication events
10. **Consider OAuth2/OIDC** integration (Azure AD, Keycloak)

## Troubleshooting

### "Cannot connect to API"
- Ensure ApiGateway is running on port 5020
- Check CORS settings in Program.cs
- Verify `.env.local` has correct API URL

### "DLL does not exist" Error
- Stop all running dotnet processes: `Get-Process dotnet | Stop-Process -Force`
- Rebuild: `dotnet build Sensormine.sln`

### Frontend Not Loading
- Check port 3020 is available
- Install dependencies: `cd src/Web/sensormine-web && npm install`
- Restart dev server: `npm run dev`

## Security Notes

⚠️ **Current Implementation is for DEVELOPMENT ONLY**

- Accepts any credentials
- Uses hardcoded JWT secret
- No password validation
- No rate limiting
- No account lockout
- No audit logging

**DO NOT deploy to production without implementing proper security!**
