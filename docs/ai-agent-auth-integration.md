# AI Agent Auth Integration - Update Summary

## ✅ Changes Made

### 1. **Frontend Routes Through API Gateway**
- Changed `NEXT_PUBLIC_API_BASE_URL` to use port 5000 (API Gateway)
- MCP requests now go through `/api/mcp/*` route
- Removed direct MCP server connection

### 2. **JWT Token Integration**
- Updated AI Agent page to retrieve JWT token from localStorage
- Token passed to `AiAgentService` constructor
- MCP client includes token in `Authorization: Bearer` header

### 3. **Tenant ID from Auth Context**
- AI Agent page now extracts tenant ID (ready for useAuth() integration)
- Placeholder for production: `const { user, token } = useAuth();`
- For now, uses default tenant + localStorage token

### 4. **API Gateway MCP Route**
Added to `ApiGateway/appsettings.json`:
```json
{
  "mcp-route": {
    "ClusterId": "mcp-cluster",
    "Match": {
      "Path": "/api/mcp/{**catch-all}"
    }
  }
}
```

Added cluster:
```json
{
  "mcp-cluster": {
    "Destinations": {
      "mcp-server": {
        "Address": "http://localhost:5400"
      }
    }
  }
}
```

### 5. **CORS Configuration**
Updated MCP Server CORS policy:
```csharp
policy.WithOrigins(
    "http://localhost:3020",  // Frontend
    "http://localhost:3021",  // Device Simulator  
    "http://localhost:5000",  // API Gateway
    "http://localhost:5134"   // API Gateway alt
)
.AllowAnyHeader()
.AllowAnyMethod()
.AllowCredentials();
```

---

## 🔄 Request Flow

**Before:**
```
Frontend (3020) → MCP Server (5400) → Device.API, Query.API, etc.
```

**After:**
```
Frontend (3020) → API Gateway (5000) → MCP Server (5400) → Device.API, Query.API, etc.
                   [JWT validation]      [Tenant context]
```

---

## 🚀 Testing

### 1. Start Services
```powershell
# Start API Gateway
cd src/Services/ApiGateway
dotnet run

# Start MCP Server
cd src/Services/Sensormine.MCP.Server
dotnet run

# Start required APIs
cd src/Services/Device.API && dotnet run
cd src/Services/Query.API && dotnet run
cd src/Services/DigitalTwin.API && dotnet run

# Start Frontend
cd src/Web/sensormine-web
npm run dev
```

### 2. Test MCP Through API Gateway
```powershell
# List tools via API Gateway
$response = Invoke-RestMethod `
    -Uri "http://localhost:5000/api/mcp" `
    -Method POST `
    -Headers @{
        "X-Tenant-Id" = "00000000-0000-0000-0000-000000000001"
        "Content-Type" = "application/json"
    } `
    -Body (@{
        jsonrpc = "2.0"
        id = "test-1"
        method = "tools/list"
    } | ConvertTo-Json)

$response.result.tools | Select-Object name, description
```

### 3. Test AI Agent
1. Navigate to http://localhost:3020/ai-agent
2. Try query: "Show me temperature data for the last 24 hours"
3. Check browser DevTools Network tab:
   - Request should go to `http://localhost:5000/api/mcp`
   - Should include `X-Tenant-Id` header
   - Should include `Authorization: Bearer` header (if token in localStorage)

---

## 🔐 Production Auth Integration

When ready for full auth:

### Update AI Agent Page
```typescript
import { useAuth } from '@/lib/auth';

export default function AiAgentPage() {
  const { user, token } = useAuth();
  
  useEffect(() => {
    if (user && token) {
      agentService.current = new AiAgentService(user.tenantId, token);
    }
  }, [user, token]);
```

### Redirect to Login if Not Authenticated
```typescript
if (!user) {
  router.push('/login');
  return null;
}
```

---

## 📝 Next Steps

- [ ] Implement full JWT authentication in frontend
- [ ] Add token refresh logic
- [ ] Add authorization checks (roles/permissions)
- [ ] Add rate limiting per tenant
- [ ] Add audit logging in API Gateway
- [ ] Add monitoring/telemetry for MCP requests

---

Last Updated: December 12, 2025
