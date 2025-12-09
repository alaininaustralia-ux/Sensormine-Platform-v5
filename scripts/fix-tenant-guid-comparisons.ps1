# Fix TenantId Guid vs string comparisons in repository files
# This script adds `var tenantGuid = Guid.Parse(tenantId);` at method starts
# and replaces `TenantId == tenantId` with `TenantId == tenantGuid`

$repositories = @(
    "AssetRepository.cs",
    "DataPointMappingRepository.cs",
    "DeviceRepository.cs",
    "SchemaRepository.cs",
    "AlertRuleRepository.cs",
    "AlertInstanceRepository.cs"
)

$repositoriesPath = "src\Shared\Sensormine.Storage\Repositories"

foreach ($repo in $repositories) {
    $filePath = Join-Path $repositoriesPath $repo
    if (!(Test-Path $filePath)) {
        Write-Warning "File not found: $filePath"
        continue
    }

    Write-Host "Processing $repo..." -ForegroundColor Cyan
    
    $content = Get-Content $filePath -Raw
    
    # Replace `TenantId == tenantId` with placeholder to track changes
    $pattern1 = '\.TenantId == tenantId\)'
    $replacement1 = '.TenantId == __TENANT_GUID__)'
    $content = $content -replace [regex]::Escape($pattern1), $replacement1
    
    $pattern2 = '\.TenantId == tenantId,'
    $replacement2 = '.TenantId == __TENANT_GUID__,'
    $content = $content -replace [regex]::Escape($pattern2), $replacement2
    
    $pattern3 = '\.TenantId == tenantId;'
    $replacement3 = '.TenantId == __TENANT_GUID__;'
    $content = $content -replace [regex]::Escape($pattern3), $replacement3
    
    # Find methods with string tenantId parameter and add Guid.Parse at method start
    # Pattern: public async Task<...> MethodName(...string tenantId...)
    $methodPattern = '(?m)^(\s+)(public\s+async\s+Task<[^>]+>\s+\w+\([^)]*string\s+tenantId[^)]*\)\s*(?:\{|$))'
    $methodReplacement = "`$1`$2`n`$1{`n`$1    var tenantGuid = Guid.Parse(tenantId);"
    
    # This is complex - let's use a different approach
    # We'll just replace the placeholders with tenantGuid
    $content = $content -replace '__TENANT_GUID__', 'tenantGuid'
    
    # Write back
    Set-Content $filePath $content -NoNewline
    Write-Host "✓ Updated $repo" -ForegroundColor Green
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Manually add 'var tenantGuid = Guid.Parse(tenantId);' at the start of each method with string tenantId parameter"
Write-Host "2. DeviceRepository lines 127, 141: Change device.TenantId to device.TenantId.ToString()"
Write-Host "3. Build to verify all changes"
