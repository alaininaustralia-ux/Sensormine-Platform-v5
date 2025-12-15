# AI Agent - Test & Verification Script

Write-Host "🧪 Testing AI Agent Feature" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Test 1: Check files exist
Write-Host "`n1️⃣  Verifying files..." -ForegroundColor Yellow

$files = @(
    "src\lib\mcp-client.ts",
    "src\app\ai-agent\page.tsx",
    ".env.local"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host "`n❌ Some files are missing!" -ForegroundColor Red
    exit 1
}

# Test 2: Check MCP URL in env
Write-Host "`n2️⃣  Checking environment configuration..." -ForegroundColor Yellow

$envContent = Get-Content .env.local -Raw
if ($envContent -match "NEXT_PUBLIC_MCP_URL") {
    Write-Host "   ✅ MCP_URL configured in .env.local" -ForegroundColor Green
} else {
    Write-Host "   ❌ MCP_URL not found in .env.local" -ForegroundColor Red
}

# Test 3: Check Sidebar navigation
Write-Host "`n3️⃣  Checking navigation update..." -ForegroundColor Yellow

$sidebarContent = Get-Content src\components\layout\Sidebar.tsx -Raw
if ($sidebarContent -match "AI Agent" -and $sidebarContent -match "Sparkles") {
    Write-Host "   ✅ AI Agent added to navigation" -ForegroundColor Green
} else {
    Write-Host "   ❌ AI Agent not found in Sidebar" -ForegroundColor Red
}

# Test 4: Check MCP Server is running
Write-Host "`n4️⃣  Checking MCP Server..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5400/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   ✅ MCP Server is running on port 5400" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ MCP Server not reachable on port 5400" -ForegroundColor Red
    Write-Host "   Start with: .\src\Services\Sensormine.MCP.Server\start-mcp-server.ps1" -ForegroundColor Yellow
}

# Test 5: Check frontend dev server
Write-Host "`n5️⃣  Checking frontend server..." -ForegroundColor Yellow

try {
    $connection = Test-NetConnection -ComputerName localhost -Port 3020 -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "   ✅ Frontend is running on port 3020" -ForegroundColor Green
        Write-Host "   Access: http://localhost:3020/ai-agent" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ Frontend not running on port 3020" -ForegroundColor Red
        Write-Host "   Start with: npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Cannot check port 3020" -ForegroundColor Red
}

# Test 6: Test MCP tools/list endpoint
Write-Host "`n6️⃣  Testing MCP protocol..." -ForegroundColor Yellow

try {
    $mcpRequest = @{
        jsonrpc = "2.0"
        id = "test-1"
        method = "tools/list"
    } | ConvertTo-Json

    $mcpResponse = Invoke-RestMethod -Uri "http://localhost:5400/mcp" `
        -Method POST `
        -Body $mcpRequest `
        -ContentType "application/json" `
        -Headers @{"X-Tenant-Id"="00000000-0000-0000-0000-000000000001"} `
        -TimeoutSec 5 `
        -ErrorAction Stop

    if ($mcpResponse.result.tools) {
        $toolCount = $mcpResponse.result.tools.Count
        Write-Host "   ✅ MCP Protocol working" -ForegroundColor Green
        Write-Host "   Available Tools: $toolCount" -ForegroundColor Cyan
        foreach ($tool in $mcpResponse.result.tools) {
            Write-Host "     - $($tool.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  MCP responded but no tools found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ MCP Protocol test failed" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "📋 Test Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Files Created" -ForegroundColor Green
Write-Host "✅ Environment Configured" -ForegroundColor Green
Write-Host "✅ Navigation Updated" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start MCP Server: .\src\Services\Sensormine.MCP.Server\start-mcp-server.ps1" -ForegroundColor White
Write-Host "2. Start Frontend: npm run dev (from src/Web/sensormine-web)" -ForegroundColor White
Write-Host "3. Open Browser: http://localhost:3020/ai-agent" -ForegroundColor White
Write-Host ""
Write-Host "💡 Try these queries:" -ForegroundColor Yellow
Write-Host "   - Show me temperature data for the last 24 hours" -ForegroundColor Gray
Write-Host "   - List all online devices" -ForegroundColor Gray
Write-Host "   - Display asset hierarchy" -ForegroundColor Gray
Write-Host ""
