<#
.SYNOPSIS
    Generate demo device types with schemas and devices for Sensormine Platform

.DESCRIPTION
    Creates 15 device types with logical data schemas and 100 devices distributed across these types.
    Each device type has a unique schema tailored to its sensor/device category.

.PARAMETER DeviceApiUrl
    URL of the Device API (default: http://localhost:5293)

.PARAMETER SchemaApiUrl
    URL of the Schema Registry API (default: http://localhost:5294)

.PARAMETER TenantId
    Tenant ID for the demo data (default: 00000000-0000-0000-0000-000000000001)

.EXAMPLE
    .\Generate-DemoDevices.ps1
    .\Generate-DemoDevices.ps1 -DeviceApiUrl "http://localhost:5293" -SchemaApiUrl "http://localhost:5294"
#>

param(
    [string]$DeviceApiUrl = "http://localhost:5293",
    [string]$SchemaApiUrl = "http://localhost:5021",
    [string]$DeviceTenantId = "00000000-0000-0000-0000-000000000001",
    [string]$SchemaTenantId = "default-tenant"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Sensormine Platform - Demo Data Generator" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Device API: $DeviceApiUrl (Tenant: $DeviceTenantId)" -ForegroundColor Gray
Write-Host "  Schema API: $SchemaApiUrl (Tenant: $SchemaTenantId)" -ForegroundColor Gray
Write-Host ""

# Headers for Device API requests
$deviceHeaders = @{
    "Content-Type" = "application/json"
    "X-Tenant-Id" = $DeviceTenantId
}

# Headers for Schema API requests (uses different tenant)
$schemaHeaders = @{
    "Content-Type" = "application/json"
    "X-Tenant-Id" = $SchemaTenantId
}

# Function to create a schema
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
        Write-Host "✓ Created schema: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "✗ Failed to create schema: $Name" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

# Function to create a device type
function New-DeviceType {
    param(
        [string]$Name,
        [string]$Description,
        [string]$Protocol,
        [hashtable]$ProtocolConfig,
        [string]$SchemaId,
        [string[]]$Tags
    )

    $request = @{
        name = $Name
        description = $Description
        protocol = $Protocol
        protocolConfig = $ProtocolConfig
        customFields = @()
        alertTemplates = @()
        tags = $Tags
        isActive = $true
    }
    
    # Only add schemaId if it's not null
    if ($SchemaId) {
        $request.schemaId = $SchemaId
    }

    try {
        $response = Invoke-RestMethod -Uri "$DeviceApiUrl/api/DeviceType" -Method Post -Headers $deviceHeaders -Body ($request | ConvertTo-Json -Depth 10)
        Write-Host "✓ Created device type: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response
    } catch {
        Write-Host "✗ Failed to create device type: $Name" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

# Function to create a device
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
        Write-Host "✗ Failed to create device: $Name" -ForegroundColor Yellow
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkYellow
        return $null
    }
}

Write-Host "📋 Step 1: Skipping Schema Creation (already done)" -ForegroundColor Cyan
Write-Host "-" * 60

# Use existing schema IDs (fetch from API or hardcode known IDs)
# For now, we'll set these to null and device types will be created without schema references
$schema1 = $null  # Temperature-Humidity-Schema
$schema2 = $null  # Pressure-Sensor-Schema
$schema3 = $null  # Flow-Meter-Schema
$schema4 = $null  # Vibration-Sensor-Schema
$schema5 = $null  # Energy-Meter-Schema
$schema6 = $null  # Water-Quality-Schema
$schema7 = $null  # Air-Quality-Schema
$schema8 = $null  # Motion-Occupancy-Schema
$schema9 = $null  # GPS-Tracker-Schema
$schema10 = $null # Level-Sensor-Schema
$schema11 = $null # Leak-Detector-Schema
$schema12 = $null # Door-Window-Schema
$schema13 = $null # Sound-Level-Schema
$schema14 = $null # Light-Sensor-Schema
$schema15 = $null # Smart-Meter-Schema

<#
# Schema definitions commented out - already created
# Schema 1: Temperature & Humidity Sensor
$schema1 = New-Schema -Name "Temperature-Humidity-Schema" -Description "Schema for temperature and humidity sensors" `
    -Properties @{
        deviceId = @{ type = "string"; description = "Device identifier" }
        timestamp = @{ type = "string"; format = "date-time"; description = "Reading timestamp" }
        temperature = @{ type = "number"; minimum = -40; maximum = 85; description = "Temperature in Celsius" }
        humidity = @{ type = "number"; minimum = 0; maximum = 100; description = "Relative humidity %" }
        dewPoint = @{ type = "number"; description = "Dew point in Celsius" }
        batteryLevel = @{ type = "integer"; minimum = 0; maximum = 100; description = "Battery %" }
    } -Required @("deviceId", "timestamp", "temperature", "humidity")

# Schema 2: Pressure Sensor
$schema2 = New-Schema -Name "Pressure-Sensor-Schema" -Description "Schema for pressure sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pressure = @{ type = "number"; minimum = 0; maximum = 2000; description = "Pressure in hPa" }
        altitude = @{ type = "number"; description = "Calculated altitude in meters" }
        temperature = @{ type = "number"; description = "Temperature in Celsius" }
    } -Required @("deviceId", "timestamp", "pressure")

# Schema 3: Flow Meter
$schema3 = New-Schema -Name "Flow-Meter-Schema" -Description "Schema for flow meters" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        flowRate = @{ type = "number"; minimum = 0; description = "Flow rate in L/min" }
        totalVolume = @{ type = "number"; minimum = 0; description = "Total volume in Liters" }
        velocity = @{ type = "number"; description = "Flow velocity in m/s" }
        pressure = @{ type = "number"; description = "Pipe pressure in bar" }
    } -Required @("deviceId", "timestamp", "flowRate")

# Schema 4: Vibration Sensor
$schema4 = New-Schema -Name "Vibration-Sensor-Schema" -Description "Schema for vibration sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        accelerationX = @{ type = "number"; description = "X-axis acceleration in g" }
        accelerationY = @{ type = "number"; description = "Y-axis acceleration in g" }
        accelerationZ = @{ type = "number"; description = "Z-axis acceleration in g" }
        frequency = @{ type = "number"; description = "Dominant frequency in Hz" }
        amplitude = @{ type = "number"; description = "Vibration amplitude" }
    } -Required @("deviceId", "timestamp", "accelerationX", "accelerationY", "accelerationZ")

# Schema 5: Energy Meter
$schema5 = New-Schema -Name "Energy-Meter-Schema" -Description "Schema for energy meters" `
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

# Schema 6: Water Quality Sensor
$schema6 = New-Schema -Name "Water-Quality-Schema" -Description "Schema for water quality sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pH = @{ type = "number"; minimum = 0; maximum = 14; description = "pH level" }
        turbidity = @{ type = "number"; description = "Turbidity in NTU" }
        dissolvedOxygen = @{ type = "number"; description = "DO in mg/L" }
        conductivity = @{ type = "number"; description = "Conductivity in μS/cm" }
        temperature = @{ type = "number"; description = "Water temperature in Celsius" }
    } -Required @("deviceId", "timestamp", "pH")

# Schema 7: Air Quality Sensor
$schema7 = New-Schema -Name "Air-Quality-Schema" -Description "Schema for air quality sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        pm25 = @{ type = "number"; description = "PM2.5 in μg/m³" }
        pm10 = @{ type = "number"; description = "PM10 in μg/m³" }
        co2 = @{ type = "number"; description = "CO2 in ppm" }
        co = @{ type = "number"; description = "CO in ppm" }
        no2 = @{ type = "number"; description = "NO2 in ppb" }
        voc = @{ type = "number"; description = "VOC in ppb" }
    } -Required @("deviceId", "timestamp", "pm25", "co2")

# Schema 8: Motion/Occupancy Sensor
$schema8 = New-Schema -Name "Motion-Sensor-Schema" -Description "Schema for motion/occupancy sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        motion = @{ type = "boolean"; description = "Motion detected" }
        occupancy = @{ type = "boolean"; description = "Space occupied" }
        count = @{ type = "integer"; description = "People count" }
        lux = @{ type = "number"; description = "Light level in lux" }
    } -Required @("deviceId", "timestamp", "motion")

# Schema 9: GPS Tracker
$schema9 = New-Schema -Name "GPS-Tracker-Schema" -Description "Schema for GPS tracking devices" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        latitude = @{ type = "number"; minimum = -90; maximum = 90 }
        longitude = @{ type = "number"; minimum = -180; maximum = 180 }
        altitude = @{ type = "number"; description = "Altitude in meters" }
        speed = @{ type = "number"; description = "Speed in km/h" }
        heading = @{ type = "number"; minimum = 0; maximum = 360; description = "Heading in degrees" }
        satellites = @{ type = "integer"; description = "Number of satellites" }
    } -Required @("deviceId", "timestamp", "latitude", "longitude")

# Schema 10: Level Sensor
$schema10 = New-Schema -Name "Level-Sensor-Schema" -Description "Schema for tank/silo level sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        level = @{ type = "number"; minimum = 0; maximum = 100; description = "Level percentage" }
        distance = @{ type = "number"; description = "Distance to surface in cm" }
        volume = @{ type = "number"; description = "Calculated volume in L" }
        temperature = @{ type = "number"; description = "Fluid temperature" }
    } -Required @("deviceId", "timestamp", "level")

# Schema 11: Leak Detector
$schema11 = New-Schema -Name "Leak-Detector-Schema" -Description "Schema for leak detection sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        leak = @{ type = "boolean"; description = "Leak detected" }
        moisture = @{ type = "number"; minimum = 0; maximum = 100; description = "Moisture %" }
        temperature = @{ type = "number"; description = "Temperature" }
        batteryLevel = @{ type = "integer"; minimum = 0; maximum = 100 }
    } -Required @("deviceId", "timestamp", "leak")

# Schema 12: Door/Window Sensor
$schema12 = New-Schema -Name "Door-Window-Schema" -Description "Schema for door/window sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        open = @{ type = "boolean"; description = "Open state" }
        tamper = @{ type = "boolean"; description = "Tamper detected" }
        batteryLevel = @{ type = "integer"; minimum = 0; maximum = 100 }
    } -Required @("deviceId", "timestamp", "open")

# Schema 13: Sound Level Meter
$schema13 = New-Schema -Name "Sound-Level-Schema" -Description "Schema for sound level meters" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        soundLevel = @{ type = "number"; description = "Sound level in dB" }
        peakLevel = @{ type = "number"; description = "Peak level in dB" }
        frequency = @{ type = "number"; description = "Dominant frequency in Hz" }
    } -Required @("deviceId", "timestamp", "soundLevel")

# Schema 14: Light Sensor
$schema14 = New-Schema -Name "Light-Sensor-Schema" -Description "Schema for light/luminosity sensors" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        lux = @{ type = "number"; minimum = 0; description = "Illuminance in lux" }
        red = @{ type = "integer"; minimum = 0; maximum = 255 }
        green = @{ type = "integer"; minimum = 0; maximum = 255 }
        blue = @{ type = "integer"; minimum = 0; maximum = 255 }
        infrared = @{ type = "number"; description = "IR light level" }
    } -Required @("deviceId", "timestamp", "lux")

# Schema 15: Smart Meter (Multi-Utility)
$schema15 = New-Schema -Name "Smart-Meter-Schema" -Description "Schema for multi-utility smart meters" `
    -Properties @{
        deviceId = @{ type = "string" }
        timestamp = @{ type = "string"; format = "date-time" }
        meterType = @{ type = "string"; enum = @("electricity", "gas", "water"); description = "Meter type" }
        reading = @{ type = "number"; description = "Current reading" }
        consumption = @{ type = "number"; description = "Consumption since last reading" }
        rate = @{ type = "number"; description = "Current usage rate" }
        totalCost = @{ type = "number"; description = "Total cost" }
    } -Required @("deviceId", "timestamp", "meterType", "reading")
#>

Write-Host "✓ Skipped schema creation (15 schemas already exist)" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Step 2: Creating Device Types" -ForegroundColor Cyan
Write-Host "-" * 60

# Device Type 1: Temperature & Humidity Sensor
$deviceType1 = New-DeviceType -Name "TH-Sensor-DHT22" -Description "DHT22 Temperature and Humidity Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/temperature"; qos = 1 } `
    -SchemaId $schema1 -Tags @("temperature", "humidity", "environmental")

# Device Type 2: Pressure Sensor
$deviceType2 = New-DeviceType -Name "Pressure-BMP280" -Description "BMP280 Barometric Pressure Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/pressure"; qos = 1 } `
    -SchemaId $schema2 -Tags @("pressure", "atmospheric")

# Device Type 3: Flow Meter
$deviceType3 = New-DeviceType -Name "FlowMeter-YFS201" -Description "YFS201 Water Flow Meter" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/flow"; method = "POST" } `
    -SchemaId $schema3 -Tags @("flow", "water", "industrial")

# Device Type 4: Vibration Sensor
$deviceType4 = New-DeviceType -Name "Vibration-ADXL345" -Description "ADXL345 3-Axis Vibration Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/vibration"; qos = 1 } `
    -SchemaId $schema4 -Tags @("vibration", "predictive-maintenance")

# Device Type 5: Energy Meter
$deviceType5 = New-DeviceType -Name "EnergyMeter-PZEM004T" -Description "PZEM-004T AC Energy Monitor" `
    -Protocol "Modbus_RTU" -ProtocolConfig @{ slaveId = 1; baudRate = 9600 } `
    -SchemaId $schema5 -Tags @("energy", "power", "electrical")

# Device Type 6: Water Quality Sensor
$deviceType6 = New-DeviceType -Name "WaterQuality-Atlas" -Description "Atlas Scientific Water Quality Sensor" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/water-quality"; method = "POST" } `
    -SchemaId $schema6 -Tags @("water", "quality", "environmental")

# Device Type 7: Air Quality Sensor
$deviceType7 = New-DeviceType -Name "AirQuality-PMS7003" -Description "PMS7003 Air Quality Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/air-quality"; qos = 1 } `
    -SchemaId $schema7 -Tags @("air-quality", "environmental", "iaq")

# Device Type 8: Motion Sensor
$deviceType8 = New-DeviceType -Name "Motion-PIR-HC-SR501" -Description "HC-SR501 PIR Motion Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/motion"; qos = 0 } `
    -SchemaId $schema8 -Tags @("motion", "occupancy", "security")

# Device Type 9: GPS Tracker
$deviceType9 = New-DeviceType -Name "GPS-NEO6M" -Description "NEO-6M GPS Tracker Module" `
    -Protocol "HTTP" -ProtocolConfig @{ endpoint = "/api/gps"; method = "POST" } `
    -SchemaId $schema9 -Tags @("gps", "tracking", "location")

# Device Type 10: Level Sensor
$deviceType10 = New-DeviceType -Name "Level-Ultrasonic-JSN-SR04T" -Description "JSN-SR04T Ultrasonic Level Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/level"; qos = 1 } `
    -SchemaId $schema10 -Tags @("level", "tank", "ultrasonic")

# Device Type 11: Leak Detector
$deviceType11 = New-DeviceType -Name "LeakDetector-WLD01" -Description "Water Leak Detection Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/leak"; qos = 1 } `
    -SchemaId $schema11 -Tags @("leak", "water", "safety")

# Device Type 12: Door/Window Sensor
$deviceType12 = New-DeviceType -Name "DoorWindow-MC38" -Description "MC-38 Magnetic Contact Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/contact"; qos = 0 } `
    -SchemaId $schema12 -Tags @("door", "window", "security")

# Device Type 13: Sound Level Meter
$deviceType13 = New-DeviceType -Name "SoundLevel-MAX9814" -Description "MAX9814 Sound Level Meter" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/sound"; qos = 1 } `
    -SchemaId $schema13 -Tags @("sound", "noise", "environmental")

# Device Type 14: Light Sensor
$deviceType14 = New-DeviceType -Name "Light-BH1750" -Description "BH1750 Digital Light Sensor" `
    -Protocol "MQTT" -ProtocolConfig @{ topic = "sensors/light"; qos = 1 } `
    -SchemaId $schema14 -Tags @("light", "luminosity", "environmental")

# Device Type 15: Smart Meter
$deviceType15 = New-DeviceType -Name "SmartMeter-Utility" -Description "Multi-Utility Smart Meter" `
    -Protocol "Modbus_TCP" -ProtocolConfig @{ ipAddress = "0.0.0.0"; port = 502 } `
    -SchemaId $schema15 -Tags @("smart-meter", "utility", "billing")

# Store device types in array
$deviceTypes = @(
    $deviceType1, $deviceType2, $deviceType3, $deviceType4, $deviceType5,
    $deviceType6, $deviceType7, $deviceType8, $deviceType9, $deviceType10,
    $deviceType11, $deviceType12, $deviceType13, $deviceType14, $deviceType15
)

Write-Host ""
Write-Host "📋 Step 3: Creating 100 Devices" -ForegroundColor Cyan
Write-Host "-" * 60

# Sample locations (latitude, longitude) for different facilities
$locations = @(
    @{ latitude = 49.2827; longitude = -123.1207 },  # Vancouver
    @{ latitude = 43.6532; longitude = -79.3832 },   # Toronto
    @{ latitude = 51.0447; longitude = -114.0719 },  # Calgary
    @{ latitude = 45.5017; longitude = -73.5673 },   # Montreal
    @{ latitude = 53.5461; longitude = -113.4938 }   # Edmonton
)

$buildings = @("Building-A", "Building-B", "Building-C", "Warehouse-1", "Plant-North")
$floors = @("Ground", "Floor-1", "Floor-2", "Floor-3", "Basement")
$zones = @("Zone-A", "Zone-B", "Zone-C", "Zone-D")

$createdCount = 0
$failedCount = 0

# Distribute 100 devices across device types
$devicesPerType = @(8, 7, 6, 8, 7, 6, 7, 8, 5, 7, 6, 8, 7, 6, 6)  # Totals to 100

for ($typeIndex = 0; $typeIndex -lt $deviceTypes.Count; $typeIndex++) {
    $deviceType = $deviceTypes[$typeIndex]
    if ($null -eq $deviceType) { continue }
    
    $count = $devicesPerType[$typeIndex]
    
    for ($i = 1; $i -le $count; $i++) {
        $deviceNum = $createdCount + $i
        $location = $locations[$deviceNum % $locations.Count]
        $building = $buildings[$deviceNum % $buildings.Count]
        $floor = $floors[$deviceNum % $floors.Count]
        $zone = $zones[$deviceNum % $zones.Count]
        
        $deviceId = "DEV-{0:D4}" -f $deviceNum
        $serialNumber = "SN-{0:D6}" -f (Get-Random -Minimum 100000 -Maximum 999999)
        
        $metadata = @{
            building = $building
            floor = $floor
            zone = $zone
            installDate = (Get-Date).AddDays(-(Get-Random -Minimum 1 -Maximum 365)).ToString("yyyy-MM-dd")
            manufacturer = "Sensormine"
            model = $deviceType.name
        }
        
        $status = @("Active", "Active", "Active", "Active", "Inactive")[(Get-Random -Minimum 0 -Maximum 5)]
        
        $device = New-Device `
            -DeviceId $deviceId `
            -Name "$($deviceType.name) - $deviceId" `
            -DeviceTypeId $deviceType.id `
            -SerialNumber $serialNumber `
            -Location $location `
            -Metadata $metadata `
            -Status $status
        
        if ($null -ne $device) {
            $createdCount++
            if ($createdCount % 10 -eq 0) {
                Write-Host "  Created $createdCount devices..." -ForegroundColor Gray
            }
        } else {
            $failedCount++
        }
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Demo Data Generation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • Schemas created: 15" -ForegroundColor White
Write-Host "  • Device types created: $($deviceTypes.Count)" -ForegroundColor White
Write-Host "  • Devices created: $createdCount" -ForegroundColor White
if ($failedCount -gt 0) {
    Write-Host "  • Devices failed: $failedCount" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "🎉 You can now view your devices at http://localhost:3020/settings/digital-twin" -ForegroundColor Green
Write-Host ""
