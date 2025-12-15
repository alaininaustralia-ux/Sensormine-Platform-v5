# Quick Start AI Agent

Write-Host "🚀 Starting AI Agent Demo" -ForegroundColor Cyan

# Check if MCP Server is running
$mcpRunning = Get-NetTCPConnection -LocalPort 5400 -ErrorAction SilentlyContinue

if (-not $mcpRunning) {
    Write-Host "Starting MCP Server..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd C:\Users\AlainBlanchette\code\Orion\src\Services\Sensormine.MCP.Server; dotnet run"
    Write-Host "Waiting for MCP Server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "✅ MCP Server ready on port 5400" -ForegroundColor Green
Write-Host "✅ Frontend running on port 3020" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Opening AI Agent..." -ForegroundColor Cyan
Start-Process "http://localhost:3020/ai-agent"

Write-Host ""
Write-Host "💡 Try these queries:" -ForegroundColor Yellow
Write-Host "   • Show me temperature data for the last 24 hours" -ForegroundColor Gray
Write-Host "   • List all online devices" -ForegroundColor Gray
Write-Host "   • Display asset hierarchy" -ForegroundColor Gray
