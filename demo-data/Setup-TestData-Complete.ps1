# Setup Test Data with 10 Schemas and Linked Device Types and Devices
# Uses correct API endpoints from docs/service-ports.md

$ErrorActionPreference = "Stop"

# API Endpoints
$SchemaApiUrl = "http://localhost:5021/api/schemas"
$DeviceTypeApiUrl = "http://localhost:5293/api/DeviceType"  # Changed from device-types
$DeviceApiUrl = "http://localhost:5293/api/Device"
$TenantId = "00000000-0000-0000-0000-000000000001"

# Helper function to create schema
function Create-Schema {
    param (
        [string]$Name,
        [string]$Description,
        [hashtable]$Properties
    )
    
    $jsonSchema = @{
        '$schema' = 'http://json-schema.org/draft-07/schema#'
        type = 'object'
        properties = $Properties
        required = @('timestamp', 'deviceId')
    } | ConvertTo-Json -Depth 10
    
    $body = @{
        name = $Name
        description = $Description
        initialVersion = @{
            version = "1.0"
            jsonSchema = $jsonSchema
            setAsDefault = $true
        }
    } | ConvertTo-Json -Depth 10
    
    Write-Host "Creating schema: $Name..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri $SchemaApiUrl -Method Post -Body $body -ContentType "application/json"
        Write-Host "✓ Created schema: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "✗ Failed to create schema $Name`: $_" -ForegroundColor Red
        return $null
    }
}

# Helper function to create device type
function Create-DeviceType {
    param (
        [string]$Name,
        [string]$Description,
        [string]$SchemaId,
        [string]$Category = "sensor"
    )
    
    $body = @{
        name = $Name
        description = $Description
        category = $Category
        schemaId = $SchemaId
        protocolType = "mqtt"
        protocolConfig = @{
            qos = 1
            retain = $false
        }
        customFieldDefinitions = @{}
        alertTemplates = @()
    } | ConvertTo-Json -Depth 10
    
    Write-Host "Creating device type: $Name..." -ForegroundColor Cyan
    try {
        $headers = @{ "X-Tenant-Id" = $TenantId }
        $response = Invoke-RestMethod -Uri $DeviceTypeApiUrl -Method Post -Body $body -ContentType "application/json" -Headers $headers
        Write-Host "✓ Created device type: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "✗ Failed to create device type $Name`: $_" -ForegroundColor Red
        return $null
    }
}

# Helper function to create device
function Create-Device {
    param (
        [string]$DeviceId,
        [string]$Name,
        [string]$DeviceTypeId,
        [string]$SerialNumber,
        [hashtable]$Location
    )
    
    $body = @{
        deviceId = $DeviceId
        name = $Name
        deviceTypeId = $DeviceTypeId
        serialNumber = $SerialNumber
        location = $Location
        status = "Active"
    } | ConvertTo-Json -Depth 10
    
    Write-Host "Creating device: $Name ($DeviceId)..." -ForegroundColor Cyan
    try {
        $headers = @{ "X-Tenant-Id" = $TenantId }
        $response = Invoke-RestMethod -Uri $DeviceApiUrl -Method Post -Body $body -ContentType "application/json" -Headers $headers
        Write-Host "✓ Created device: $Name" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "✗ Failed to create device $Name`: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Setting up Test Data" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# 1. Temperature Sensor
$schema1 = Create-Schema -Name "Temperature Sensor" -Description "Simple temperature sensor" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    temperature = @{ type = "number"; minimum = -40; maximum = 125; unit = "°C" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
}

# 2. Door/Window Sensor
$schema2 = Create-Schema -Name "Door/Window Sensor" -Description "Magnetic contact sensor" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    status = @{ type = "string"; enum = @("open", "closed") }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
    temperature = @{ type = "number"; minimum = -20; maximum = 60; unit = "°C" }
}

# 3. Leak Detector
$schema3 = Create-Schema -Name "Leak Detector" -Description "Water leak detection sensor" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    waterDetected = @{ type = "boolean" }
    temperature = @{ type = "number"; minimum = 0; maximum = 50; unit = "°C" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
}

# 4. Environmental Sensor
$schema4 = Create-Schema -Name "Environmental Sensor" -Description "Multi-sensor for temperature, humidity, pressure" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    temperature = @{ type = "number"; minimum = -40; maximum = 85; unit = "°C" }
    humidity = @{ type = "number"; minimum = 0; maximum = 100; unit = "%RH" }
    pressure = @{ type = "number"; minimum = 300; maximum = 1100; unit = "hPa" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
}

# 5. Motion Sensor
$schema5 = Create-Schema -Name "Motion Sensor" -Description "PIR motion detection" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    motionDetected = @{ type = "boolean" }
    lightLevel = @{ type = "number"; minimum = 0; maximum = 100; unit = "lux" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
}

# 6. Vibration Sensor
$schema6 = Create-Schema -Name "Vibration Sensor" -Description "Industrial vibration monitoring" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    vibrationX = @{ type = "number"; minimum = 0; maximum = 50; unit = "mm/s" }
    vibrationY = @{ type = "number"; minimum = 0; maximum = 50; unit = "mm/s" }
    vibrationZ = @{ type = "number"; minimum = 0; maximum = 50; unit = "mm/s" }
    temperature = @{ type = "number"; minimum = -20; maximum = 125; unit = "°C" }
}

# 7. Power Monitor
$schema7 = Create-Schema -Name "Power Monitor" -Description "Electrical power monitoring" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    voltage = @{ type = "number"; minimum = 0; maximum = 480; unit = "V" }
    current = @{ type = "number"; minimum = 0; maximum = 100; unit = "A" }
    power = @{ type = "number"; minimum = 0; maximum = 50000; unit = "W" }
    frequency = @{ type = "number"; minimum = 45; maximum = 65; unit = "Hz" }
}

# 8. GPS Tracker
$schema8 = Create-Schema -Name "GPS Tracker" -Description "GPS location tracker" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    location = @{
        type = "object"
        properties = @{
            latitude = @{ type = "number"; minimum = -90; maximum = 90 }
            longitude = @{ type = "number"; minimum = -180; maximum = 180 }
            altitude = @{ type = "number"; unit = "m" }
        }
    }
    speed = @{ type = "number"; minimum = 0; maximum = 300; unit = "km/h" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
}

# 9. Air Quality Sensor
$schema9 = Create-Schema -Name "Air Quality Sensor" -Description "Indoor air quality monitoring" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    co2 = @{ type = "number"; minimum = 400; maximum = 5000; unit = "ppm" }
    voc = @{ type = "number"; minimum = 0; maximum = 1000; unit = "ppb" }
    pm25 = @{ type = "number"; minimum = 0; maximum = 500; unit = "µg/m³" }
    temperature = @{ type = "number"; minimum = 0; maximum = 50; unit = "°C" }
    humidity = @{ type = "number"; minimum = 0; maximum = 100; unit = "%RH" }
}

# 10. Flood Sensor (Multi-sensor with GPS, Float Switch, Temp, Water Height)
$schema10 = Create-Schema -Name "Flood Sensor" -Description "Comprehensive flood monitoring with GPS, float switch, temperature, and water height" -Properties @{
    timestamp = @{ type = "string"; format = "date-time" }
    deviceId = @{ type = "string" }
    location = @{
        type = "object"
        properties = @{
            latitude = @{ type = "number"; minimum = -90; maximum = 90 }
            longitude = @{ type = "number"; minimum = -180; maximum = 180 }
            altitude = @{ type = "number"; unit = "m" }
        }
    }
    floatSwitch = @{ type = "boolean"; description = "Water detected (true = water present)" }
    waterHeight = @{ type = "number"; minimum = 0; maximum = 500; unit = "cm"; description = "Height of water level" }
    temperature = @{ type = "number"; minimum = -20; maximum = 50; unit = "°C" }
    battery = @{ type = "number"; minimum = 0; maximum = 100; unit = "%" }
    signalStrength = @{ type = "number"; minimum = -120; maximum = 0; unit = "dBm" }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Creating Device Types" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

$deviceTypes = @()
if ($schema1) { $deviceTypes += @{ id = (Create-DeviceType -Name "TempSensor-T100" -Description "Basic temperature sensor" -SchemaId $schema1); schema = $schema1 } }
if ($schema2) { $deviceTypes += @{ id = (Create-DeviceType -Name "DoorWindow-MC38" -Description "Magnetic contact sensor" -SchemaId $schema2); schema = $schema2 } }
if ($schema3) { $deviceTypes += @{ id = (Create-DeviceType -Name "LeakDetector-WLD01" -Description "Water leak detector" -SchemaId $schema3); schema = $schema3 } }
if ($schema4) { $deviceTypes += @{ id = (Create-DeviceType -Name "EnviroSensor-BME280" -Description "Environmental sensor" -SchemaId $schema4); schema = $schema4 } }
if ($schema5) { $deviceTypes += @{ id = (Create-DeviceType -Name "MotionSensor-PIR01" -Description "PIR motion sensor" -SchemaId $schema5); schema = $schema5 } }
if ($schema6) { $deviceTypes += @{ id = (Create-DeviceType -Name "VibrationMonitor-VM100" -Description "Industrial vibration sensor" -SchemaId $schema6); schema = $schema6 } }
if ($schema7) { $deviceTypes += @{ id = (Create-DeviceType -Name "PowerMonitor-PM300" -Description "Power monitoring device" -SchemaId $schema7); schema = $schema7 } }
if ($schema8) { $deviceTypes += @{ id = (Create-DeviceType -Name "GPSTracker-GT100" -Description "GPS location tracker" -SchemaId $schema8); schema = $schema8 } }
if ($schema9) { $deviceTypes += @{ id = (Create-DeviceType -Name "AirQuality-AQ500" -Description "Air quality monitor" -SchemaId $schema9); schema = $schema9 } }
if ($schema10) { $deviceTypes += @{ id = (Create-DeviceType -Name "FloodSensor-FS2000" -Description "Comprehensive flood monitoring" -SchemaId $schema10); schema = $schema10 } }

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Creating Test Devices" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Create 2 devices per type (20 total devices)
$deviceCounter = 1
foreach ($deviceType in $deviceTypes) {
    if ($deviceType.id) {
        for ($i = 1; $i -le 2; $i++) {
            $deviceNum = $deviceCounter.ToString("D4")
            $serialNum = "SN-" + (Get-Random -Minimum 100000 -Maximum 999999)
            $lat = -33.8688 + (Get-Random -Minimum -50 -Maximum 50) / 100.0
            $lon = 151.2093 + (Get-Random -Minimum -50 -Maximum 50) / 100.0
            
            Create-Device `
                -DeviceId "DEV-$deviceNum" `
                -Name "Test Device $deviceCounter" `
                -DeviceTypeId $deviceType.id `
                -SerialNumber $serialNum `
                -Location @{
                    latitude = $lat
                    longitude = $lon
                    altitude = (Get-Random -Minimum 0 -Maximum 100)
                }
            
            $deviceCounter++
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Created:" -ForegroundColor Cyan
Write-Host "  - 10 Schemas" -ForegroundColor White
Write-Host "  - 10 Device Types (each linked to a schema)" -ForegroundColor White
Write-Host "  - 20 Devices (2 per device type)" -ForegroundColor White
