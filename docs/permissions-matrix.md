# Role-Based Access Control (RBAC) - Permissions Matrix

## Overview

The Sensormine Platform implements a three-tier role-based access control system with clearly defined permissions for each role. This document outlines the permissions matrix and implementation guidelines.

## User Roles

### 1. Viewer
**Description**: Read-only access to dashboards, data, and devices. Cannot make any modifications.

**Use Cases:**
- Operations team monitoring dashboards
- Management reviewing metrics
- External stakeholders viewing specific data

### 2. Dashboard Editor
**Description**: Can create and modify dashboards, but cannot manage devices or users.

**Use Cases:**
- Data analysts creating visualizations
- Department heads customizing their dashboards
- Power users building custom views

### 3. Administrator
**Description**: Full access to all platform features including user management and system configuration.

**Use Cases:**
- IT administrators
- Platform owners
- System integrators

### 4. Super Administrator (Special)
**Description**: Cross-tenant administrator with access to all tenants and system-level settings.

**Use Cases:**
- Platform operators
- Support engineers
- Multi-tenant SaaS administrators

## Permissions Matrix

| Feature | Viewer | Dashboard Editor | Administrator | Super Admin |
|---------|--------|------------------|---------------|-------------|
| **Dashboards** |
| View dashboards | ✅ | ✅ | ✅ | ✅ |
| Create dashboards | ❌ | ✅ | ✅ | ✅ |
| Edit dashboards | ❌ | ✅ | ✅ | ✅ |
| Delete dashboards | ❌ | ✅ | ✅ | ✅ |
| Share dashboards | ❌ | ✅ | ✅ | ✅ |
| Export dashboards | ✅ | ✅ | ✅ | ✅ |
| **Devices** |
| View devices | ✅ | ✅ | ✅ | ✅ |
| Register devices | ❌ | ❌ | ✅ | ✅ |
| Edit device config | ❌ | ❌ | ✅ | ✅ |
| Delete devices | ❌ | ❌ | ✅ | ✅ |
| View telemetry | ✅ | ✅ | ✅ | ✅ |
| **Device Types** |
| View device types | ✅ | ✅ | ✅ | ✅ |
| Create device types | ❌ | ❌ | ✅ | ✅ |
| Edit device types | ❌ | ❌ | ✅ | ✅ |
| Delete device types | ❌ | ❌ | ✅ | ✅ |
| **Schemas** |
| View schemas | ✅ | ✅ | ✅ | ✅ |
| Create schemas | ❌ | ❌ | ✅ | ✅ |
| Edit schemas | ❌ | ❌ | ✅ | ✅ |
| Delete schemas | ❌ | ❌ | ✅ | ✅ |
| **Alerts** |
| View alerts | ✅ | ✅ | ✅ | ✅ |
| Acknowledge alerts | ✅ | ✅ | ✅ | ✅ |
| Create alert rules | ❌ | ❌ | ✅ | ✅ |
| Edit alert rules | ❌ | ❌ | ✅ | ✅ |
| Delete alert rules | ❌ | ❌ | ✅ | ✅ |
| **Users** |
| View users | ❌ | ❌ | ✅ | ✅ |
| Invite users | ❌ | ❌ | ✅ | ✅ |
| Edit users | ❌ | ❌ | ✅ | ✅ |
| Delete users | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ✅ | ✅ |
| **Tenant Settings** |
| View settings | ❌ | ❌ | ✅ | ✅ |
| Edit settings | ❌ | ❌ | ✅ | ✅ |
| Billing management | ❌ | ❌ | ✅ | ✅ |
| API keys | ❌ | ❌ | ✅ | ✅ |
| **System (Super Admin Only)** |
| Manage all tenants | ❌ | ❌ | ❌ | ✅ |
| View system metrics | ❌ | ❌ | ❌ | ✅ |
| System configuration | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ✅ |

## Permission Implementation

### 1. JWT Claims

Each authenticated user's JWT token contains the following claims:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "Administrator",
  "tenant_id": "tenant-id",
  "is_super_admin": false,
  "permissions": [
    "read",
    "write",
    "delete",
    "manage_users",
    "manage_devices",
    "manage_dashboards",
    "manage_alerts"
  ]
}
```

### 2. Permission Strings

Standard permission strings used across the platform:

```csharp
public static class Permissions
{
    // Basic CRUD
    public const string Read = "read";
    public const string Write = "write";
    public const string Delete = "delete";

    // Management permissions
    public const string ManageUsers = "manage_users";
    public const string ManageDevices = "manage_devices";
    public const string ManageDashboards = "manage_dashboards";
    public const string ManageAlerts = "manage_alerts";
    public const string ManageSchemas = "manage_schemas";
    public const string ManageDeviceTypes = "manage_device_types";

    // System permissions
    public const string ManageSystem = "manage_system";
    public const string ManageTenants = "manage_tenants";
    public const string ViewAuditLogs = "view_audit_logs";
}
```

### 3. Authorization Attributes

Custom authorization attributes for controllers and actions:

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(params string[] permissions)
    {
        Policy = string.Join(",", permissions);
    }
}

// Usage in controllers
[ApiController]
[Route("api/[controller]")]
public class DeviceController : ControllerBase
{
    [HttpGet]
    [RequirePermission(Permissions.Read)]
    public async Task<IActionResult> GetDevices() { }

    [HttpPost]
    [RequirePermission(Permissions.ManageDevices)]
    public async Task<IActionResult> CreateDevice() { }

    [HttpDelete("{id}")]
    [RequirePermission(Permissions.ManageDevices, Permissions.Delete)]
    public async Task<IActionResult> DeleteDevice() { }
}
```

### 4. Authorization Policies

Configure authorization policies in Program.cs:

```csharp
builder.Services.AddAuthorization(options =>
{
    // Basic policies
    options.AddPolicy("Read", policy => 
        policy.RequireClaim("permissions", Permissions.Read));

    options.AddPolicy("Write", policy => 
        policy.RequireClaim("permissions", Permissions.Write));

    // Management policies
    options.AddPolicy("ManageUsers", policy => 
        policy.RequireClaim("permissions", Permissions.ManageUsers));

    options.AddPolicy("ManageDevices", policy => 
        policy.RequireClaim("permissions", Permissions.ManageDevices));

    // Role-based policies
    options.AddPolicy("Administrator", policy => 
        policy.RequireRole("Administrator"));

    options.AddPolicy("SuperAdmin", policy => 
        policy.RequireClaim("is_super_admin", "true"));
});
```

### 5. Permission Checks in Code

Check permissions programmatically:

```csharp
public class MyService
{
    private readonly IAuthorizationService _authorizationService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public async Task<bool> CanUserManageDevices()
    {
        var user = _httpContextAccessor.HttpContext.User;
        var result = await _authorizationService.AuthorizeAsync(
            user, 
            null, 
            "ManageDevices");
        
        return result.Succeeded;
    }

    public bool HasPermission(string permission)
    {
        var user = _httpContextAccessor.HttpContext.User;
        return user.HasClaim("permissions", permission);
    }
}
```

## Frontend Permission Checks

### React Component Guards

```typescript
import { useAuth } from '@/lib/auth';

export function DeviceManagement() {
  const { user, hasPermission } = useAuth();

  if (!hasPermission('manage_devices')) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Device Management</h1>
      {/* Management UI */}
    </div>
  );
}
```

### Conditional Rendering

```typescript
export function DeviceList() {
  const { hasPermission } = useAuth();

  return (
    <div>
      <h1>Devices</h1>
      <DeviceTable />
      
      {hasPermission('manage_devices') && (
        <Button onClick={createDevice}>
          Create Device
        </Button>
      )}
    </div>
  );
}
```

### Route Protection

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const user = decodeToken(token);

  const path = request.nextUrl.pathname;

  if (path.startsWith('/admin') && user.role !== 'Administrator') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/settings/users') && !user.permissions.includes('manage_users')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}
```

## Permission Hierarchy

### Role Inheritance

Roles inherit permissions from lower-privilege roles:

```
Viewer
  └─ read

Dashboard Editor
  ├─ read (inherited)
  ├─ write
  └─ manage_dashboards

Administrator
  ├─ read (inherited)
  ├─ write (inherited)
  ├─ delete
  ├─ manage_dashboards (inherited)
  ├─ manage_users
  ├─ manage_devices
  ├─ manage_alerts
  └─ manage_schemas

Super Administrator
  ├─ All Administrator permissions (inherited)
  ├─ manage_system
  ├─ manage_tenants
  └─ view_audit_logs
```

## Testing Permissions

### Unit Tests

```csharp
[Fact]
public async Task Viewer_CannotCreateDevice()
{
    // Arrange
    var user = CreateUserWithRole(UserRole.Viewer);
    var controller = new DeviceController(_deviceRepository);
    controller.ControllerContext.HttpContext = CreateHttpContext(user);

    // Act
    var result = await controller.CreateDevice(new CreateDeviceRequest());

    // Assert
    Assert.IsType<ForbidResult>(result);
}

[Fact]
public async Task Administrator_CanCreateDevice()
{
    // Arrange
    var user = CreateUserWithRole(UserRole.Administrator);
    var controller = new DeviceController(_deviceRepository);
    controller.ControllerContext.HttpContext = CreateHttpContext(user);

    // Act
    var result = await controller.CreateDevice(new CreateDeviceRequest());

    // Assert
    Assert.IsType<CreatedAtActionResult>(result);
}
```

### Integration Tests

```bash
# Test Viewer access
curl -H "Authorization: Bearer VIEWER_TOKEN" \
  http://localhost:5020/api/devices
# Expected: 200 OK

curl -X POST -H "Authorization: Bearer VIEWER_TOKEN" \
  http://localhost:5020/api/devices
# Expected: 403 Forbidden

# Test Administrator access
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5020/api/devices
# Expected: 201 Created
```

## Best Practices

### 1. Principle of Least Privilege
- Assign users the minimum role required for their job function
- Regularly review and audit user roles
- Use temporary elevated access when needed

### 2. Defense in Depth
- Check permissions at multiple layers: API Gateway, service, database
- Don't rely solely on UI hiding for security
- Validate tenant isolation at every layer

### 3. Audit Logging
- Log all permission checks (especially failures)
- Track role changes and assignments
- Monitor for privilege escalation attempts

### 4. Regular Reviews
- Quarterly access reviews for all administrators
- Automated reports of users with elevated privileges
- Remove unused accounts after 90 days of inactivity

## Troubleshooting

### User Cannot Access Feature

1. Check JWT claims:
```bash
# Decode token at jwt.io or use:
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5020/api/auth/me
```

2. Verify role assignment in Identity.API

3. Check authorization policy configuration

4. Review application logs for authorization failures

### Permission Denied After Role Update

1. User may need to log out and back in to refresh JWT token
2. Check token expiration time
3. Verify role change was saved to database

## Migration Guide

### Adding New Permissions

1. Add permission string to `Permissions` class
2. Update `GetPermissionsForRole()` method
3. Add authorization policy in Program.cs
4. Apply `[RequirePermission]` attribute to relevant endpoints
5. Update frontend permission checks
6. Add tests for new permission
7. Update this documentation

### Changing Permission Requirements

1. Review impact on existing users
2. Update authorization policies
3. Notify administrators of changes
4. Provide grace period before enforcement
5. Update documentation and training materials

## References

- [ASP.NET Core Authorization](https://docs.microsoft.com/en-us/aspnet/core/security/authorization/introduction)
- [JWT Claims](https://tools.ietf.org/html/rfc7519#section-4)
- [OWASP Access Control](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
