# Lessons Learned: Query API Implementation & Bug Fixes

**Date**: December 7, 2025  
**Context**: Query API Tier 2 Enhancement + Full Stack Integration  
**Team**: Sensormine Platform Development

---

## Executive Summary

During the implementation of Query API Tier 2 enhancements and full-stack dashboard integration, we discovered and resolved three critical bugs that prevented data from flowing from TimescaleDB to the frontend dashboard widgets. This document captures the technical issues, root causes, and lessons learned to prevent similar issues in future development.

---

## Bug #1: Filter Key Naming Convention Mismatch

### Symptom
- Backend API returning zeros or empty arrays despite database containing 5,322 telemetry records
- No error messages, just silent failures
- API endpoints responding with 200 OK but data was empty

### Root Cause
**Inconsistent naming convention between API layer and repository layer:**

- **Controllers** (API Layer):
  ```csharp
  // Query.API/Controllers/KpiDataController.cs (line 172)
  query.Filters["metric_name"] = field;  // ❌ WRONG
  ```

- **Repository** (Data Layer):
  ```csharp
  // Sensormine.Storage/TimeSeries/TimescaleDbRepository.cs
  // Expected filter key: "_field" not "metric_name"
  ```

**What Happened:**
- Controllers passed `filters["metric_name"]` to repository
- Repository looked for `filters["_field"]` 
- Filter was ignored, query returned no results
- No validation or error thrown for missing/wrong filter keys

### Solution
**Changed all controllers to use consistent `"_field"` key:**

```csharp
// KpiDataController.cs (line 172)
query.Filters["_field"] = field;  // ✅ CORRECT

// WidgetDataController.cs (line 222)
["_field"] = field  // ✅ CORRECT
```

### Lessons Learned

1. **Establish Clear Naming Conventions**:
   - Document filter key names in repository interface comments
   - Use constants for filter keys instead of magic strings
   - Example improvement:
     ```csharp
     public static class FilterKeys {
         public const string Field = "_field";
         public const string DeviceId = "device_id";
         public const string TenantId = "tenant_id";
     }
     ```

2. **Validate Filter Keys**:
   - Repository should throw exception for unrecognized filter keys
   - Add validation layer that checks filter dictionary against allowed keys
   - Log warnings when optional filters are missing

3. **Better Abstractions**:
   - Consider using strongly-typed query builders instead of `Dictionary<string, object>`
   - Example:
     ```csharp
     public class TimeSeriesQuery {
         public string Field { get; set; }  // Type-safe property
         public string DeviceId { get; set; }
         // Eliminates string key mismatches
     }
     ```

4. **Integration Testing**:
   - Add end-to-end tests that verify data flows from database to API response
   - Don't just test that API returns 200 OK - verify actual data content
   - Example test:
     ```csharp
     [Fact]
     public async Task GetKpiData_WithValidDevice_ReturnsActualValue() {
         // Arrange: Insert known data into TimescaleDB
         // Act: Call API endpoint
         // Assert: Verify response contains expected value (not zero)
     }
     ```

---

## Bug #2: PostgreSQL Type Casting Error

### Symptom
```
InvalidCastException: Reading as 'System.Decimal' is not supported 
for fields having DataTypeName 'double precision'
```

**Stack Trace:**
```
at TimescaleDbRepository.cs:line 136
   in System.Data.Common.DbDataReader.GetDecimal(Int32 ordinal)
```

### Root Cause
**Database schema mismatch with code expectations:**

- **Database** (TimescaleDB):
  ```sql
  CREATE TABLE telemetry (
      ...
      value double precision,  -- PostgreSQL type
      ...
  );
  ```

- **Code** (C# Repository):
  ```csharp
  var value = reader.GetDecimal(reader.GetOrdinal("value"));  // ❌ WRONG
  ```

**What Happened:**
- PostgreSQL stores sensor values as `double precision` (64-bit float)
- C# code tried to read as `decimal` (128-bit fixed-point)
- PostgreSQL driver (Npgsql) cannot directly cast double to decimal
- Throws InvalidCastException at runtime

### Solution
**Changed to read as double first, then cast to decimal:**

```csharp
// OLD CODE (BROKEN):
var value = reader.GetDecimal(reader.GetOrdinal("value"));

// NEW CODE (FIXED):
var doubleValue = reader.GetDouble(reader.GetOrdinal("value"));
var value = (decimal)doubleValue;
```

### Why Not Change Database Type?

**Reason 1: TimescaleDB Best Practices**
- Double precision is standard for time-series sensor data
- Better performance for aggregations (avg, sum, min, max)
- Lower storage requirements (8 bytes vs 16 bytes)

**Reason 2: Precision Considerations**
- Sensor readings don't need 128-bit decimal precision
- Temperature: 15.5°C doesn't need 28-29 digits of precision
- Double precision (15-17 significant digits) is sufficient

**Reason 3: Compatibility**
- Industry standard for IoT time-series databases
- Matches other time-series systems (InfluxDB, Prometheus)

### Lessons Learned

1. **Always Verify Database Schema**:
   - Use `\d+ table_name` in psql to see actual column types
   - Don't assume types match your mental model
   - Example check:
     ```sql
     SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_name = 'telemetry';
     ```

2. **Match C# Types to PostgreSQL Types**:
   | PostgreSQL Type | C# Reader Method | C# Type |
   |----------------|------------------|---------|
   | `integer` | `GetInt32()` | `int` |
   | `bigint` | `GetInt64()` | `long` |
   | `double precision` | `GetDouble()` | `double` |
   | `numeric(p,s)` | `GetDecimal()` | `decimal` |
   | `text` | `GetString()` | `string` |
   | `timestamp` | `GetDateTime()` | `DateTime` |

3. **Document Type Decisions**:
   - Add comments in schema files explaining type choices
   - Example:
     ```sql
     value double precision,  -- Using double for performance and compatibility
                              -- Provides 15-17 digits precision (sufficient for sensors)
     ```

4. **Avoid Implicit Conversions**:
   - Make type conversions explicit in code
   - Helps future developers understand data type handling
   - Example:
     ```csharp
     // EXPLICIT (GOOD):
     var doubleValue = reader.GetDouble(ordinal);
     var decimalValue = (decimal)doubleValue;  // Clear conversion
     
     // IMPLICIT (BAD):
     var value = reader.GetDecimal(ordinal);  // Assumes type compatibility
     ```

5. **Add Integration Tests with Real Database**:
   - Use Testcontainers to spin up PostgreSQL for tests
   - Verify code can read actual database types
   - Catches type mismatches before production

---

## Bug #3: Configuration Port Mismatch

### Symptom
- Frontend showing `ERR_CONNECTION_REFUSED` errors in browser console
- DevTools Network tab showing calls to `http://localhost:5297`
- Query API actually running on port `5079`

### Root Cause
**Stale configuration in `.env.local` file:**

```env
# .env.local (WRONG)
NEXT_PUBLIC_QUERY_API_URL=http://localhost:5297  # ❌ Dashboard API port
```

**What Happened:**
- `.env.local` file had wrong port (probably copy-pasted from Dashboard API)
- Code in `lib/config.ts` was correctly configured for 5079
- But Next.js loads environment variables at startup time only
- Frontend was using old cached value

### Solution
**Updated `.env.local` with correct port:**

```env
# .env.local (FIXED)
NEXT_PUBLIC_QUERY_API_URL=http://localhost:5079  # ✅ Query API port
```

**Then restarted Next.js dev server to pick up changes.**

### Lessons Learned

1. **Environment Variables Require Restart**:
   - Next.js only loads `.env.local` at startup
   - Changes require full restart (not just hot reload)
   - Document this prominently in HELP.md

2. **Validate Service URLs on Startup**:
   - Add startup checks to verify services are reachable
   - Example:
     ```typescript
     // lib/config.ts
     async function validateServiceUrls() {
         const services = [
             { name: 'Query API', url: config.services.queryApi },
             { name: 'Device API', url: config.services.deviceApi },
             // ...
         ];
         
         for (const service of services) {
             try {
                 await fetch(`${service.url}/health`, { method: 'HEAD' });
                 console.log(`✅ ${service.name} reachable at ${service.url}`);
             } catch {
                 console.error(`❌ ${service.name} unreachable at ${service.url}`);
             }
         }
     }
     ```

3. **Use Configuration Constants**:
   - Define all service ports in one central location
   - Example infrastructure config file:
     ```typescript
     // infrastructure/ports.ts
     export const SERVICE_PORTS = {
         DEVICE_API: 5293,
         SCHEMA_API: 5021,
         DASHBOARD_API: 5297,
         QUERY_API: 5079,
         SIMULATION_API: 5200,
     } as const;
     ```

4. **Document Service Port Mappings**:
   - Keep README or HELP.md with clear service→port table
   - Include in architecture diagrams
   - Makes it easy to spot configuration errors

5. **Better Error Messages**:
   - When API call fails, log which service and URL was called
   - Example:
     ```typescript
     try {
         const response = await fetch(url);
         if (!response.ok) throw new Error(`HTTP ${response.status}`);
     } catch (error) {
         console.error(`Failed to reach ${serviceName} at ${url}:`, error);
         throw error;
     }
     ```

---

## Architectural Improvements for Future

### 1. Repository Pattern Enhancements

**Current Issue**: Filter keys passed as `Dictionary<string, object>` with no validation

**Improvement**: Strongly-typed query objects

```csharp
// CURRENT (WEAK TYPING):
var query = new TimeSeriesQuery {
    Filters = new Dictionary<string, object> {
        ["_field"] = "temperature",  // Easy to typo
        ["device_id"] = deviceId
    }
};

// IMPROVED (STRONG TYPING):
var query = new TimeSeriesQuery {
    Field = "temperature",        // Type-safe property
    DeviceId = deviceId,
    TenantId = tenantId,
    StartTime = start,
    EndTime = end,
    Aggregation = Aggregation.Average
};
```

**Benefits**:
- Compile-time type checking
- IntelliSense support
- Impossible to use wrong filter keys
- Self-documenting code

### 2. Database Schema Validation

**Current Issue**: No validation that code types match database types

**Improvement**: Automated schema validation tests

```csharp
[Fact]
public async Task DatabaseSchema_MatchesEntityModels() {
    // Read actual database schema
    var schema = await GetDatabaseSchema("telemetry");
    
    // Assert column types match expectations
    Assert.Equal("double precision", schema["value"].DataType);
    Assert.Equal("timestamp with time zone", schema["time"].DataType);
    Assert.Equal("uuid", schema["device_id"].DataType);
}
```

### 3. API Contract Testing

**Current Issue**: No automated tests verifying API returns actual data

**Improvement**: Contract tests that verify end-to-end flow

```csharp
[Fact]
public async Task GetKpiData_IntegrationTest() {
    // Arrange: Insert known data
    await InsertTelemetryData(deviceId: "test-001", 
                              field: "temperature", 
                              value: 25.5, 
                              timestamp: DateTime.UtcNow);
    
    // Act: Call API
    var result = await client.GetAsync("/api/KpiData?deviceId=test-001&field=temperature");
    var data = await result.Content.ReadFromJsonAsync<KpiDataDto>();
    
    // Assert: Verify actual data returned
    Assert.Equal(25.5m, data.Value, precision: 2);
    Assert.NotEqual(0m, data.Value);  // Catch silent failures
}
```

### 4. Configuration Management

**Current Issue**: Service URLs scattered across multiple files

**Improvement**: Centralized configuration with validation

```typescript
// lib/config/services.ts
export const ServiceConfig = {
    devices: { url: process.env.NEXT_PUBLIC_DEVICE_API_URL, port: 5293 },
    schemas: { url: process.env.NEXT_PUBLIC_SCHEMA_API_URL, port: 5021 },
    query: { url: process.env.NEXT_PUBLIC_QUERY_API_URL, port: 5079 },
    // ...
} as const;

// Validate on startup
function validateConfig() {
    for (const [name, config] of Object.entries(ServiceConfig)) {
        if (!config.url) {
            throw new Error(`Missing environment variable for ${name} service`);
        }
        if (!config.url.includes(`:${config.port}`)) {
            console.warn(`⚠️  Port mismatch for ${name}: expected ${config.port}`);
        }
    }
}
```

---

## Action Items for Team

### Immediate (This Sprint)
- [ ] Add filter key constants to repository interfaces
- [ ] Update all controllers to use constants instead of magic strings
- [ ] Add validation for filter keys in repository layer
- [ ] Document all database column types with comments
- [ ] Add startup configuration validation to frontend

### Short-term (Next Sprint)
- [ ] Implement strongly-typed query builders
- [ ] Add integration tests for all Query API endpoints
- [ ] Create database schema validation tests
- [ ] Document all service ports in central location
- [ ] Add health check endpoints to all services

### Long-term (Future Epics)
- [ ] Migrate to OpenAPI/Swagger code generation for type-safe API clients
- [ ] Implement service mesh for better service discovery
- [ ] Add distributed tracing (OpenTelemetry)
- [ ] Create monitoring dashboard for service health

---

## Knowledge Sharing

### What Went Well
✅ TDD approach helped catch issues early in controllers  
✅ Comprehensive logging made it easy to trace issues  
✅ Modular architecture allowed fixing bugs in isolation  
✅ Good Git history made it easy to identify which commit introduced issues

### What Could Be Improved
⚠️ More integration tests with real database  
⚠️ Better documentation of repository contracts  
⚠️ Automated validation of configuration files  
⚠️ Stronger typing to catch issues at compile time

### Key Takeaways
1. **Naming conventions matter** - Establish and document them early
2. **Database types matter** - Always verify actual schema
3. **Configuration is code** - Treat it with same rigor as application code
4. **Integration tests are essential** - Unit tests alone aren't enough
5. **Explicit is better than implicit** - Make type conversions clear

---

## References

### Related Documentation
- TimescaleDB Data Types: https://docs.timescale.com/use-timescale/latest/schema-management/about-schemas/
- Npgsql Type Mapping: https://www.npgsql.org/doc/types/basic.html
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

### Internal Documents
- Architecture: `docs/architecture.md`
- Database Schema: `docs/database-architecture.md`
- API Documentation: `docs/development.md`
- Current State: `.agent/current-state.md`

---

**Document Owner**: Sensormine Platform Team  
**Last Updated**: December 7, 2025  
**Status**: ✅ Complete
