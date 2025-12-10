# Database Quick Reference Guide

**Last Updated:** December 10, 2025

---

## 🎯 The Simple Truth

**ONE container. TWO databases. Port 5452. Done.**

```
┌─────────────────────────────────────────────────┐
│  TimescaleDB Container (sensormine-timescaledb) │
│  Host Port: 5452                                │
│  ┌────────────────────────────────────────────┐ │
│  │  sensormine_metadata                       │ │
│  │  • Devices, Assets, Dashboards             │ │
│  │  • Device Types, Schemas                   │ │
│  │  • Alert Rules, Preferences                │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  sensormine_timeseries                     │ │
│  │  • Telemetry Data (hypertables)            │ │
│  │  • Events, Metrics                         │ │
│  │  • Time-series queries                     │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  sensormine_identity                       │ │
│  │  • Users, Tenants                          │ │
│  │  • User Invitations                        │ │
│  │  • Authentication                          │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 📝 Connection Strings (Copy & Paste)

### Metadata Database (Operational Data)
```
Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123
```

### Timeseries Database (Telemetry Data)
```
Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123
```

### Identity Database (Users & Tenants)
```
Host=localhost;Port=5452;Database=sensormine_identity;Username=sensormine;Password=sensormine123
```

---

## 🔧 Service Configuration

| Service | Database | appsettings.json |
|---------|----------|------------------|
| **Device.API** | `sensormine_metadata` | `"DefaultConnection": "Host=localhost;Port=5452;Database=sensormine_metadata;Username=sensormine;Password=sensormine123"` |
| **Dashboard.API** | `sensormine_metadata` | Same as Device.API |
| **DigitalTwin.API** | `sensormine_metadata` | Same as Device.API |
| **Alerts.API** | `sensormine_metadata` | Same as Device.API |
| **SchemaRegistry.API** | `sensormine_metadata` | Same as Device.API |
| **Preferences.API** | `sensormine_metadata` | Same as Device.API |
| **Query.API** | `sensormine_timeseries` | `"DefaultConnection": "Host=localhost;Port=5452;Database=sensormine_timeseries;Username=sensormine;Password=sensormine123"` |
| **Ingestion.Service** | `sensormine_timeseries` | Same as Query.API |
| **StreamProcessing.Service** | `sensormine_timeseries` | Same as Query.API |
| **Identity.API** | `sensormine_identity` | `"DefaultConnection": "Host=localhost;Port=5452;Database=sensormine_identity;Username=sensormine;Password=sensormine123"` |

---

## ✅ Verification Commands

### Check databases exist:
```powershell
docker exec sensormine-timescaledb psql -U sensormine -d postgres -c "\l"
```

### List tables in metadata database:
```powershell
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "\dt"
```

### List tables in timeseries database:
```powershell
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_timeseries -c "\dt"
```

### Check specific table structure:
```powershell
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "\d field_mappings"
```

---

## 🚫 What NOT to Do

❌ **Don't use Port 5433** - That's the old PostgreSQL container (deprecated)  
❌ **Don't use database `sensormine`** - Doesn't exist in current architecture  
❌ **Don't use username `postgres`** - Use `sensormine` instead  
❌ **Don't mix up the databases** - Metadata goes to `sensormine_metadata`, telemetry goes to `sensormine_timeseries`

---

## 📚 Related Documentation

- **[database-separation.md](./database-separation.md)** - Full architecture details
- **[local-infrastructure.md](./local-infrastructure.md)** - Complete infrastructure guide
- **[database-configuration-analysis.md](./database-configuration-analysis.md)** - Historical analysis (outdated)

---

## 🆘 Troubleshooting

### "relation does not exist" error
**Problem:** Service connecting to wrong database  
**Solution:** Check connection string uses port `5452` and correct database name

### "password authentication failed"
**Problem:** Using wrong credentials  
**Solution:** Use `sensormine` / `sensormine123` (not `postgres` / `postgres`)

### "database does not exist"
**Problem:** Trying to connect to `sensormine` database  
**Solution:** Use `sensormine_metadata` or `sensormine_timeseries`

### "connection refused on port 5433"
**Problem:** Trying to use old PostgreSQL container  
**Solution:** Change to port `5452` (TimescaleDB container)

---

**Remember:** When in doubt, **Port 5452**, **Database sensormine_metadata** or **sensormine_timeseries**, **User sensormine**
