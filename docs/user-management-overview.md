# User Management System - Implementation Overview

## Executive Summary

The Sensormine Platform now includes a comprehensive user management system with Single Sign-On (SSO) support, role-based access control (RBAC), and multi-tenant isolation. This document provides an overview of the implemented features and guides for using the system.

## Features Implemented

### 1. User Management (Identity.API)

A dedicated microservice for managing users and invitations:

- **Service Port**: 5300
- **Database**: PostgreSQL (sensormine_identity)
- **Authentication**: JWT with Argon2 password hashing

**Key Components:**
- User CRUD operations
- User invitation workflow
- Password management
- Role assignment
- Super administrator support

### 2. Multi-Tenant Architecture

All services support tenant isolation:

- Tenant ID extracted from JWT claims
- TenantMiddleware for automatic context injection
- Tenant-scoped database queries
- Cross-tenant access for super administrators

### 3. Role-Based Access Control (RBAC)

Three-tier permission system:

| Role | Permissions | Use Case |
|------|------------|----------|
| **Viewer** | Read-only access | Operations monitoring, management review |
| **Dashboard Editor** | Create/edit dashboards | Data analysts, department heads |
| **Administrator** | Full tenant access | IT administrators, platform owners |
| **Super Admin** | Cross-tenant access | Platform operators, support engineers |

### 4. Single Sign-On (SSO)

Ready for integration with:
- Microsoft Azure AD / Entra ID
- Auth0
- Google OAuth2
- Generic OAuth2/OpenID Connect providers

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                          │
│                      Port: 3020                                  │
│  - Login forms                                                   │
│  - User management UI                                            │
│  - Role-based component rendering                                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTPS / JWT Token
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                    ApiGateway                                    │
│                    Port: 5020                                    │
│  - JWT token generation                                          │
│  - SSO callback handling                                         │
│  - Request routing                                               │
│  - CORS configuration                                            │
└──────────────┬───────────────────────────────┬──────────────────┘
               │                               │
               │                               │
┌──────────────▼───────────────┐  ┌──────────▼─────────────────┐
│     Identity.API              │  │   Other Services           │
│     Port: 5300                │  │   (Device, Dashboard, etc) │
│                               │  │                            │
│  - User management            │  │  - Business logic          │
│  - Invitation workflow        │  │  - Use TenantMiddleware    │
│  - Password hashing           │  │  - Tenant-scoped queries   │
│  - Role management            │  │  - Permission checks       │
└───────────────┬───────────────┘  └────────────┬───────────────┘
                │                                │
                │                                │
┌───────────────▼────────────────────────────────▼───────────────┐
│                     PostgreSQL Databases                        │
│                                                                 │
│  - sensormine_identity: Users, Invitations, Tenants            │
│  - sensormine_devices: Devices, Device Types                   │
│  - sensormine_metadata: Schemas, Dashboards                    │
│  - sensormine_telemetry: TimescaleDB time-series data          │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL, -- Viewer, DashboardEditor, Administrator
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    sso_provider VARCHAR(100),
    sso_user_id VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    locked_out_until TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    must_change_password BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    phone_number VARCHAR(50),
    mfa_enabled BOOLEAN DEFAULT false,
    avatar_url VARCHAR(500),
    preferred_language VARCHAR(10),
    timezone VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    
    UNIQUE(email),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_sso ON users(sso_provider, sso_user_id);
```

### User Invitations Table
```sql
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    role TEXT NOT NULL,
    invited_by UUID NOT NULL,
    invited_by_name VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status TEXT NOT NULL, -- Pending, Accepted, Expired, Cancelled, Rejected
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_user_id UUID,
    message VARCHAR(1000),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_invitations_token ON user_invitations(token);
CREATE INDEX idx_invitations_tenant_email ON user_invitations(tenant_id, email);
CREATE INDEX idx_invitations_status ON user_invitations(status);
```

### Tenants Table
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    parent_tenant_id UUID,
    stripe_customer_id VARCHAR(255),
    subscription_plan_id UUID,
    status TEXT NOT NULL, -- Active, Suspended, Cancelled, PendingActivation, PaymentFailed
    subdomain VARCHAR(100) UNIQUE,
    branding JSONB,
    settings JSONB DEFAULT '{}',
    contact_email VARCHAR(255) NOT NULL,
    billing_address JSONB,
    is_trial BOOLEAN DEFAULT false,
    trial_ends_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);
```

## API Endpoints

### Identity.API Endpoints (Port 5300)

#### User Management
```
GET    /api/User                          # List users (paginated)
GET    /api/User/{id}                     # Get user by ID
POST   /api/User                          # Create user
PUT    /api/User/{id}                     # Update user
DELETE /api/User/{id}                     # Delete user
POST   /api/User/{id}/change-password     # Change password
GET    /api/User/statistics               # Get user statistics
```

#### Invitation Management
```
GET    /api/Invitation                    # List invitations (paginated)
GET    /api/Invitation/{id}               # Get invitation by ID
POST   /api/Invitation                    # Create invitation
POST   /api/Invitation/accept             # Accept invitation
POST   /api/Invitation/{id}/cancel        # Cancel invitation
POST   /api/Invitation/{id}/resend        # Resend invitation
DELETE /api/Invitation/{id}               # Delete invitation
```

### ApiGateway Endpoints (Port 5020)

#### Authentication
```
POST   /api/auth/login                    # Login with email/password
POST   /api/auth/logout                   # Logout
POST   /api/auth/refresh                  # Refresh JWT token
GET    /api/auth/me                       # Get current user info
```

#### SSO (Future Implementation)
```
GET    /api/sso/login/{provider}          # Initiate SSO login
GET    /api/sso/callback                  # SSO callback handler
```

## JWT Token Structure

```json
{
  "sub": "user-guid",
  "email": "user@example.com",
  "name": "User Full Name",
  "role": "Administrator",
  "tenant_id": "tenant-guid",
  "user_id": "user-guid",
  "is_super_admin": false,
  "permissions": [
    "read",
    "write",
    "delete",
    "manage_users",
    "manage_devices",
    "manage_dashboards",
    "manage_alerts"
  ],
  "iss": "sensormine",
  "aud": "sensormine-app",
  "exp": 1733610000,
  "iat": 1733606400,
  "jti": "unique-token-id"
}
```

## Quick Start Guide

### 1. Start Infrastructure
```bash
# Start PostgreSQL, Kafka, Redis
docker-compose up -d

# Verify PostgreSQL is running
docker ps | grep postgres
```

### 2. Start Identity.API
```bash
cd src/Services/Identity.API
dotnet run

# Service will be available at http://localhost:5300
# Database migrations will run automatically
```

### 3. Start ApiGateway
```bash
cd src/Services/ApiGateway
dotnet run

# Service will be available at http://localhost:5020
```

### 4. Start Frontend
```bash
cd src/Web/sensormine-web
npm install
npm run dev

# Application will be available at http://localhost:3020
```

### 5. Login with Super Admin
```
Email: admin@sensormine.com
Password: Admin123! (must change on first login)
```

## User Workflows

### Creating a New User (Administrator)

1. Navigate to Settings → Users
2. Click "Invite User"
3. Enter email address
4. Select role (Viewer, Dashboard Editor, Administrator)
5. Optionally add a welcome message
6. Click "Send Invitation"
7. User receives email with invitation link
8. User clicks link, creates password, and accesses platform

### Accepting an Invitation

1. Receive invitation email
2. Click invitation link
3. Fill in full name
4. Create password (minimum 8 characters, complexity requirements)
5. Optionally set preferences (timezone, language)
6. Click "Accept Invitation"
7. Redirected to dashboard

### Changing User Role (Administrator)

1. Navigate to Settings → Users
2. Find user in list
3. Click "Edit"
4. Select new role
5. Click "Save"
6. User's permissions update immediately (after token refresh)

### SSO Login (Future Feature)

1. Navigate to login page
2. Click "Sign in with Microsoft" (or other provider)
3. Redirected to SSO provider
4. Login with SSO credentials
5. Redirected back to platform
6. Account created/linked automatically
7. Redirected to dashboard

## Security Features

### 1. Password Security
- **Hashing Algorithm**: Argon2id (winner of Password Hashing Competition)
- **Configuration**: 64MB memory, 3 iterations, 1 parallelism
- **Salt**: 128-bit random salt per password
- **Output**: 256-bit hash

### 2. JWT Token Security
- **Signing Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 1 hour (configurable)
- **Refresh Tokens**: 7 days (configurable)
- **Claims Validation**: Issuer, audience, expiration, signature

### 3. Account Security
- **Failed Login Tracking**: Automatic lockout after 5 failed attempts
- **Lockout Duration**: 15 minutes (configurable)
- **Password Requirements**: Minimum 8 characters, complexity rules
- **MFA Support**: Ready for TOTP implementation

### 4. Invitation Security
- **Token**: 256-bit secure random token
- **Expiration**: 7 days (configurable)
- **One-time Use**: Token invalid after acceptance
- **Cancellation**: Administrators can cancel pending invitations

## Configuration

### appsettings.json (Identity.API)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=sensormine_identity;Username=sensormine;Password=sensormine123"
  },
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters",
    "Issuer": "sensormine",
    "Audience": "sensormine-app",
    "ExpiryMinutes": 60
  },
  "Urls": "http://localhost:5300"
}
```

### appsettings.json (ApiGateway)
```json
{
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters",
    "Issuer": "sensormine",
    "Audience": "sensormine-app"
  },
  "Urls": "http://localhost:5020",
  "IdentityApi": {
    "BaseUrl": "http://localhost:5300"
  }
}
```

## Testing

### Manual Testing with curl

#### Create User
```bash
curl -X POST http://localhost:5300/api/User \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "email": "newuser@example.com",
    "fullName": "New User",
    "role": "Viewer",
    "password": "SecurePass123!"
  }'
```

#### List Users
```bash
curl http://localhost:5300/api/User \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001"
```

#### Create Invitation
```bash
curl -X POST http://localhost:5300/api/Invitation \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -H "X-User-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "email": "invited@example.com",
    "role": "DashboardEditor",
    "message": "Welcome to Sensormine!",
    "expiryDays": 7
  }'
```

### Integration Testing
```csharp
[Fact]
public async Task CanCreateUserAndLogin()
{
    // Create user via Identity.API
    var createResponse = await _identityClient.CreateUserAsync(new CreateUserRequest
    {
        Email = "test@example.com",
        FullName = "Test User",
        Role = "Viewer",
        Password = "TestPass123!"
    });

    Assert.NotNull(createResponse.Id);

    // Login via ApiGateway
    var loginResponse = await _apiClient.LoginAsync(new LoginRequest
    {
        Email = "test@example.com",
        Password = "TestPass123!"
    });

    Assert.NotNull(loginResponse.Token);
    Assert.Equal("Viewer", loginResponse.User.Role);
}
```

## Monitoring & Logging

### Key Metrics to Monitor
- User login attempts (success/failure rate)
- Active user sessions
- Invitation acceptance rate
- Failed authentication attempts by IP
- Token refresh frequency
- Average session duration

### Log Categories
```
Information: Successful login, user creation, role changes
Warning: Failed login attempts, expired tokens, tenant context missing
Error: Authentication failures, database errors, token validation failures
```

### Sample Log Output
```
[2025-12-06 22:40:00] INFO: Login attempt for email: user@example.com
[2025-12-06 22:40:01] INFO: User 123e4567-e89b-12d3-a456-426614174000 created by admin
[2025-12-06 22:40:02] WARNING: Failed login attempt for email: user@example.com (invalid password)
```

## Troubleshooting

### Common Issues

**1. Cannot login - "User not found"**
- Verify user exists in database
- Check tenant ID matches
- Ensure user is active (`is_active = true`)

**2. Token expired immediately**
- Check system time synchronization
- Verify JWT expiry configuration
- Clear browser cookies and retry

**3. Permission denied after role change**
- User must logout and login again to refresh token
- Check JWT token expiration time
- Verify role was saved to database

**4. Invitation not working**
- Check invitation expiration date
- Verify invitation status is "Pending"
- Check invitation token matches URL parameter

## Production Deployment Checklist

- [ ] Change JWT secret to strong random value
- [ ] Store secrets in Azure Key Vault or equivalent
- [ ] Enable HTTPS for all endpoints
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Configure email service for invitations
- [ ] Enable MFA for administrators
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Review and harden database permissions
- [ ] Enable audit logging
- [ ] Test disaster recovery procedures
- [ ] Document admin procedures
- [ ] Train support staff

## Next Steps

### Phase 1: Frontend Implementation
- Build user management UI in React/Next.js
- Create invitation acceptance flow
- Implement role selection dropdowns
- Add permission-based component rendering

### Phase 2: SSO Implementation
- Integrate Azure AD authentication
- Add Auth0 support
- Implement Google OAuth2
- Create SSO user provisioning flow

### Phase 3: Enhanced Security
- Implement MFA (TOTP/SMS)
- Add device fingerprinting
- Implement session management
- Add suspicious activity detection

### Phase 4: Advanced Features
- User activity audit trail
- Bulk user operations
- Custom role creation
- API key management
- OAuth2 client registration

## Support & Documentation

- **Architecture Documentation**: `/docs/architecture.md`
- **SSO Integration Guide**: `/docs/sso-integration.md`
- **Permissions Matrix**: `/docs/permissions-matrix.md`
- **API Documentation**: Available at `http://localhost:5300/swagger`
- **GitHub Issues**: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues

## Conclusion

The user management system provides a solid foundation for secure, multi-tenant access control in the Sensormine Platform. The implementation follows industry best practices for authentication, authorization, and password security, and is ready for production deployment with proper configuration and additional security hardening.
