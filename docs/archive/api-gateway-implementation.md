# Centralized API Gateway Architecture - Implementation Summary

**Date:** December 12, 2025  
**Problem:** Port misalignment between frontend and backend services causing repeated connection errors  
**Solution:** Centralized API Gateway with Yarp reverse proxy

---

## 🎯 What Changed

### Before (Direct Service Access)
```
Frontend → Device.API (port 5293)
Frontend → Alerts.API (port 5295)
Frontend → Query.API (port 5079)
Frontend → Dashboard.API (port 5298)
... etc (9+ different ports to manage)
```

**Problems:**
- 10+ different port configurations
- Port mismatches cause ERR_CONNECTION_REFUSED errors
- Changes require updating both backend launchSettings.json AND frontend config.ts
- Inconsistent between environments

### After (API Gateway Pattern)
```
Frontend → API Gateway (port 5000) → Backend Services
                                   ├─ Device.API (5293)
                                   ├─ Alerts.API (5295)
                                   ├─ Query.API (5079)
                                   └─ ... (all other services)
```

**Benefits:**
- ✅ Single frontend connection point (port 5000)
- ✅ Backend port changes only affect appsettings.json
- ✅ No more frontend/backend port mismatches
- ✅ Production-ready architecture (standard microservices pattern)
- ✅ Easy to add load balancing, authentication, rate limiting

---

## 📝 Implementation Details

### 1. API Gateway (src/Services/ApiGateway)

**Added Yarp Reverse Proxy Package:**
```xml
<PackageReference Include="Yarp.ReverseProxy" Version="2.2.0" />
```

**Updated Program.cs:**
```csharp
// Add Yarp Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Map Reverse Proxy (before MapControllers)
app.MapReverseProxy();
```

**Added appsettings.json Configuration:**
```json
{
  "ReverseProxy": {
    "Routes": {
      "alerts-rules-route": {
        "ClusterId": "alerts-cluster",
        "Match": { "Path": "/api/alert-rules/{**catch-all}" }
      }
      // ... (14 routes total)
    },
    "Clusters": {
      "alerts-cluster": {
        "Destinations": {
          "alerts-api": { "Address": "http://localhost:5295" }
        }
      }
      // ... (9 clusters total)
    }
  }
}
```

### 2. Frontend (src/Web/sensormine-web)

**Updated src/lib/api/config.ts:**
```typescript
// ALL services now default to API Gateway
const gatewayUrl = apiConfig.baseUrl; // http://localhost:5000

export const serviceUrls = {
  device: process.env.NEXT_PUBLIC_DEVICE_API_URL || gatewayUrl,
  alerts: process.env.NEXT_PUBLIC_ALERTS_API_URL || gatewayUrl,
  query: process.env.NEXT_PUBLIC_QUERY_API_URL || gatewayUrl,
  // ... all services use gateway by default
};
```

---

## 🚀 How to Use

### Normal Development (Recommended)
```powershell
# 1. Start API Gateway
cd src/Services/ApiGateway
dotnet run  # Runs on port 5000

# 2. Start backend services
cd src/Services/Alerts.API
dotnet run  # Runs on port 5295

# 3. Start frontend
cd src/Web/sensormine-web
npm run dev  # Connects to gateway on port 5000
```

**Frontend makes requests:**
```
http://localhost:5000/api/alert-rules
http://localhost:5000/api/devices
http://localhost:5000/api/query/telemetry
```

**API Gateway routes to:**
```
http://localhost:5295/api/alert-rules  (Alerts.API)
http://localhost:5293/api/devices      (Device.API)
http://localhost:5079/api/query/telemetry (Query.API)
```

### Debug Individual Services (Optional)
If you need to bypass the gateway for debugging:

```powershell
# Create .env.local in frontend
NEXT_PUBLIC_ALERTS_API_URL=http://localhost:5295

# Frontend now connects directly to Alerts.API
```

---

## 🎯 Port Configuration - Single Source of Truth

**Only change ports in ONE place:** `src/Services/ApiGateway/appsettings.json`

```json
{
  "Clusters": {
    "alerts-cluster": {
      "Destinations": {
        "alerts-api": {
          "Address": "http://localhost:5295"  ← Change here only
        }
      }
    }
  }
}
```

Frontend automatically uses the gateway, so no changes needed!

---

## 📋 Routes Configured

| Frontend Path | Gateway Route | Backend Service | Port |
|--------------|---------------|-----------------|------|
| `/api/devices/*` | device-cluster | Device.API | 5293 |
| `/api/devicetype/*` | device-cluster | Device.API | 5293 |
| `/api/schemas/*` | schema-cluster | SchemaRegistry.API | 5021 |
| `/api/query/*` | query-cluster | Query.API | 5079 |
| `/api/widgetdata/*` | query-cluster | Query.API | 5079 |
| `/api/alert-rules/*` | alerts-cluster | Alerts.API | 5295 |
| `/api/alert-instances/*` | alerts-cluster | Alerts.API | 5295 |
| `/api/preferences/*` | preferences-cluster | Preferences.API | 5296 |
| `/api/dashboards/*` | dashboard-cluster | Dashboard.API | 5298 |
| `/api/assets/*` | digitaltwin-cluster | DigitalTwin.API | 5297 |
| `/api/simulation/*` | simulation-cluster | Simulation.API | 5200 |
| `/api/identity/*` | identity-cluster | Identity.API | 5179 |
| `/api/tenants/*` | identity-cluster | Identity.API | 5179 |
| `/api/users/*` | identity-cluster | Identity.API | 5179 |

---

## 🔧 Troubleshooting

### Frontend shows ERR_CONNECTION_REFUSED
```powershell
# Check if API Gateway is running
Get-NetTCPConnection -LocalPort 5000 -State Listen

# If not running, start it
cd src/Services/ApiGateway
dotnet run
```

### API Gateway shows 503 Service Unavailable
```powershell
# Backend service is not running
# Start the specific service (e.g., Alerts.API)
cd src/Services/Alerts.API
dotnet run
```

### Check Gateway Routing Logs
```powershell
# API Gateway logs show routing decisions
info: Yarp.ReverseProxy.Forwarder.HttpForwarder[9]
      Proxying to http://localhost:5295/api/alert-rules
```

---

## 🎓 Benefits for Future Development

1. **Add New Service:** Just add route in appsettings.json, no frontend changes
2. **Change Ports:** Update appsettings.json only
3. **Load Balancing:** Add multiple destinations to cluster
4. **Authentication:** Add middleware to gateway, applies to all services
5. **Rate Limiting:** Centralized in gateway
6. **Monitoring:** Single point to track all API traffic

---

## ✅ Testing the Solution

```powershell
# 1. Restore packages
cd src/Services/ApiGateway
dotnet restore

# 2. Build gateway
dotnet build

# 3. Run gateway
dotnet run

# 4. In browser/Postman, test routing
# Should return alert rules from Alerts.API
curl http://localhost:5000/api/alert-rules

# 5. Start frontend and verify no connection errors
cd src/Web/sensormine-web
npm run dev
```

---

**Result:** No more port misalignment! Frontend always uses port 5000, gateway handles routing to correct backend services.
