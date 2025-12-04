# Import only Epic 12 (Billing) user stories to GitHub
$ErrorActionPreference = "Stop"

$stories = @(
    @{Number="12.1"; Title="Usage Metering Infrastructure"; Priority="High"; Points=21},
    @{Number="12.2"; Title="Stripe Integration for Payments"; Priority="High"; Points=13},
    @{Number="12.3"; Title="Subscription Plan Management"; Priority="High"; Points=13},
    @{Number="12.4"; Title="Automated Invoice Generation"; Priority="High"; Points=13},
    @{Number="12.5"; Title="Tenant Billing Portal"; Priority="High"; Points=13},
    @{Number="12.6"; Title="Resource Quota Enforcement"; Priority="High"; Points=13},
    @{Number="12.7"; Title="Multi-Currency Support"; Priority="Medium"; Points=8},
    @{Number="12.8"; Title="Revenue Analytics Dashboard"; Priority="Medium"; Points=13},
    @{Number="12.9"; Title="Billing Webhooks and Events"; Priority="High"; Points=8},
    @{Number="12.10"; Title="Sub-Tenant Billing Allocation"; Priority="Medium"; Points=13},
    @{Number="12.11"; Title="Promotional Codes and Discounts"; Priority="Low"; Points=8},
    @{Number="12.12"; Title="Payment Method Compliance"; Priority="High"; Points=8}
)

Write-Host "Creating 12 new Epic 12 (Billing & Payments) user stories..." -ForegroundColor Cyan

foreach ($story in $stories) {
    $issueTitle = "[$($story.Number)] $($story.Title)"
    
    # Read the full story from the markdown file
    $content = Get-Content -Path "../docs/user-stories.md" -Raw
    $pattern = "### Story $($story.Number): $($story.Title)[\s\S]*?(?=(?:###|##|\z))"
    
    if ($content -match $pattern) {
        $storyContent = $Matches[0]
        
        # Write to temp file
        $tempFile = [System.IO.Path]::GetTempFileName()
        $fullBody = $storyContent + "`n`n**Epic:** Epic 12 - Billing, Metering & Payments`n"
        $fullBody | Out-File -FilePath $tempFile -Encoding utf8
        
        try {
            Write-Host "Creating: $issueTitle" -ForegroundColor Green
            $result = gh issue create --title $issueTitle --body-file $tempFile --repo alaininaustralia-ux/Sensormine-Platform-v5
            Write-Host "  Created: $result" -ForegroundColor Gray
            
            Remove-Item $tempFile -Force
            Start-Sleep -Milliseconds 500
        }
        catch {
            Write-Host "  Error: $_" -ForegroundColor Red
            Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
        }
    }
    else {
        Write-Host "  Warning: Could not find story content for $($story.Number)" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Created 12 new billing & payments user stories." -ForegroundColor Green
Write-Host "View them at: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues" -ForegroundColor Cyan
