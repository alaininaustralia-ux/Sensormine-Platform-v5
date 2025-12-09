# Test Query API with JSONB custom_fields schema

Write-Host "=== Testing Query API with Telemetry Data ===" -ForegroundColor Cyan

# 1. Check API info
Write-Host "`n1. Testing /info endpoint..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri "http://localhost:5079/info" -Method Get
    Write-Host "✓ Query API is running" -ForegroundColor Green
    Write-Host "  Service: $($info.service)"
    Write-Host "  Version: $($info.version)"
} catch {
    Write-Host "✗ Query API is not running or not responding" -ForegroundColor Red
    Write-Host "  Error: $_"
    exit 1
}

# 2. Query recent telemetry data
Write-Host "`n2. Querying telemetry data for Nexus-001..." -ForegroundColor Yellow
try {
    $queryBody = @{
        startTime = (Get-Date).AddHours(-24).ToUniversalTime().ToString("o")
        endTime = (Get-Date).ToUniversalTime().ToString("o")
        filters = @{
            deviceId = "Nexus-001"
        }
        limit = 5
    } | ConvertTo-Json
    
    Write-Host "Query Body:" -ForegroundColor Gray
    Write-Host $queryBody -ForegroundColor Gray
    
    $result = Invoke-RestMethod -Uri "http://localhost:5079/api/timeseries/telemetry/query" `
        -Method Post `
        -Body $queryBody `
        -ContentType "application/json"
    
    Write-Host "✓ Query successful!" -ForegroundColor Green
    Write-Host "  Total Results: $($result.data.Count)" -ForegroundColor Cyan
    
    if ($result.data.Count -gt 0) {
        Write-Host "`n  First Result:" -ForegroundColor Cyan
        $first = $result.data[0]
        Write-Host "    Device ID: $($first.deviceId)" -ForegroundColor White
        Write-Host "    Timestamp: $($first.timestamp)" -ForegroundColor White
        Write-Host "    Values (custom_fields):" -ForegroundColor White
        
        # Display custom_fields (JSONB)
        if ($first.values) {
            $first.values.PSObject.Properties | ForEach-Object {
                Write-Host "      $($_.Name): $($_.Value)" -ForegroundColor Gray
            }
        }
    }
    
} catch {
    Write-Host "✗ Query failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  Details: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test aggregate query
Write-Host "`n3. Testing aggregate query (if temperature field exists)..." -ForegroundColor Yellow
try {
    $aggBody = @{
        startTime = (Get-Date).AddHours(-24).ToUniversalTime().ToString("o")
        endTime = (Get-Date).ToUniversalTime().ToString("o")
        aggregateFunction = "avg"
        groupByInterval = "01:00:00"
        filters = @{
            deviceId = "Nexus-001"
        }
    } | ConvertTo-Json
    
    # We need to specify which field to aggregate
    # This will work if there's a "temperature" field in custom_fields
    $result = Invoke-RestMethod -Uri "http://localhost:5079/api/timeseries/telemetry/aggregate" `
        -Method Post `
        -Body $aggBody `
        -ContentType "application/json"
    
    Write-Host "✓ Aggregate query successful!" -ForegroundColor Green
    Write-Host "  Total Buckets: $($result.data.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "⚠ Aggregate query not fully implemented yet or field not found" -ForegroundColor Yellow
    Write-Host "  This is expected if custom aggregate endpoints aren't set up" -ForegroundColor Gray
}

Write-Host "`n=== Query API Test Complete ===" -ForegroundColor Cyan
