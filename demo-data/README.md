# Demo Data Generator

This directory contains scripts to generate demo data for the Sensormine Platform.

## Generate-DemoDevices.ps1

Generates comprehensive demo data including:
- **15 Device Types** with unique schemas tailored to each sensor category
- **100 Devices** distributed logically across the device types
- **15 JSON Schemas** defining data packet structures for each device type

### Device Types Created

1. **TH-Sensor-DHT22** - Temperature & Humidity Sensor (MQTT)
   - Measures temperature, humidity, dew point
   - Schema: Temperature-Humidity-Schema

2. **Pressure-BMP280** - Barometric Pressure Sensor (MQTT)
   - Measures atmospheric pressure, altitude
   - Schema: Pressure-Sensor-Schema

3. **FlowMeter-YFS201** - Water Flow Meter (HTTP)
   - Measures flow rate, total volume, velocity
   - Schema: Flow-Meter-Schema

4. **Vibration-ADXL345** - 3-Axis Vibration Sensor (MQTT)
   - Measures acceleration on X/Y/Z axes, frequency
   - Schema: Vibration-Sensor-Schema

5. **EnergyMeter-PZEM004T** - AC Energy Monitor (Modbus RTU)
   - Measures voltage, current, power, energy consumption
   - Schema: Energy-Meter-Schema

6. **WaterQuality-Atlas** - Water Quality Sensor (HTTP)
   - Measures pH, turbidity, dissolved oxygen, conductivity
   - Schema: Water-Quality-Schema

7. **AirQuality-PMS7003** - Air Quality Sensor (MQTT)
   - Measures PM2.5, PM10, CO2, CO, NO2, VOC
   - Schema: Air-Quality-Schema

8. **Motion-PIR-HC-SR501** - PIR Motion Sensor (MQTT)
   - Detects motion, occupancy, people count
   - Schema: Motion-Sensor-Schema

9. **GPS-NEO6M** - GPS Tracker Module (HTTP)
   - Tracks latitude, longitude, altitude, speed, heading
   - Schema: GPS-Tracker-Schema

10. **Level-Ultrasonic-JSN-SR04T** - Ultrasonic Level Sensor (MQTT)
    - Measures level percentage, distance, volume
    - Schema: Level-Sensor-Schema

11. **LeakDetector-WLD01** - Water Leak Detection Sensor (MQTT)
    - Detects leaks, moisture levels
    - Schema: Leak-Detector-Schema

12. **DoorWindow-MC38** - Magnetic Contact Sensor (MQTT)
    - Detects door/window open state, tamper
    - Schema: Door-Window-Schema

13. **SoundLevel-MAX9814** - Sound Level Meter (MQTT)
    - Measures sound level in dB, peak level
    - Schema: Sound-Level-Schema

14. **Light-BH1750** - Digital Light Sensor (MQTT)
    - Measures illuminance (lux), RGB, infrared
    - Schema: Light-Sensor-Schema

15. **SmartMeter-Utility** - Multi-Utility Smart Meter (Modbus TCP)
    - Measures electricity, gas, or water consumption
    - Schema: Smart-Meter-Schema

### Device Distribution

The 100 devices are distributed across the 15 device types with realistic quantities:
- Temperature & Humidity: 8 devices
- Pressure: 7 devices
- Flow Meters: 6 devices
- Vibration: 8 devices
- Energy Meters: 7 devices
- Water Quality: 6 devices
- Air Quality: 7 devices
- Motion: 8 devices
- GPS Trackers: 5 devices
- Level: 7 devices
- Leak Detectors: 6 devices
- Door/Window: 8 devices
- Sound Level: 7 devices
- Light: 6 devices
- Smart Meters: 6 devices

### Features

Each device includes:
- **Unique Device ID**: DEV-0001 to DEV-0100
- **Serial Number**: Randomly generated
- **Location**: Distributed across 5 Canadian cities (Vancouver, Toronto, Calgary, Montreal, Edmonton)
- **Metadata**:
  - Building assignment (Building-A, Building-B, Building-C, Warehouse-1, Plant-North)
  - Floor location (Ground, Floor-1, Floor-2, Floor-3, Basement)
  - Zone assignment (Zone-A, Zone-B, Zone-C, Zone-D)
  - Installation date
  - Manufacturer and model information
- **Status**: Mostly Active, with some Inactive for realism

### Usage

#### Prerequisites

Ensure the following services are running:
```powershell
# Start infrastructure
docker-compose up -d

# Start Device API (port 5293)
cd src/Services/Device.API
dotnet run

# Start Schema Registry API (port 5021)
cd src/Services/SchemaRegistry.API
dotnet run
```

**Note:** The Schema Registry API uses tenant ID `"default-tenant"` while Device API uses `"00000000-0000-0000-0000-000000000001"`. The script handles this automatically.

#### Run the Script

```powershell
# From the repository root
.\demo-data\Generate-DemoDevices.ps1

# With custom parameters
.\demo-data\Generate-DemoDevices.ps1 `
    -DeviceApiUrl "http://localhost:5293" `
    -SchemaApiUrl "http://localhost:5021" `
    -DeviceTenantId "00000000-0000-0000-0000-000000000001" `
    -SchemaTenantId "default-tenant"
```

#### Parameters

- **DeviceApiUrl** (optional): URL of the Device API (default: http://localhost:5293)
- **SchemaApiUrl** (optional): URL of the Schema Registry API (default: http://localhost:5021)
- **DeviceTenantId** (optional): Tenant ID for Device API (default: 00000000-0000-0000-0000-000000000001)
- **SchemaTenantId** (optional): Tenant ID for Schema API (default: default-tenant)

### Expected Output

```
🚀 Sensormine Platform - Demo Data Generator
============================================================

Configuration:
  Device API: http://localhost:5293 (Tenant: 00000000-0000-0000-0000-000000000001)
  Schema API: http://localhost:5021 (Tenant: default-tenant)

📋 Step 1: Creating Schemas
------------------------------------------------------------
✓ Created schema: Temperature-Humidity-Schema
✓ Created schema: Pressure-Sensor-Schema
✓ Created schema: Flow-Meter-Schema
...

📋 Step 2: Creating Device Types
------------------------------------------------------------
✓ Created device type: TH-Sensor-DHT22
✓ Created device type: Pressure-BMP280
✓ Created device type: FlowMeter-YFS201
...

📋 Step 3: Creating 100 Devices
------------------------------------------------------------
  Created 10 devices...
  Created 20 devices...
  ...
  Created 100 devices...

============================================================
✅ Demo Data Generation Complete!

Summary:
  • Schemas created: 15
  • Device types created: 15
  • Devices created: 100

🎉 You can now view your devices at http://localhost:3020/settings/digital-twin
```

### Viewing the Data

After running the script:

1. **View Devices**: http://localhost:3020/settings/digital-twin
2. **View Device Types**: http://localhost:3020/settings/device-types
3. **View Schemas**: http://localhost:3020/settings/schemas

### Protocols Used

The demo includes devices using multiple protocols:
- **MQTT**: 11 device types (realistic for IoT sensors)
- **HTTP**: 3 device types (REST API based devices)
- **Modbus RTU**: 1 device type (industrial energy meter)
- **Modbus TCP**: 1 device type (smart meter)

### Cleanup

To remove all demo data:

```sql
-- Connect to the database
docker exec -it sensormine-timescaledb psql -U sensormine -d sensormine_timeseries

-- Delete devices
DELETE FROM devices WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Delete device types
DELETE FROM device_types WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- Delete schemas (if using separate schema database)
-- Connect to schema database and delete as needed
```

Or simply drop and recreate the database tables using the initialization scripts.

## Notes

- The script is idempotent-safe but will fail if device types with the same names already exist
- Devices are assigned realistic metadata for building, floor, and zone locations
- All schemas follow JSON Schema Draft 7 specification
- Each schema includes required fields and validation rules (min/max, enums, formats)
- Device IDs are sequential (DEV-0001 to DEV-0100) for easy identification
- Serial numbers are randomly generated for realism

## Troubleshooting

**Issue**: Schema creation fails with connection refused
- **Solution**: Ensure Schema Registry API is running on port 5021
- Run: `cd src/Services/SchemaRegistry.API && dotnet run`

**Issue**: Device Type creation fails with "already exists"
- **Solution**: Device types with these names already exist. Either delete them or modify the script to use different names

**Issue**: Device creation fails
- **Solution**: Ensure Device API is running on port 5293 and device types were created successfully

**Issue**: Connection refused errors
- **Solution**: Verify the API URLs are correct and services are running
