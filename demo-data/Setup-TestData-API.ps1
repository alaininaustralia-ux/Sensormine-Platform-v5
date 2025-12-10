# Setup test data using REST APIs
$ErrorActionPreference = "Continue"

# Configuration
$tenantId = "00000000-0000-0000-0000-000000000001"
$deviceApiUrl = "http://localhost:5293"
$schemaApiUrl = "http://localhost:5021"

Write-Host "🗑️  Cleaning up existing test data..." -ForegroundColor Yellow

# Clean up using direct DB access
$env:PGPASSWORD = "postgres"
psql -h localhost -p 5432 -U postgres -d sensormine -c "DELETE FROM devices WHERE tenant_id = '$tenantId';"
psql -h localhost -p 5432 -U postgres -d sensormine -c "DELETE FROM device_types WHERE tenant_id = '$tenantId';"
psql -h localhost -p 5432 -U postgres -d sensormine -c "DELETE FROM schemas WHERE tenant_id = '$tenantId';"

Write-Host "✅ Cleanup complete`n" -ForegroundColor Green

# Function to create schema via API
function Create-Schema {
    param (
        [string]$Name,
        [string]$Description,
        [hashtable]$SchemaDefinition
    )
    
    $body = @{
        name = $Name
        description = $Description
        version = "1.0"
        schemaDefinition = $SchemaDefinition
        isActive = $true
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$schemaApiUrl/api/schemas?tenantId=$tenantId" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        Write-Host "  ✓ Created schema: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "  ✗ Failed to create schema $Name : $_" -ForegroundColor Red
        return $null
    }
}

# Function to create device type
function Create-DeviceType {
    param (
        [string]$Name,
        [string]$Description,
        [string]$Manufacturer,
        [string]$Model,
        [string]$SchemaId
    )
    
    $body = @{
        name = $Name
        description = $Description
        manufacturer = $Manufacturer
        model = $Model
        schemaId = $SchemaId
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$deviceApiUrl/api/device-types?tenantId=$tenantId" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        Write-Host "  ✓ Created device type: $Name (ID: $($response.id))" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "  ✗ Failed to create device type $Name : $_" -ForegroundColor Red
        return $null
    }
}

# Function to create device
function Create-Device {
    param (
        [string]$Name,
        [string]$DeviceId,
        [string]$DeviceTypeId,
        [string]$Location
    )
    
    $body = @{
        name = $Name
        deviceId = $DeviceId
        deviceTypeId = $DeviceTypeId
        location = $Location
        isActive = $true
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$deviceApiUrl/api/devices?tenantId=$tenantId" `
            -Method Post `
            -Body $body `
            -ContentType "application/json"
        Write-Host "  ✓ Created device: $Name" -ForegroundColor Green
        return $response.id
    } catch {
        Write-Host "  ✗ Failed to create device $Name : $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "📝 Creating schemas..." -ForegroundColor Cyan

# 1. Temperature Sensor
$tempSchema = Create-Schema `
    -Name "Temperature Sensor" `
    -Description "Basic temperature sensor with battery monitoring" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            temperature = @{
                type = "number"
                minimum = -40
                maximum = 85
                unit = "°C"
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
        }
        required = @("temperature")
    }

# 2. Temperature & Humidity Sensor
$tempHumidSchema = Create-Schema `
    -Name "Temperature & Humidity Sensor" `
    -Description "Combined temperature and humidity sensor" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            temperature = @{
                type = "number"
                minimum = -40
                maximum = 85
                unit = "°C"
            }
            humidity = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%RH"
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
        }
        required = @("temperature", "humidity")
    }

# 3. Pressure Sensor
$pressureSchema = Create-Schema `
    -Name "Pressure Sensor" `
    -Description "Barometric pressure sensor with temperature" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            pressure = @{
                type = "number"
                minimum = 800
                maximum = 1100
                unit = "hPa"
            }
            temperature = @{
                type = "number"
                minimum = -40
                maximum = 85
                unit = "°C"
            }
            altitude = @{
                type = "number"
                minimum = -500
                maximum = 9000
                unit = "m"
            }
        }
        required = @("pressure")
    }

# 4. Door/Window Sensor
$doorSchema = Create-Schema `
    -Name "Door/Window Sensor" `
    -Description "Magnetic door and window contact sensor" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            status = @{
                type = "string"
                enum = @("open", "closed")
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
            signal_strength = @{
                type = "number"
                minimum = -120
                maximum = 0
                unit = "dBm"
            }
        }
        required = @("status")
    }

# 5. Water Leak Detector
$leakSchema = Create-Schema `
    -Name "Water Leak Detector" `
    -Description "Water leak detection sensor" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            leak_detected = @{
                type = "boolean"
            }
            water_present = @{
                type = "boolean"
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
        }
        required = @("leak_detected", "water_present")
    }

# 6. Flood Monitoring Station (Complex Multi-Sensor)
$floodSchema = Create-Schema `
    -Name "Flood Monitoring Station" `
    -Description "Comprehensive flood monitoring with GPS, float switch, temperature, and water height" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            location = @{
                type = "object"
                properties = @{
                    latitude = @{
                        type = "number"
                        minimum = -90
                        maximum = 90
                    }
                    longitude = @{
                        type = "number"
                        minimum = -180
                        maximum = 180
                    }
                    altitude = @{
                        type = "number"
                        unit = "m"
                    }
                }
                required = @("latitude", "longitude")
            }
            water_height = @{
                type = "number"
                minimum = 0
                maximum = 500
                unit = "cm"
            }
            float_switch = @{
                type = "boolean"
            }
            water_temperature = @{
                type = "number"
                minimum = -10
                maximum = 50
                unit = "°C"
            }
            ambient_temperature = @{
                type = "number"
                minimum = -40
                maximum = 85
                unit = "°C"
            }
            flood_alert = @{
                type = "boolean"
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
            signal_strength = @{
                type = "number"
                minimum = -120
                maximum = 0
                unit = "dBm"
            }
        }
        required = @("location", "water_height", "float_switch", "water_temperature")
    }

# 7. Environmental Monitor
$envSchema = Create-Schema `
    -Name "Environmental Monitor" `
    -Description "Multi-parameter environmental monitoring station" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            temperature = @{
                type = "number"
                minimum = -40
                maximum = 85
                unit = "°C"
            }
            humidity = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%RH"
            }
            pressure = @{
                type = "number"
                minimum = 800
                maximum = 1100
                unit = "hPa"
            }
            light_level = @{
                type = "number"
                minimum = 0
                maximum = 200000
                unit = "lux"
            }
            uv_index = @{
                type = "number"
                minimum = 0
                maximum = 15
            }
            air_quality_index = @{
                type = "number"
                minimum = 0
                maximum = 500
            }
        }
        required = @("temperature", "humidity", "pressure")
    }

# 8. Motion Sensor
$motionSchema = Create-Schema `
    -Name "Motion Sensor" `
    -Description "PIR motion and occupancy sensor" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            motion_detected = @{
                type = "boolean"
            }
            occupancy = @{
                type = "boolean"
            }
            light_level = @{
                type = "number"
                minimum = 0
                maximum = 1000
                unit = "lux"
            }
            battery = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
        }
        required = @("motion_detected")
    }

# 9. Vibration Sensor
$vibrationSchema = Create-Schema `
    -Name "Vibration Sensor" `
    -Description "Industrial vibration monitoring sensor" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            vibration_x = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "mm/s"
            }
            vibration_y = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "mm/s"
            }
            vibration_z = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "mm/s"
            }
            temperature = @{
                type = "number"
                minimum = -40
                maximum = 150
                unit = "°C"
            }
            frequency = @{
                type = "number"
                minimum = 0
                maximum = 10000
                unit = "Hz"
            }
        }
        required = @("vibration_x", "vibration_y", "vibration_z")
    }

# 10. Tank Level Sensor
$tankSchema = Create-Schema `
    -Name "Tank Level Sensor" `
    -Description "Liquid tank level monitoring with flow rate" `
    -SchemaDefinition @{
        type = "object"
        properties = @{
            water_level = @{
                type = "number"
                minimum = 0
                maximum = 100
                unit = "%"
            }
            water_height = @{
                type = "number"
                minimum = 0
                maximum = 1000
                unit = "cm"
            }
            water_temperature = @{
                type = "number"
                minimum = 0
                maximum = 50
                unit = "°C"
            }
            flow_rate = @{
                type = "number"
                minimum = 0
                maximum = 1000
                unit = "L/min"
            }
            pump_status = @{
                type = "string"
                enum = @("on", "off", "auto")
            }
        }
        required = @("water_level", "water_height")
    }

Write-Host "`n🏭 Creating device types..." -ForegroundColor Cyan

# Create device types
$tempTypeId = Create-DeviceType -Name "DS18B20 Temperature Sensor" -Description "Dallas DS18B20 digital temperature sensor" -Manufacturer "Dallas/Maxim" -Model "DS18B20" -SchemaId $tempSchema
$tempHumidTypeId = Create-DeviceType -Name "DHT22 Sensor" -Description "Digital temperature and humidity sensor" -Manufacturer "Aosong" -Model "DHT22" -SchemaId $tempHumidSchema
$doorTypeId = Create-DeviceType -Name "MC-38 Door Sensor" -Description "Magnetic contact door/window sensor" -Manufacturer "Generic" -Model "MC-38" -SchemaId $doorSchema
$leakTypeId = Create-DeviceType -Name "Water Leak Detector" -Description "Water presence detection sensor" -Manufacturer "Generic" -Model "WLD-01" -SchemaId $leakSchema
$floodTypeId = Create-DeviceType -Name "Flood Monitoring Station" -Description "Multi-sensor flood monitoring system with GPS" -Manufacturer "HydroWatch" -Model "FMS-2000" -SchemaId $floodSchema

Write-Host "`n📱 Creating test devices..." -ForegroundColor Cyan

# Create devices
Create-Device -Name "Temperature-Office-001" -DeviceId "TEMP-001" -DeviceTypeId $tempTypeId -Location "Office Room 101"
Create-Device -Name "Temperature-Warehouse-001" -DeviceId "TEMP-002" -DeviceTypeId $tempTypeId -Location "Warehouse Zone A"
Create-Device -Name "Humidity-Datacenter-001" -DeviceId "DHT-001" -DeviceTypeId $tempHumidTypeId -Location "Data Center"
Create-Device -Name "Humidity-Storage-001" -DeviceId "DHT-002" -DeviceTypeId $tempHumidTypeId -Location "Storage Area"
Create-Device -Name "DoorWindow-MC38 - DEV-0058" -DeviceId "DOOR-001" -DeviceTypeId $doorTypeId -Location "Front Entrance"
Create-Device -Name "DoorWindow-MC38 - DEV-0060" -DeviceId "DOOR-002" -DeviceTypeId $doorTypeId -Location "Back Door"
Create-Device -Name "DoorWindow-MC38 - DEV-0062" -DeviceId "DOOR-003" -DeviceTypeId $doorTypeId -Location "Window Office 201"
Create-Device -Name "LeakDetector-WLD01 - DEV-0057" -DeviceId "LEAK-001" -DeviceTypeId $leakTypeId -Location "Server Room"
Create-Device -Name "LeakDetector-WLD01 - DEV-0059" -DeviceId "LEAK-002" -DeviceTypeId $leakTypeId -Location "Basement"
Create-Device -Name "FloodMonitor-River-001" -DeviceId "FLOOD-001" -DeviceTypeId $floodTypeId -Location "Main River Station"
Create-Device -Name "FloodMonitor-Creek-002" -DeviceId "FLOOD-002" -DeviceTypeId $floodTypeId -Location "Tributary Creek"
Create-Device -Name "FloodMonitor-Lake-003" -DeviceId "FLOOD-003" -DeviceTypeId $floodTypeId -Location "Lake Outflow"

Write-Host "`n✨ Test data setup complete!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  - 10 schemas created" -ForegroundColor White
Write-Host "  - 5 device types created" -ForegroundColor White
Write-Host "  - 12 devices created" -ForegroundColor White
Write-Host "  - All devices linked to schemas via device types" -ForegroundColor White
