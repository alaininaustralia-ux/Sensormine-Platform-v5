# AI Agent Multi-Turn Test Script
# Tests the enhanced AI agent with complex queries requiring multiple tool calls

Write-Host "🤖 AI Agent Multi-Turn Test Script" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5401"
$tenantId = "00000000-0000-0000-0000-000000000001"

# Test 1: Simple query (1-2 iterations)
Write-Host "Test 1: Simple Query - List Devices" -ForegroundColor Yellow
$query1 = @{ query = "List all devices" } | ConvertTo-Json
try {
    $result1 = Invoke-RestMethod -Uri "$baseUrl/api/ai/query" `
        -Method POST `
        -Headers @{"X-Tenant-Id"=$tenantId; "Content-Type"="application/json"} `
        -Body $query1
    
    Write-Host "✅ Response: $($result1.response)" -ForegroundColor Green
    Write-Host "   Tools Called: $($result1.toolsCalled -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: Complex query (3-5 iterations)
Write-Host "Test 2: Complex Query - Which device has the most data?" -ForegroundColor Yellow
$query2 = @{ query = "Which device has the most data?" } | ConvertTo-Json
try {
    $result2 = Invoke-RestMethod -Uri "$baseUrl/api/ai/query" `
        -Method POST `
        -Headers @{"X-Tenant-Id"=$tenantId; "Content-Type"="application/json"} `
        -Body $query2
    
    Write-Host "✅ Response: $($result2.response)" -ForegroundColor Green
    Write-Host "   Tools Called: $($result2.toolsCalled -join ', ')" -ForegroundColor Gray
    Write-Host "   Iterations: $($result2.toolsCalled.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Telemetry query (2-3 iterations)
Write-Host "Test 3: Telemetry Query - Temperature data last 24 hours" -ForegroundColor Yellow
$query3 = @{ query = "Show me temperature data for the last 24 hours" } | ConvertTo-Json
try {
    $result3 = Invoke-RestMethod -Uri "$baseUrl/api/ai/query" `
        -Method POST `
        -Headers @{"X-Tenant-Id"=$tenantId; "Content-Type"="application/json"} `
        -Body $query3
    
    Write-Host "✅ Response: $($result3.response)" -ForegroundColor Green
    Write-Host "   Tools Called: $($result3.toolsCalled -join ', ')" -ForegroundColor Gray
    if ($result3.chartData) {
        Write-Host "   📊 Chart Data Available: $($result3.chartData.series.Count) series" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Comparative query (5-8 iterations)
Write-Host "Test 4: Comparative Query - Compare all sensors" -ForegroundColor Yellow
$query4 = @{ query = "Compare the data volumes across all sensors and tell me which ones are most active" } | ConvertTo-Json
try {
    $result4 = Invoke-RestMethod -Uri "$baseUrl/api/ai/query" `
        -Method POST `
        -Headers @{"X-Tenant-Id"=$tenantId; "Content-Type"="application/json"} `
        -Body $query4
    
    Write-Host "✅ Response: $($result4.response)" -ForegroundColor Green
    Write-Host "   Tools Called: $($result4.toolsCalled -join ', ')" -ForegroundColor Gray
    Write-Host "   Iterations: $($result4.toolsCalled.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n==================================`n" -ForegroundColor Cyan
Write-Host "✨ Test Complete!" -ForegroundColor Green
Write-Host "`nNote: Ensure AI.API and MCP Server are running:" -ForegroundColor Yellow
Write-Host "  - AI.API: http://localhost:5401" -ForegroundColor Gray
Write-Host "  - MCP Server: http://localhost:5400" -ForegroundColor Gray
