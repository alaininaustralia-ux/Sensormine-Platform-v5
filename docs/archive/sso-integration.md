# Single Sign-On (SSO) Integration Guide

## Overview

This document describes the SSO integration architecture for the Sensormine Platform. The system supports multiple SSO providers including Azure AD, Auth0, Google, and generic OAuth2/OpenID Connect providers.

## Architecture

### Components

1. **ApiGateway**: Entry point for authentication, JWT token generation
2. **Identity.API**: User management service (port 5300)
3. **Frontend**: React/Next.js application with SSO login buttons
4. **SSO Provider**: External identity provider (Azure AD, Auth0, etc.)

### Authentication Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   ApiGateway     │         │  Identity.API   │
│   (Next.js)     │         │   (Port 5020)    │         │  (Port 5300)    │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │  1. Redirect to SSO       │                            │
         │ ─────────────────────────▶│                            │
         │                           │                            │
         │                    ┌──────▼──────────┐                │
         │                    │   SSO Provider  │                │
         │                    │  (Azure AD/     │                │
         │                    │   Auth0/etc)    │                │
         │                    └──────┬──────────┘                │
         │  2. SSO Login             │                            │
         │ ◀─────────────────────────┘                            │
         │                           │                            │
         │  3. Return with code      │                            │
         │ ─────────────────────────▶│                            │
         │                           │                            │
         │                           │  4. Validate token &       │
         │                           │     get user info          │
         │                           │ ──────────────────────────▶│
         │                           │                            │
         │                           │  5. Create/update user     │
         │                           │ ◀──────────────────────────│
         │                           │                            │
         │  6. Return JWT token      │                            │
         │ ◀─────────────────────────│                            │
         │                           │                            │
```

## Supported SSO Providers

### 1. Azure Active Directory (Azure AD / Microsoft Entra ID)

**Configuration:**
```json
{
  "Authentication": {
    "AzureAd": {
      "Instance": "https://login.microsoftonline.com/",
      "TenantId": "your-tenant-id",
      "ClientId": "your-client-id",
      "ClientSecret": "your-client-secret",
      "CallbackPath": "/signin-oidc",
      "Scopes": "openid profile email"
    }
  }
}
```

**Required Azure AD Setup:**
1. Register application in Azure Portal
2. Configure redirect URI: `https://yourdomain.com/signin-oidc`
3. Enable ID tokens
4. Add API permissions: User.Read, email, profile, openid
5. Generate client secret

**Claims Mapping:**
- `sub` or `oid` → User ID
- `email` or `upn` → Email
- `name` → Full Name
- `tid` → Tenant ID (optional)

### 2. Auth0

**Configuration:**
```json
{
  "Authentication": {
    "Auth0": {
      "Domain": "your-tenant.auth0.com",
      "ClientId": "your-client-id",
      "ClientSecret": "your-client-secret",
      "CallbackPath": "/callback",
      "Audience": "https://your-api-identifier"
    }
  }
}
```

**Required Auth0 Setup:**
1. Create application in Auth0 Dashboard
2. Set Application Type: Regular Web Application
3. Configure Allowed Callback URLs
4. Configure Allowed Logout URLs
5. Enable OIDC Conformant

**Claims Mapping:**
- `sub` → User ID
- `email` → Email
- `name` → Full Name
- Custom claims via Auth0 Rules

### 3. Google OAuth2

**Configuration:**
```json
{
  "Authentication": {
    "Google": {
      "ClientId": "your-client-id.apps.googleusercontent.com",
      "ClientSecret": "your-client-secret",
      "CallbackPath": "/signin-google",
      "Scopes": "openid profile email"
    }
  }
}
```

**Required Google Setup:**
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Configure OAuth consent screen

**Claims Mapping:**
- `sub` → User ID
- `email` → Email
- `name` → Full Name
- `picture` → Avatar URL

### 4. Generic OAuth2/OpenID Connect

**Configuration:**
```json
{
  "Authentication": {
    "Oidc": {
      "Authority": "https://your-identity-provider.com",
      "ClientId": "your-client-id",
      "ClientSecret": "your-client-secret",
      "ResponseType": "code",
      "Scopes": "openid profile email",
      "CallbackPath": "/signin-oidc",
      "MetadataAddress": "https://your-identity-provider.com/.well-known/openid-configuration"
    }
  }
}
```

## Implementation Steps

### Backend (ApiGateway)

1. **Install NuGet Packages:**
```bash
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect
dotnet add package Microsoft.AspNetCore.Authentication.Google
```

2. **Configure Authentication in Program.cs:**
```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.Authority = builder.Configuration["Authentication:AzureAd:Instance"] + 
                       builder.Configuration["Authentication:AzureAd:TenantId"];
    options.ClientId = builder.Configuration["Authentication:AzureAd:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:AzureAd:ClientSecret"];
    options.ResponseType = "code";
    options.SaveTokens = true;
    options.Events = new OpenIdConnectEvents
    {
        OnTokenValidated = async context =>
        {
            // Handle user creation/update via Identity.API
        }
    };
});
```

3. **Create SSO Controller:**
```csharp
[ApiController]
[Route("api/sso")]
public class SsoController : ControllerBase
{
    [HttpGet("login/{provider}")]
    public IActionResult Login(string provider)
    {
        var redirectUrl = Url.Action(nameof(Callback), "Sso");
        var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(properties, provider);
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback()
    {
        var result = await HttpContext.AuthenticateAsync();
        if (!result.Succeeded)
        {
            return BadRequest("SSO authentication failed");
        }

        // Extract claims
        var email = result.Principal.FindFirst(ClaimTypes.Email)?.Value;
        var name = result.Principal.FindFirst(ClaimTypes.Name)?.Value;
        var ssoProvider = result.Principal.FindFirst("idp")?.Value ?? "unknown";
        var ssoUserId = result.Principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Call Identity.API to create/update user
        // Generate JWT token
        // Return token to frontend
    }
}
```

### Frontend (Next.js)

1. **Create SSO Login Component:**
```typescript
export function SsoLogin() {
  const handleSsoLogin = (provider: 'azure' | 'auth0' | 'google') => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/sso/login/${provider}`;
  };

  return (
    <div className="sso-buttons">
      <button onClick={() => handleSsoLogin('azure')}>
        <MicrosoftIcon /> Sign in with Microsoft
      </button>
      <button onClick={() => handleSsoLogin('google')}>
        <GoogleIcon /> Sign in with Google
      </button>
      <button onClick={() => handleSsoLogin('auth0')}>
        <Auth0Icon /> Sign in with Auth0
      </button>
    </div>
  );
}
```

2. **Handle Callback:**
```typescript
// pages/auth/callback.tsx
export default function AuthCallback() {
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token as string);
      router.push('/dashboard');
    }
  }, [token, router]);

  return <div>Completing sign in...</div>;
}
```

### Identity.API Integration

1. **SSO User Lookup/Creation:**
```csharp
public async Task<User> GetOrCreateSsoUser(string ssoProvider, string ssoUserId, string email, string name)
{
    // Check if user exists with SSO ID
    var user = await _userRepository.GetBySsoIdAsync(ssoProvider, ssoUserId);
    
    if (user != null)
    {
        // Update last login
        user.LastLoginAt = DateTimeOffset.UtcNow;
        return await _userRepository.UpdateAsync(user);
    }

    // Check if user exists with email
    var existingUser = await _userRepository.GetByEmailAsync(email, tenantId);
    
    if (existingUser != null)
    {
        // Link SSO account to existing user
        existingUser.SsoProvider = ssoProvider;
        existingUser.SsoUserId = ssoUserId;
        existingUser.LastLoginAt = DateTimeOffset.UtcNow;
        return await _userRepository.UpdateAsync(existingUser);
    }

    // Create new user
    var newUser = new User
    {
        TenantId = tenantId,
        Email = email,
        FullName = name,
        SsoProvider = ssoProvider,
        SsoUserId = ssoUserId,
        Role = UserRole.Viewer, // Default role
        IsActive = true,
        LastLoginAt = DateTimeOffset.UtcNow
    };

    return await _userRepository.CreateAsync(newUser);
}
```

## Security Considerations

### 1. Token Validation
- Always validate JWT signatures
- Check token expiration
- Verify issuer and audience claims
- Use HTTPS for all authentication endpoints

### 2. User Provisioning
- Default new SSO users to lowest privilege role (Viewer)
- Require admin approval for elevated roles
- Maintain audit log of SSO user creations

### 3. Tenant Isolation
- Ensure SSO users are assigned to correct tenant
- Prevent cross-tenant access
- Validate tenant ID in all JWT claims

### 4. Session Management
- Implement token refresh mechanism
- Use short-lived access tokens (1 hour)
- Use long-lived refresh tokens (7 days)
- Implement single logout (SLO) if supported by provider

## Testing SSO Integration

### 1. Development Environment
```bash
# Start services
docker-compose up -d
dotnet run --project src/Services/ApiGateway
dotnet run --project src/Services/Identity.API

# Start frontend
cd src/Web/sensormine-web
npm run dev
```

### 2. Test Azure AD
1. Navigate to `http://localhost:3020/login`
2. Click "Sign in with Microsoft"
3. Login with Azure AD credentials
4. Verify redirect to dashboard
5. Check JWT token claims in developer tools

### 3. Test Claims
```bash
# Decode JWT token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5020/api/auth/me

# Expected response:
{
  "id": "user-guid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "Viewer",
  "tenantId": "tenant-guid",
  "ssoProvider": "AzureAd"
}
```

## Troubleshooting

### Common Issues

**1. Redirect URI Mismatch**
- Error: `redirect_uri_mismatch`
- Solution: Verify callback URL in SSO provider matches configuration

**2. Invalid Client**
- Error: `invalid_client`
- Solution: Check ClientId and ClientSecret in configuration

**3. Token Validation Failed**
- Error: `IDX10205: Issuer validation failed`
- Solution: Verify Authority URL and MetadataAddress

**4. CORS Errors**
- Error: `Access-Control-Allow-Origin`
- Solution: Add SSO provider domain to CORS policy

**5. User Not Created**
- Error: User exists in SSO but not in database
- Solution: Check Identity.API logs, verify OnTokenValidated event

## Migration from Local Auth to SSO

### Phase 1: Preparation
1. Add SSO provider columns to users table
2. Deploy Identity.API updates
3. Configure SSO providers in ApiGateway

### Phase 2: Gradual Rollout
1. Enable SSO alongside existing auth
2. Allow users to link SSO accounts
3. Monitor adoption metrics

### Phase 3: Migration
1. Send email to all users about SSO
2. Provide grace period for linking accounts
3. Disable local auth for migrated users

### Phase 4: Enforcement
1. Require SSO for new users
2. Deprecate local authentication
3. Remove password fields (optional)

## Production Checklist

- [ ] Configure SSO provider with production URLs
- [ ] Store secrets in Azure Key Vault or equivalent
- [ ] Enable multi-factor authentication in SSO provider
- [ ] Set up SSO provider monitoring/alerts
- [ ] Configure custom branding in SSO provider
- [ ] Test SSO with all supported browsers
- [ ] Document SSO setup for end users
- [ ] Create admin guide for managing SSO users
- [ ] Implement emergency local admin access
- [ ] Set up SSO audit logging

## References

- [Microsoft Authentication Library (MSAL)](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Auth0 Documentation](https://auth0.com/docs)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
