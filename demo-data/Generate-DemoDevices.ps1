<#
.SYNOPSIS
    Generate comprehensive demo data with schemas, device types, field mappings, and devices

.DESCRIPTION
    Creates 10 schemas, 20 device types with field mappings, and 40 devices
    - At least 20 devices are flood detection sensors with radar height and float switch
    - All schemas are properly linked to device types
    - Field mappings created for dashboard integration
    - Cleans up existing data before creating new data

.PARAMETER DeviceApiUrl
    URL of the Device API (default: http://localhost:5293)

.PARAMETER SchemaApiUrl
    URL of the Schema Registry API (default: http://localhost:5021)

.PARAMETER TenantId
    Tenant ID for the demo data (default: 00000000-0000-0000-0000-000000000001)

.EXAMPLE
    .\Generate-DemoDevices.ps1
#>

param(
    [string]$DeviceApiUrl = "http://localhost:5293",
    [string]$SchemaApiUrl = "http://localhost:5021",
    [string]$DeviceTenantId = "00000000-0000-0000-0000-000000000001",
    [string]$SchemaTenantId = "default-tenant"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Sensormine Platform - Comprehensive Demo Data Generator" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Device API: $DeviceApiUrl (Tenant: $DeviceTenantId)" -ForegroundColor Gray
Write-Host "  Schema API: $SchemaApiUrl (Tenant: $SchemaTenantId)" -ForegroundColor Gray
Write-Host "  Target: 10 schemas, 20 device types, 40 devices (20+ flood detection)" -ForegroundColor Gray
Write-Host ""

# Headers for API requests
$deviceHeaders = @{
    "Content-Type" = "application/json"
    "X-Tenant-Id" = $DeviceTenantId
}

$schemaHeaders = @{
    "Content-Type" = "application/json"
    "X-Tenant-Id" = $SchemaTenantId
}

#region Helper Functions

function Remove-AllDevices {
    Write-Host "🗑️  Deleting all existing devices..." -ForegroundColor Yellow
    try {
        $devices = Invoke-RestMethod -Uri "$DeviceApiUrl/api/Device" -Method Get -Headers $deviceHeaders
        $count = 0
        foreach ($device in $devices) {
            try {
                Invoke-RestMethod -Uri "$DeviceApiUrl/api/Device/$($device.id)" -Method Delete -Headers $deviceHeaders | Out-Null
                $count++
            } catch {
                Write-Host "  ⚠ Failed to delete device: $($device.name)" -ForegroundColor DarkYellow
            }
        }
        Write-Host "  ✓ Deleted $count devices" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ No devices found or error occurred" -ForegroundColor DarkYellow
    }
}

function Remove-AllDeviceTypes {
    Write-Host "🗑️  Deleting all existing device types..." -ForegroundColor Yellow
    try {
        $deviceTypes = Invoke-RestMethod -Uri "$DeviceApiUrl/api/DeviceType" -Method Get -Headers $deviceHeaders
        $count = 0
        foreach ($deviceType in $deviceTypes) {
            try {
                Invoke-RestMethod -Uri "$DeviceApiUrl/api/DeviceType/$($deviceType.id)" -Method Delete -Headers $deviceHeaders | Out-Null
                $count++
            } catch {
                Write-Host "  ⚠ Failed to delete device type: $($deviceType.name)" -ForegroundColor DarkYellow
            }
        }
        Write-Host "  ✓ Deleted $count device types" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ No device types found or error occurred" -ForegroundColor DarkYellow
    }
}

function Remove-AllSchemas {
    Write-Host "🗑️  Deleting all existing schemas..." -ForegroundColor Yellow
    try {
        $schemas = Invoke-RestMethod -Uri "$SchemaApiUrl/api/Schemas" -Method Get -Headers $schemaHeaders
        $count = 0
        foreach ($schema in $schemas) {
            try {
                Invoke-RestMethod -Uri "$SchemaApiUrl/api/Schemas/$($schema.id)" -Method Delete -Headers $schemaHeaders | Out-Null
                $count++
            } catch {
                Write-Host "  ⚠ Failed to delete schema: $($schema.name)" -ForegroundColor DarkYellow
            }
        }
        Write-Host "  ✓ Deleted $count schemas" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ No schemas found or error occurred" -ForegroundColor DarkYellow
    }
}

function New-Schema {
    param(
        [string]$Name,
        [string]$Description,
        [hashtable]$Properties,
        [string[]]$Required,
        [string]$Version = "1.0.0"
    )

    $schema = @{
        "`$schema" = "http://json-schema.org/draft-07/schema#"
        "title" = $Name
        "type" = "object"
        "required" = $Required
        "properties" = $Properties
    } | ConvertTo-Json -Depth 10

    $request = @{
        name = $Name
        description = $Description
        initialVersion = @{
            version = $Version
            jsonSchema = $schema
            deviceTypes = @()
            setAsDefault = $true
        }
    }

    try {
        $response = Invoke-RestMethod -Uri "$SchemaApiUrl/api/Schemas" -Method Post -Headers $schemaHeaders -Body ($request | ConvertTo-Json -Depth 10)
        Write-Host "  ✓ Created schema: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "  ✗ Failed to create schema: $Name" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
}

function New-DeviceType {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Protocol,
        [hashtable]$ProtocolConfig,
        [string]$SchemaId,
        [string[]]$Tags,
        [array]$CustomFields = @()
    )

    $request = @{
        name = $Name
        description = $Description
        protocol = $Protocol
        protocolConfig = $ProtocolConfig
        schemaId = $SchemaId
        customFields = $CustomFields
        alertTemplates = @()
        tags = $Tags
        isActive = $true
    }

    try {
        $response = Invoke-RestMethod -Uri "$DeviceApiUrl/api/DeviceType" -Method Post -Headers $deviceHeaders -Body ($request | ConvertTo-Json -Depth 10)
        Write-Host "  ✓ Created device type: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "  ✗ Failed to create device type: $Name" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $null
    }
}

function Sync-FieldMappings {
    param(
        [string]$DeviceTypeId
    )

    try {
        # Call sync endpoint to auto-generate field mappings from schema
        $response = Invoke-RestMethod `
            -Uri "$DeviceApiUrl/api/DeviceType/$DeviceTypeId/fields/sync" `
            -Method Post `
            -Headers $deviceHeaders
        $count = if ($response) { $response.Count } else { 0 }
        Write-Host "    ✓ Synchronized $count field mappings from schema" -ForegroundColor Gray
        return $response
    } catch {
        Write-Host "    ✗ Failed to synchronize field mappings" -ForegroundColor Yellow
        Write-Host "      Error: $($_.Exception.Message)" -ForegroundColor DarkYellow
        if ($_.ErrorDetails.Message) {
            Write-Host "      Details: $($_.ErrorDetails.Message)" -ForegroundColor DarkYellow
        }
        return $null
    }
}

function New-Device {
    param(
        [string]$DeviceId,
        [string]$Name,
        [string]$DeviceTypeId,
        [string]$SerialNumber,
        [hashtable]$Location,
        [hashtable]$Metadata,
        [string]$Status = "Active"
    )

    $request = @{
        deviceId = $DeviceId
        name = $Name
        deviceTypeId = $DeviceTypeId
        serialNumber = $SerialNumber
        customFieldValues = @{}
        location = $Location
        metadata = $Metadata
        status = $Status
    }

    try {
        $response = Invoke-RestMethod -Uri "$DeviceApiUrl/api/Device" -Method Post -Headers $deviceHeaders -Body ($request | ConvertTo-Json -Depth 10)
        return $response
    } catch {
        Write-Host "    ✗ Failed to create device: $Name - $($_.Exception.Message)" -ForegroundColor DarkYellow
        return $null
    }
}

#endregion

#region Step 1: Cleanup Existing Data

Write-Host "📋 Step 1: Cleanup Existing Data" -ForegroundColor Cyan
Write-Host "-" * 80
Remove-AllDevices
Remove-AllDeviceTypes
Remove-AllSchemas
Write-Host ""

#endregion

#region Step 2: Create 10 Schemas

Write-Host "📋 Step 2: Creating 10 Schemas" -ForegroundColor Cyan
Write-Host "-" * 80

# Schema 1: Flood Detection (Radar + Float Switch)
$schema1 = New-Schema -Name "Flood-Detection-Schema" -Description "Flood detection with radar height and float switch" `
    -Properties @{
        deviceId = @{ type = "string"; description = "Device identifier" }
        timestamp = @{ type = "string"; format = "date-time"; description = "Reading timestamp" }
        radarHeight = @{ type = "number"; minimum = 0; maximum = 10; description = "Water level in meters (radar)" }
        floatSwitch = @{ type = "boolean"; description = "Float switch activated" }
        temperature = @{ type = "number"; description = "Water temperature in Celsius" }
        batteryLevel = @{ type = "integer"; minimum = 0; maximum = 100; description = "Battery %" }
        alarmStatus = @{ type = "string"; enum = @("normal", "warning", "critical"); description = "Alarm state" }
    } -Required @("deviceId", "timestamp", "radarHeight", "floatSwitch")

# Schema 2: Temperature & Humidity
$schema2 = New-Schema -Name "Temperature-Humidity-Schema" -Description "Temperature and humidity sensor" `
    -Properties @{
        deviceId = @{ type = "string"; description = "Device identifier" }
        timestamp = @{ type = "string"; format = "date-time"; description = "Reading timestamp" }
        temperature = @{ type = "number"; minimum = -40; maximum = 85; description = "Temperature in Celsius" }
        humidity = @{ type = "number"; minimum = 0; maximum = 100; description = "Relative humidity %" }
        dewPoint = @{ type = "number"; description = "Dew point in Celsius" }
        heatIndex = @{ type = "number"; description = "Heat index in Celsius" }
        batteryLevel = @{ type = "integer"; minimum = 0; maximum = 100; description = "Battery %" }
    } -Required @("deviceId", "timestamp", "temperature", "humidity")

# Schema 3: Water Quality
$schema3 = New-Schema -Name "Water-Quality-Schema" -Description "Comprehensive water quality monitoring" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pH = @{ type = "number"; minimum = 0; maximum = 14; description = "pH level" }
        turbidity = @{ type = "number"; description = "Turbidity in NTU" }
        dissolvedOxygen = @{ type = "number"; description = "DO in mg/L" }
        conductivity = @{ type = "number"; description = "Conductivity in μS/cm" }
        temperature = @{ type = "number"; description = "Water temperature in Celsius" }
        tds = @{ type = "number"; description = "Total Dissolved Solids in ppm" }
    } -Required @("deviceId", "timestamp", "pH", "temperature")

# Schema 4: Air Quality
$schema4 = New-Schema -Name "Air-Quality-Schema" -Description "Air quality monitoring sensor" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pm25 = @{ type = "number"; description = "PM2.5 in μg/m³" }
        pm10 = @{ type = "number"; description = "PM10 in μg/m³" }
        co2 = @{ type = "number"; description = "CO2 in ppm" }
        co = @{ type = "number"; description = "CO in ppm" }
        no2 = @{ type = "number"; description = "NO2 in ppb" }
        voc = @{ type = "number"; description = "VOC in ppb" }
        aqi = @{ type = "integer"; description = "Air Quality Index" }
    } -Required @("deviceId", "timestamp", "pm25", "co2")

# Schema 5: Energy Meter
$schema5 = New-Schema -Name "Energy-Meter-Schema" -Description "Electrical energy monitoring" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        voltage = @{ type = "number"; description = "Voltage in V" }
        current = @{ type = "number"; description = "Current in A" }
        power = @{ type = "number"; description = "Power in W" }
        energy = @{ type = "number"; description = "Total energy in kWh" }
        powerFactor = @{ type = "number"; minimum = 0; maximum = 1; description = "Power factor" }
        frequency = @{ type = "number"; description = "Frequency in Hz" }
    } -Required @("deviceId", "timestamp", "voltage", "current", "power")

# Schema 6: Vibration Sensor
$schema6 = New-Schema -Name "Vibration-Sensor-Schema" -Description "3-axis vibration monitoring" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        accelerationX = @{ type = "number"; description = "X-axis acceleration in g" }
        accelerationY = @{ type = "number"; description = "Y-axis acceleration in g" }
        accelerationZ = @{ type = "number"; description = "Z-axis acceleration in g" }
        rms = @{ type = "number"; description = "RMS vibration" }
        peakToPeak = @{ type = "number"; description = "Peak-to-peak amplitude" }
        frequency = @{ type = "number"; description = "Dominant frequency in Hz" }
    } -Required @("deviceId", "timestamp", "accelerationX", "accelerationY", "accelerationZ")

# Schema 7: Pressure Sensor
$schema7 = New-Schema -Name "Pressure-Sensor-Schema" -Description "Pressure and altitude monitoring" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pressure = @{ type = "number"; minimum = 0; maximum = 2000; description = "Pressure in hPa" }
        altitude = @{ type = "number"; description = "Calculated altitude in meters" }
        temperature = @{ type = "number"; description = "Temperature in Celsius" }
    } -Required @("deviceId", "timestamp", "pressure")

# Schema 8: Flow Meter
$schema8 = New-Schema -Name "Flow-Meter-Schema" -Description "Liquid flow measurement" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        flowRate = @{ type = "number"; minimum = 0; description = "Flow rate in L/min" }
        totalVolume = @{ type = "number"; minimum = 0; description = "Total volume in Liters" }
        velocity = @{ type = "number"; description = "Flow velocity in m/s" }
        pressure = @{ type = "number"; description = "Pipe pressure in bar" }
        temperature = @{ type = "number"; description = "Fluid temperature" }
    } -Required @("deviceId", "timestamp", "flowRate")

# Schema 9: GPS Tracker
$schema9 = New-Schema -Name "GPS-Tracker-Schema" -Description "GPS location tracking" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        latitude = @{ type = "number"; minimum = -90; maximum = 90 }
        longitude = @{ type = "number"; minimum = -180; maximum = 180 }
        altitude = @{ type = "number"; description = "Altitude in meters" }
        speed = @{ type = "number"; description = "Speed in km/h" }
        heading = @{ type = "number"; minimum = 0; maximum = 360; description = "Heading in degrees" }
        satellites = @{ type = "integer"; description = "Number of satellites" }
        accuracy = @{ type = "number"; description = "Position accuracy in meters" }
    } -Required @("deviceId", "timestamp", "latitude", "longitude")

# Schema 10: Level Sensor
$schema10 = New-Schema -Name "Tank-Level-Schema" -Description "Tank or reservoir level monitoring" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        level = @{ type = "number"; minimum = 0; maximum = 100; description = "Level percentage" }
        distance = @{ type = "number"; description = "Distance to surface in cm" }
        volume = @{ type = "number"; description = "Calculated volume in L" }
        temperature = @{ type = "number"; description = "Fluid temperature" }
    } -Required @("deviceId", "timestamp", "level")

Write-Host ""

#endregion

#region Step 3: Create 20 Device Types with Field Mappings

Write-Host "📋 Step 3: Creating 20 Device Types with Field Mappings" -ForegroundColor Cyan
Write-Host "-" * 80

$deviceTypes = @()

# Device Type 1: Flood Sensor - Indoor (Radar + Float)
$dt = New-DeviceType -Name "Flood-Sensor-Indoor" -Description "Indoor flood detection with radar and float switch" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/indoor"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "water", "safety", "indoor")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 2: Flood Sensor - Outdoor (Radar + Float)
$dt = New-DeviceType -Name "Flood-Sensor-Outdoor" -Description "Outdoor flood detection with weatherproof housing" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/outdoor"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "water", "safety", "outdoor")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 3: Flood Sensor - Basement (Radar + Float)
$dt = New-DeviceType -Name "Flood-Sensor-Basement" -Description "Basement flood monitoring system" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/basement"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "water", "safety", "basement")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 4: Stormwater Monitor (Radar + Float)
$dt = New-DeviceType -Name "Stormwater-Monitor" -Description "Stormwater drain level monitoring" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "stormwater/level"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "water", "stormwater", "municipal")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 5: Temperature/Humidity - DHT22
$dt = New-DeviceType -Name "TempHumidity-DHT22" -Description "DHT22 digital temperature and humidity sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/temp-humidity"; qos = 1 } `
    -SchemaId $schema2 -Tags @("temperature", "humidity", "environmental")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 6: Water Quality Monitor
$dt = New-DeviceType -Name "Water-Quality-Station" -Description "Multi-parameter water quality monitoring" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/water-quality"; method = "POST" } `
    -SchemaId $schema3 -Tags @("water", "quality", "environmental")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 7: Air Quality Monitor
$dt = New-DeviceType -Name "Air-Quality-Monitor" -Description "Indoor/outdoor air quality sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/air-quality"; qos = 1 } `
    -SchemaId $schema4 -Tags @("air-quality", "environmental", "iaq")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 8: Energy Monitor - Single Phase
$dt = New-DeviceType -Name "Energy-Monitor-SinglePhase" -Description "Single phase energy meter" `
    -Protocol "Modbus_RTU" -ProtocolConfig @{ slaveId = 1; baudRate = 9600 } `
    -SchemaId $schema5 -Tags @("energy", "power", "electrical")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 9: Vibration Monitor
$dt = New-DeviceType -Name "Vibration-Monitor" -Description "Industrial vibration monitoring for predictive maintenance" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/vibration"; qos = 1 } `
    -SchemaId $schema6 -Tags @("vibration", "predictive-maintenance", "industrial")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 10: Pressure Sensor
$dt = New-DeviceType -Name "Pressure-Sensor-BMP280" -Description "Barometric pressure and altitude sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/pressure"; qos = 1 } `
    -SchemaId $schema7 -Tags @("pressure", "altitude", "atmospheric")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 11: Flow Meter - Water
$dt = New-DeviceType -Name "Flow-Meter-Water" -Description "Water flow measurement sensor" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/flow"; method = "POST" } `
    -SchemaId $schema8 -Tags @("flow", "water", "industrial")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 12: GPS Tracker - Asset
$dt = New-DeviceType -Name "GPS-Asset-Tracker" -Description "GPS tracking device for asset monitoring" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/gps"; method = "POST" } `
    -SchemaId $schema9 -Tags @("gps", "tracking", "location", "asset")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 13: Tank Level Sensor
$dt = New-DeviceType -Name "Tank-Level-Ultrasonic" -Description "Ultrasonic tank level monitoring" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/level"; qos = 1 } `
    -SchemaId $schema10 -Tags @("level", "tank", "ultrasonic")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 14: Temperature Probe - Industrial
$dt = New-DeviceType -Name "Temperature-Industrial-PT100" -Description "PT100 industrial temperature probe" `
    -Protocol "Modbus_RTU" -ProtocolConfig @{ slaveId = 2; baudRate = 9600 } `
    -SchemaId $schema2 -Tags @("temperature", "industrial", "pt100")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 15: River Level Monitor (Flood Detection)
$dt = New-DeviceType -Name "River-Level-Monitor" -Description "River level monitoring with flood prediction" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/river"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "river", "water", "environmental")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 16: Sump Pump Monitor (Flood Detection)
$dt = New-DeviceType -Name "Sump-Pump-Monitor" -Description "Sump pump level and status monitoring" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/sump"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "sump", "pump", "basement")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 17: Wastewater Monitor (Flood Detection)
$dt = New-DeviceType -Name "Wastewater-Monitor" -Description "Wastewater treatment facility level monitoring" `
    -Protocol "Modbus_TCP" -ProtocolConfig @{ ipAddress = "192.168.1.100"; port = 502 } `
    -SchemaId $schema1 -Tags @("flood", "wastewater", "treatment", "municipal")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 18: Parking Lot Drainage (Flood Detection)
$dt = New-DeviceType -Name "Parking-Drainage-Monitor" -Description "Parking lot drainage system monitoring" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "flood/parking"; qos = 1 } `
    -SchemaId $schema1 -Tags @("flood", "drainage", "parking", "urban")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 19: Energy Monitor - Three Phase
$dt = New-DeviceType -Name "Energy-Monitor-ThreePhase" -Description "Three phase industrial energy meter" `
    -Protocol "Modbus_TCP" -ProtocolConfig @{ ipAddress = "192.168.1.101"; port = 502 } `
    -SchemaId $schema5 -Tags @("energy", "power", "three-phase", "industrial")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

# Device Type 20: HVAC Monitor
$dt = New-DeviceType -Name "HVAC-Monitor" -Description "HVAC system monitoring and control" `
    -Protocol "BACnet" -ProtocolConfig @{ deviceId = 1; networkNumber = 0 } `
    -SchemaId $schema2 -Tags @("hvac", "temperature", "humidity", "building-automation")
if ($dt) {
    Sync-FieldMappings -DeviceTypeId $dt.id
    $deviceTypes += $dt
}

Write-Host ""

#endregion

#region Step 4: Create 40 Devices (22 Flood Detection)

Write-Host "📋 Step 4: Creating 40 Devices (22 Flood Detection)" -ForegroundColor Cyan
Write-Host "-" * 80

$locations = @(
    @{ latitude = 49.2827; longitude = -123.1207 },  # Vancouver
    @{ latitude = 43.6532; longitude = -79.3832 },   # Toronto
    @{ latitude = 51.0447; longitude = -114.0719 },  # Calgary
    @{ latitude = 45.5017; longitude = -73.5673 },   # Montreal
    @{ latitude = 53.5461; longitude = -113.4938 },  # Edmonton
    @{ latitude = 44.6488; longitude = -63.5752 },   # Halifax
    @{ latitude = 49.8951; longitude = -97.1384 },   # Winnipeg
    @{ latitude = 46.8139; longitude = -71.2080 }    # Quebec City
)

$buildings = @("Building-A", "Building-B", "Building-C", "Warehouse-North", "Plant-South", "Facility-East", "Station-West", "Complex-Central")
$floors = @("Ground", "Floor-1", "Floor-2", "Floor-3", "Basement", "Rooftop")
$zones = @("Zone-A", "Zone-B", "Zone-C", "Zone-D", "Zone-E")

$createdDevices = @()
$deviceCounter = 1

# Create 22 flood detection devices (from device types 1-4, 15-18)
$floodDeviceTypes = @($deviceTypes[0], $deviceTypes[1], $deviceTypes[2], $deviceTypes[3], $deviceTypes[14], $deviceTypes[15], $deviceTypes[16], $deviceTypes[17])
$devicesPerFloodType = @(3, 3, 3, 3, 3, 3, 2, 2)  # Total: 22 flood devices

Write-Host "  Creating flood detection devices..." -ForegroundColor Gray
for ($typeIndex = 0; $typeIndex -lt $floodDeviceTypes.Count; $typeIndex++) {
    $deviceType = $floodDeviceTypes[$typeIndex]
    if ($null -eq $deviceType) { continue }
    
    $count = $devicesPerFloodType[$typeIndex]
    for ($i = 1; $i -le $count; $i++) {
        $location = $locations[$deviceCounter % $locations.Count]
        $building = $buildings[$deviceCounter % $buildings.Count]
        $floor = $floors[$deviceCounter % $floors.Count]
        $zone = $zones[$deviceCounter % $zones.Count]
        
        $deviceId = "FLOOD-{0:D3}" -f $deviceCounter
        $serialNumber = "FL-{0:D6}" -f (Get-Random -Minimum 100000 -Maximum 999999)
        
        $metadata = @{
            building = $building
            floor = $floor
            zone = $zone
            installDate = (Get-Date).AddDays(-(Get-Random -Minimum 30 -Maximum 365)).ToString("yyyy-MM-dd")
            manufacturer = "Sensormine"
            model = $deviceType.name
            category = "Flood Detection"
        }
        
        $device = New-Device `
            -DeviceId $deviceId `
            -Name "$($deviceType.name) - $building $zone" `
            -DeviceTypeId $deviceType.id `
            -SerialNumber $serialNumber `
            -Location $location `
            -Metadata $metadata `
            -Status "Active"
        
        if ($null -ne $device) {
            $createdDevices += $device
            $deviceCounter++
        }
    }
}

Write-Host "  ✓ Created $($deviceCounter - 1) flood detection devices" -ForegroundColor Green

# Create 18 devices from other types (distributed across remaining types)
$otherDeviceTypes = @($deviceTypes[4], $deviceTypes[5], $deviceTypes[6], $deviceTypes[7], $deviceTypes[8], $deviceTypes[9], $deviceTypes[10], $deviceTypes[11], $deviceTypes[12], $deviceTypes[13], $deviceTypes[18], $deviceTypes[19])
$devicesPerOtherType = @(2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1)  # Total: 18 devices

Write-Host "  Creating other sensor devices..." -ForegroundColor Gray
for ($typeIndex = 0; $typeIndex -lt $otherDeviceTypes.Count; $typeIndex++) {
    $deviceType = $otherDeviceTypes[$typeIndex]
    if ($null -eq $deviceType) { continue }
    
    $count = $devicesPerOtherType[$typeIndex]
    for ($i = 1; $i -le $count; $i++) {
        $location = $locations[$deviceCounter % $locations.Count]
        $building = $buildings[$deviceCounter % $buildings.Count]
        $floor = $floors[$deviceCounter % $floors.Count]
        $zone = $zones[$deviceCounter % $zones.Count]
        
        $deviceId = "DEV-{0:D3}" -f $deviceCounter
        $serialNumber = "SN-{0:D6}" -f (Get-Random -Minimum 100000 -Maximum 999999)
        
        $metadata = @{
            building = $building
            floor = $floor
            zone = $zone
            installDate = (Get-Date).AddDays(-(Get-Random -Minimum 30 -Maximum 365)).ToString("yyyy-MM-dd")
            manufacturer = "Sensormine"
            model = $deviceType.name
            category = "Environmental Monitoring"
        }
        
        $device = New-Device `
            -DeviceId $deviceId `
            -Name "$($deviceType.name) - $building $zone" `
            -DeviceTypeId $deviceType.id `
            -SerialNumber $serialNumber `
            -Location $location `
            -Metadata $metadata `
            -Status "Active"
        
        if ($null -ne $device) {
            $createdDevices += $device
            $deviceCounter++
        }
    }
}

Write-Host "  ✓ Created $($createdDevices.Count) total devices" -ForegroundColor Green
Write-Host ""

#endregion

#region Summary

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "✅ Demo Data Generation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • Schemas created:                10" -ForegroundColor White
Write-Host "  • Device types created:           $($deviceTypes.Count)" -ForegroundColor White
Write-Host "  • Devices created:                $($createdDevices.Count)" -ForegroundColor White
Write-Host "  • Flood detection devices:        22 (with radar height + float switch)" -ForegroundColor White
Write-Host "  • Field mappings:                 All device types have complete mappings" -ForegroundColor White
Write-Host ""
Write-Host "Flood Detection Device Types:" -ForegroundColor Cyan
Write-Host "  • Flood-Sensor-Indoor" -ForegroundColor Gray
Write-Host "  • Flood-Sensor-Outdoor" -ForegroundColor Gray
Write-Host "  • Flood-Sensor-Basement" -ForegroundColor Gray
Write-Host "  • Stormwater-Monitor" -ForegroundColor Gray
Write-Host "  • River-Level-Monitor" -ForegroundColor Gray
Write-Host "  • Sump-Pump-Monitor" -ForegroundColor Gray
Write-Host "  • Wastewater-Monitor" -ForegroundColor Gray
Write-Host "  • Parking-Drainage-Monitor" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 View your data at:" -ForegroundColor Green
Write-Host "  • Devices: http://localhost:3020/settings/digital-twin" -ForegroundColor White
Write-Host "  • Device Types: http://localhost:3020/settings/device-types" -ForegroundColor White
Write-Host "  • Schemas: http://localhost:3020/settings/schemas" -ForegroundColor White
Write-Host ""

#endregion



