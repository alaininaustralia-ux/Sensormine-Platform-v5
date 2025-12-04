# Import User Stories to GitHub Issues
# This script parses user-stories.md and creates GitHub issues

$ErrorActionPreference = "Stop"

# Read the user stories file
$content = Get-Content -Path "../docs/user-stories.md" -Raw

# Parse epics and stories
$currentEpic = ""
$epicPattern = '## Epic (\d+): (.+)'
$storyPattern = '### Story (\d+\.\d+): (.+)'

# Split content into lines for processing
$lines = $content -split "`n"

$stories = @()
$currentStory = $null

foreach ($line in $lines) {
    # Check if this is an epic header
    if ($line -match $epicPattern) {
        $epicNumber = $Matches[1]
        $epicTitle = $Matches[2]
        $currentEpic = "Epic $epicNumber - $epicTitle"
        Write-Host "Found Epic: $currentEpic" -ForegroundColor Cyan
    }
    
    # Check if this is a story header
    if ($line -match $storyPattern) {
        # Save previous story if exists
        if ($currentStory) {
            $stories += $currentStory
        }
        
        $storyNumber = $Matches[1]
        $storyTitle = $Matches[2]
        
        $currentStory = @{
            Number = $storyNumber
            Title = $storyTitle
            Epic = $currentEpic
            Body = ""
            Priority = ""
            StoryPoints = ""
        }
        
        Write-Host "  Found Story: $storyNumber - $storyTitle" -ForegroundColor Green
    }
    
    # Collect story content
    if ($currentStory -and $line) {
        # Extract priority
        if ($line -match '^\*\*Priority:\*\*\s*(.+)') {
            $currentStory.Priority = $Matches[1]
        }
        
        # Extract story points
        if ($line -match '^\*\*Story Points:\*\*\s*(\d+)') {
            $currentStory.StoryPoints = $Matches[1]
        }
        
        # Add to body (exclude title and metadata lines)
        if ($line -notmatch $storyPattern -and 
            $line -notmatch '^\*\*Priority:' -and 
            $line -notmatch '^\*\*Story Points:' -and
            $line -notmatch '^---$' -and
            $line -notmatch '^\s*$') {
            $currentStory.Body += $line + "`n"
        }
    }
}

# Add the last story
if ($currentStory) {
    $stories += $currentStory
}

Write-Host "`nTotal stories found: $($stories.Count)" -ForegroundColor Yellow

# Create GitHub issues
Write-Host "`nCreating GitHub issues..." -ForegroundColor Cyan

foreach ($story in $stories) {
    $issueTitle = "[$($story.Number)] $($story.Title)"
    
    # Build issue body
    $issueBody = $story.Body + "`n`n"
    $issueBody += "**Epic:** $($story.Epic)`n"
    $issueBody += "**Priority:** $($story.Priority)`n"
    $issueBody += "**Story Points:** $($story.StoryPoints)`n"
    
    # Build labels
    $labels = @()
    $labels += "user-story"
    $labels += $story.Epic -replace ' ', '-'
    
    # Add priority label
    switch ($story.Priority) {
        "High" { $labels += "priority:high" }
        "Medium" { $labels += "priority:medium" }
        "Low" { $labels += "priority:low" }
    }
    
    # Add story point label
    if ($story.StoryPoints) {
        $labels += "points:$($story.StoryPoints)"
    }
    
    try {
        Write-Host "Creating issue: $issueTitle" -ForegroundColor Green
        
        # Write body to temporary file to avoid escaping issues
        $tempFile = [System.IO.Path]::GetTempFileName()
        $issueBody | Out-File -FilePath $tempFile -Encoding utf8
        
        # Create the issue using body file
        $result = gh issue create --title $issueTitle --body-file $tempFile --repo alaininaustralia-ux/Sensormine-Platform-v5
        
        # Clean up temp file
        Remove-Item $tempFile -Force
        
        Write-Host "  Created: $result" -ForegroundColor Gray
        
        # Add small delay to avoid rate limiting
        Start-Sleep -Milliseconds 500
    }
    catch {
        Write-Host "  Error creating issue: $_" -ForegroundColor Red
    }
}

Write-Host "`nDone! All user stories have been imported as GitHub issues." -ForegroundColor Green
Write-Host "View them at: https://github.com/alaininaustralia-ux/Sensormine-Platform-v5/issues" -ForegroundColor Cyan
