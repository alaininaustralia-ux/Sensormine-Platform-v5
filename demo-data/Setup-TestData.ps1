# Setup Test Data - Schemas, Device Types, and Devices
# This script creates a complete test dataset with proper linkages

$ErrorActionPreference = "Stop"

Write-Host "🗑️  Cleaning up existing test data..." -ForegroundColor Yellow

# Clean up existing data
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
DELETE FROM devices WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM device_types WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM schemas WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM schema_versions WHERE schema_id IN (SELECT id FROM schemas WHERE tenant_id = '00000000-0000-0000-0000-000000000001');
"

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Creating 10 schemas..." -ForegroundColor Cyan

# Schema 1: Temperature Sensor (Simple)
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Temperature Sensor Schema',
    'Simple temperature monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 85, \"unit\": \"°C\" },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" }
        },
        \"required\": [\"temperature\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 2: Humidity Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Humidity Sensor Schema',
    'Humidity and temperature monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 85, \"unit\": \"°C\" },
            \"humidity\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%RH\" },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" }
        },
        \"required\": [\"temperature\", \"humidity\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 3: Pressure Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Pressure Sensor Schema',
    'Atmospheric pressure monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"pressure\": { \"type\": \"number\", \"minimum\": 800, \"maximum\": 1100, \"unit\": \"hPa\" },
            \"temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 85, \"unit\": \"°C\" },
            \"altitude\": { \"type\": \"number\", \"minimum\": -500, \"maximum\": 9000, \"unit\": \"m\" }
        },
        \"required\": [\"pressure\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 4: Door/Window Contact Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Door Window Contact Schema',
    'Door and window open/close detection',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"status\": { \"type\": \"string\", \"enum\": [\"open\", \"closed\"] },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" },
            \"signal_strength\": { \"type\": \"number\", \"minimum\": -120, \"maximum\": 0, \"unit\": \"dBm\" }
        },
        \"required\": [\"status\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 5: Leak Detector (Simple)
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Leak Detector Schema',
    'Water leak detection',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000005',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"leak_detected\": { \"type\": \"boolean\" },
            \"water_present\": { \"type\": \"boolean\" },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" }
        },
        \"required\": [\"leak_detected\", \"water_present\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 6: Flood Sensor (Comprehensive with GPS, Float Switch, Temp, Water Height)
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Flood Monitoring System Schema',
    'Comprehensive flood detection with GPS, float switch, temperature, and water level',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000006',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"location\": {
                \"type\": \"object\",
                \"properties\": {
                    \"latitude\": { \"type\": \"number\", \"minimum\": -90, \"maximum\": 90 },
                    \"longitude\": { \"type\": \"number\", \"minimum\": -180, \"maximum\": 180 },
                    \"altitude\": { \"type\": \"number\", \"unit\": \"m\" }
                },
                \"required\": [\"latitude\", \"longitude\"]
            },
            \"water_height\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 500, \"unit\": \"cm\" },
            \"float_switch\": { \"type\": \"boolean\" },
            \"water_temperature\": { \"type\": \"number\", \"minimum\": -10, \"maximum\": 50, \"unit\": \"°C\" },
            \"ambient_temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 85, \"unit\": \"°C\" },
            \"flood_alert\": { \"type\": \"boolean\" },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" },
            \"signal_strength\": { \"type\": \"number\", \"minimum\": -120, \"maximum\": 0, \"unit\": \"dBm\" }
        },
        \"required\": [\"location\", \"water_height\", \"float_switch\", \"water_temperature\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 7: Multi-Sensor Environmental Station
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'Environmental Station Schema',
    'Comprehensive environmental monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000007',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 85, \"unit\": \"°C\" },
            \"humidity\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%RH\" },
            \"pressure\": { \"type\": \"number\", \"minimum\": 800, \"maximum\": 1100, \"unit\": \"hPa\" },
            \"light_level\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 200000, \"unit\": \"lux\" },
            \"uv_index\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 15 },
            \"air_quality_index\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 500 }
        },
        \"required\": [\"temperature\", \"humidity\", \"pressure\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 8: Motion Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'Motion Sensor Schema',
    'PIR motion detection',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000008',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"motion_detected\": { \"type\": \"boolean\" },
            \"occupancy\": { \"type\": \"boolean\" },
            \"light_level\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1000, \"unit\": \"lux\" },
            \"battery\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" }
        },
        \"required\": [\"motion_detected\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 9: Vibration Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'Vibration Sensor Schema',
    'Industrial vibration monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000009',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"vibration_x\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"mm/s\" },
            \"vibration_y\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"mm/s\" },
            \"vibration_z\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"mm/s\" },
            \"temperature\": { \"type\": \"number\", \"minimum\": -40, \"maximum\": 150, \"unit\": \"°C\" },
            \"frequency\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 10000, \"unit\": \"Hz\" }
        },
        \"required\": [\"vibration_x\", \"vibration_y\", \"vibration_z\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

# Schema 10: Water Level Sensor (Tank/Reservoir)
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO schemas (id, tenant_id, name, description, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Water Level Sensor Schema',
    'Tank and reservoir water level monitoring',
    'Active',
    NOW(),
    NOW()
);

INSERT INTO schema_versions (id, schema_id, version, json_schema, change_log, is_active, created_at, created_by)
VALUES (
    '11000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000010',
    '1.0.0',
    '{
        \"type\": \"object\",
        \"properties\": {
            \"water_level\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 100, \"unit\": \"%\" },
            \"water_height\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1000, \"unit\": \"cm\" },
            \"water_temperature\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 50, \"unit\": \"°C\" },
            \"flow_rate\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1000, \"unit\": \"L/min\" },
            \"pump_status\": { \"type\": \"string\", \"enum\": [\"on\", \"off\", \"auto\"] }
        },
        \"required\": [\"water_level\", \"water_height\"]
    }',
    'Initial version',
    true,
    NOW(),
    'system'
);
"

Write-Host "✅ Created 10 schemas" -ForegroundColor Green
Write-Host ""
Write-Host "🏭 Creating device types..." -ForegroundColor Cyan

# Device Type 1: Temperature Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO device_types (id, tenant_id, name, description, manufacturer, model, schema_id, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Temperature Sensor - TS100',
    'Wireless temperature sensor',
    'SensorCorp',
    'TS-100',
    '10000000-0000-0000-0000-000000000001',
    NOW(),
    NOW()
);
"

# Device Type 2: Humidity Sensor
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO device_types (id, tenant_id, name, description, manufacturer, model, schema_id, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Humidity Sensor - HS200',
    'Temperature and humidity sensor',
    'SensorCorp',
    'HS-200',
    '10000000-0000-0000-0000-000000000002',
    NOW(),
    NOW()
);
"

# Device Type 3: Door/Window Contact
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO device_types (id, tenant_id, name, description, manufacturer, model, schema_id, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'DoorWindow-MC38',
    'Magnetic contact sensor for doors and windows',
    'HomeSafe',
    'MC-38',
    '10000000-0000-0000-0000-000000000004',
    NOW(),
    NOW()
);
"

# Device Type 4: Leak Detector
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO device_types (id, tenant_id, name, description, manufacturer, model, schema_id, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'LeakDetector-WLD01',
    'Water leak detection sensor',
    'AquaGuard',
    'WLD-01',
    '10000000-0000-0000-0000-000000000005',
    NOW(),
    NOW()
);
"

# Device Type 5: Flood Monitoring System
docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
INSERT INTO device_types (id, tenant_id, name, description, manufacturer, model, schema_id, created_at, updated_at)
VALUES (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'FloodMonitor-FM500',
    'Comprehensive flood monitoring with GPS and multiple sensors',
    'FloodSafe',
    'FM-500',
    '10000000-0000-0000-0000-000000000006',
    NOW(),
    NOW()
);
"

Write-Host "✅ Created device types" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Creating test devices..." -ForegroundColor Cyan

# Create 15 test devices across different types
$devices = @(
    @{ Type = '20000000-0000-0000-0000-000000000001'; TypeName = 'Temperature Sensor - TS100'; DeviceId = 'DEV-0001'; Name = 'Temperature-Office-001'; Serial = 'SN-100001'; Lat = '51.0447'; Lon = '-114.0719' },
    @{ Type = '20000000-0000-0000-0000-000000000001'; TypeName = 'Temperature Sensor - TS100'; DeviceId = 'DEV-0002'; Name = 'Temperature-Warehouse-001'; Serial = 'SN-100002'; Lat = '51.0500'; Lon = '-114.0800' },
    @{ Type = '20000000-0000-0000-0000-000000000002'; TypeName = 'Humidity Sensor - HS200'; DeviceId = 'DEV-0003'; Name = 'Humidity-Datacenter-001'; Serial = 'SN-200001'; Lat = '51.0447'; Lon = '-114.0719' },
    @{ Type = '20000000-0000-0000-0000-000000000002'; TypeName = 'Humidity Sensor - HS200'; DeviceId = 'DEV-0004'; Name = 'Humidity-Storage-001'; Serial = 'SN-200002'; Lat = '51.0500'; Lon = '-114.0800' },
    @{ Type = '20000000-0000-0000-0000-000000000003'; TypeName = 'DoorWindow-MC38'; DeviceId = 'DEV-0058'; Name = 'DoorWindow-MC38 - DEV-0058'; Serial = 'SN-117370'; Lat = '45.5017'; Lon = '-73.5673' },
    @{ Type = '20000000-0000-0000-0000-000000000003'; TypeName = 'DoorWindow-MC38'; DeviceId = 'DEV-0060'; Name = 'DoorWindow-MC38 - DEV-0060'; Serial = 'SN-898552'; Lat = '49.2827'; Lon = '-123.1207' },
    @{ Type = '20000000-0000-0000-0000-000000000003'; TypeName = 'DoorWindow-MC38'; DeviceId = 'DEV-0062'; Name = 'DoorWindow-MC38 - DEV-0062'; Serial = 'SN-368229'; Lat = '51.0447'; Lon = '-114.0719' },
    @{ Type = '20000000-0000-0000-0000-000000000004'; TypeName = 'LeakDetector-WLD01'; DeviceId = 'DEV-0057'; Name = 'LeakDetector-WLD01 - DEV-0057'; Serial = 'SN-576543'; Lat = '51.0447'; Lon = '-114.0719' },
    @{ Type = '20000000-0000-0000-0000-000000000004'; TypeName = 'LeakDetector-WLD01'; DeviceId = 'DEV-0059'; Name = 'LeakDetector-WLD01 - DEV-0059'; Serial = 'SN-187075'; Lat = '53.5461'; Lon = '-113.4938' },
    @{ Type = '20000000-0000-0000-0000-000000000005'; TypeName = 'FloodMonitor-FM500'; DeviceId = 'DEV-1001'; Name = 'FloodMonitor-River-001'; Serial = 'SN-FM-001'; Lat = '51.0447'; Lon = '-114.0719' },
    @{ Type = '20000000-0000-0000-0000-000000000005'; TypeName = 'FloodMonitor-FM500'; DeviceId = 'DEV-1002'; Name = 'FloodMonitor-Creek-002'; Serial = 'SN-FM-002'; Lat = '51.0500'; Lon = '-114.0800' },
    @{ Type = '20000000-0000-0000-0000-000000000005'; TypeName = 'FloodMonitor-FM500'; DeviceId = 'DEV-1003'; Name = 'FloodMonitor-Lake-003'; Serial = 'SN-FM-003'; Lat = '51.0600'; Lon = '-114.0900' }
)

foreach ($device in $devices) {
    docker exec sensormine-timescaledb psql -U sensormine -d sensormine_metadata -c "
    INSERT INTO devices (id, tenant_id, device_id, name, device_type_id, serial_number, status, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001',
        '$($device.DeviceId)',
        '$($device.Name)',
        '$($device.Type)',
        '$($device.Serial)',
        'Active',
        NOW(),
        NOW()
    );
    "
    Write-Host "  ✓ Created device: $($device.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Created $($devices.Count) test devices" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - 10 schemas created" -ForegroundColor White
Write-Host "  - 5 device types created" -ForegroundColor White
Write-Host "  - $($devices.Count) devices created" -ForegroundColor White
Write-Host "  - All devices linked to schemas via device types" -ForegroundColor White
Write-Host ""
Write-Host "✨ Test data setup complete!" -ForegroundColor Green
