# Sensormine Platform - Azure Setup Script
# This script sets up the initial Azure infrastructure for Terraform state management
# and configures GitHub repository secrets for automated deployment

param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$GitHubRepo = "Sensormine-Platform-v5"
)

# Ensure we're logged into Azure
Write-Host "🔐 Checking Azure login status..." -ForegroundColor Cyan
$azAccount = az account show 2>$null | ConvertFrom-Json
if (-not $azAccount) {
    Write-Host "❌ Not logged into Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

# Validate subscription ID format
if ($SubscriptionId -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') {
    Write-Host "❌ Invalid subscription ID format. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" -ForegroundColor Red
    Write-Host "Your current subscriptions:" -ForegroundColor Yellow
    az account list --output table
    exit 1
}

# Set subscription
Write-Host "📋 Setting subscription to: $SubscriptionId" -ForegroundColor Cyan
$setResult = az account set --subscription $SubscriptionId 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set subscription. Error: $setResult" -ForegroundColor Red
    Write-Host "`nAvailable subscriptions:" -ForegroundColor Yellow
    az account list --output table
    exit 1
}

# Variables
$resourceGroupName = "sensormine-tfstate-rg"
$randomSuffix = Get-Random -Minimum 1000 -Maximum 9999
$storageAccountName = "sensorminestate$randomSuffix"
$containerName = "tfstate"
$servicePrincipalName = "sensormine-github-actions"

Write-Host "Generated storage account name: $storageAccountName" -ForegroundColor Cyan

Write-Host "`n🚀 Starting Sensormine Platform Azure Setup" -ForegroundColor Green
Write-Host "=" * 60

# Step 0: Register required resource providers
Write-Host "`n🔧 Step 0: Registering required Azure resource providers..." -ForegroundColor Yellow
$requiredProviders = @(
    "Microsoft.Storage",
    "Microsoft.ContainerService",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Cache",
    "Microsoft.ContainerRegistry",
    "Microsoft.EventHub",
    "Microsoft.KeyVault",
    "Microsoft.Devices",
    "Microsoft.Insights",
    "Microsoft.OperationalInsights",
    "Microsoft.Network"
)

foreach ($provider in $requiredProviders) {
    $state = az provider show --namespace $provider --query "registrationState" -o tsv 2>$null
    if ($state -ne "Registered") {
        Write-Host "  Registering $provider..." -ForegroundColor Yellow
        az provider register --namespace $provider --wait
    } else {
        Write-Host "  ✓ $provider already registered" -ForegroundColor Green
    }
}
Write-Host "✅ All required providers registered" -ForegroundColor Green

# Step 1: Create Resource Group for Terraform State
Write-Host "`n📦 Step 1: Creating resource group for Terraform state..." -ForegroundColor Yellow
az group create `
    --name $resourceGroupName `
    --location $Location `
    --tags "Project=Sensormine" "Purpose=TerraformState" "ManagedBy=Script"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Resource group created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create resource group" -ForegroundColor Red
    exit 1
}

# Step 2: Create Storage Account for Terraform State
Write-Host "`n💾 Step 2: Creating storage account for Terraform state..." -ForegroundColor Yellow
az storage account create `
    --name $storageAccountName `
    --resource-group $resourceGroupName `
    --location $Location `
    --sku Standard_LRS `
    --encryption-services blob `
    --https-only true `
    --min-tls-version TLS1_2 `
    --allow-blob-public-access false `
    --tags "Project=Sensormine" "Purpose=TerraformState"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Storage account created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create storage account" -ForegroundColor Red
    exit 1
}

# Step 3: Create Blob Container
Write-Host "`n📂 Step 3: Creating blob container for state files..." -ForegroundColor Yellow
az storage container create `
    --name $containerName `
    --account-name $storageAccountName `
    --auth-mode login

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Blob container created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create blob container" -ForegroundColor Red
    exit 1
}

# Step 4: Create Service Principal for GitHub Actions
Write-Host "`n🔑 Step 4: Creating service principal for GitHub Actions..." -ForegroundColor Yellow
$spOutput = az ad sp create-for-rbac `
    --name $servicePrincipalName `
    --role Contributor `
    --scopes "/subscriptions/$SubscriptionId" `
    --sdk-auth | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service principal created successfully" -ForegroundColor Green
    $clientId = $spOutput.clientId
    $clientSecret = $spOutput.clientSecret
    $tenantId = $spOutput.tenantId
} else {
    Write-Host "❌ Failed to create service principal" -ForegroundColor Red
    exit 1
}

# Step 5: Generate strong database password
Write-Host "`n🔐 Step 5: Generating secure database password..." -ForegroundColor Yellow
$dbPassword = -join ((48..57) + (65..90) + (97..122) + (33..47) | Get-Random -Count 24 | ForEach-Object {[char]$_})
Write-Host "✅ Database password generated" -ForegroundColor Green

# Step 6: Display configuration summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 Azure Setup Complete!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Subscription ID:      $SubscriptionId"
Write-Host "  Resource Group:       $resourceGroupName"
Write-Host "  Storage Account:      $storageAccountName"
Write-Host "  State Container:      $containerName"
Write-Host "  Service Principal:    $servicePrincipalName"
Write-Host "  Location:             $Location"

# Step 7: GitHub Secrets Configuration
Write-Host "`n🔐 GitHub Secrets Configuration" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "Configure these secrets in your GitHub repository:"
Write-Host "  Repository → Settings → Secrets and variables → Actions → New repository secret`n"

$secrets = @{
    "AZURE_CLIENT_ID" = $clientId
    "AZURE_CLIENT_SECRET" = $clientSecret
    "AZURE_SUBSCRIPTION_ID" = $SubscriptionId
    "AZURE_TENANT_ID" = $tenantId
    "TF_STATE_RG" = $resourceGroupName
    "TF_STATE_STORAGE" = $storageAccountName
    "DB_ADMIN_PASSWORD" = $dbPassword
}

foreach ($secret in $secrets.GetEnumerator()) {
    Write-Host "  [$($secret.Key)]" -ForegroundColor Yellow
    Write-Host "  $($secret.Value)" -ForegroundColor White
    Write-Host ""
}

# Step 8: Save configuration to file
Write-Host "`n💾 Saving configuration..." -ForegroundColor Cyan
$configPath = Join-Path $PSScriptRoot "azure-setup-config.json"
$configData = @{
    subscriptionId = $SubscriptionId
    resourceGroup = $resourceGroupName
    storageAccount = $storageAccountName
    location = $Location
    servicePrincipal = @{
        clientId = $clientId
        tenantId = $tenantId
    }
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
} | ConvertTo-Json -Depth 10

$configData | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "✅ Configuration saved to: $configPath" -ForegroundColor Green

# Step 9: Create local terraform.tfvars
Write-Host "`n📝 Creating local terraform.tfvars file..." -ForegroundColor Cyan
$tfvarsPath = Join-Path $PSScriptRoot "terraform.tfvars"
$tfvarsContent = @"
# Sensormine Platform - Local Terraform Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

project_name = "sensormine"
environment  = "dev"
location     = "$Location"

# Database credentials
db_admin_username = "sensormineadmin"
db_admin_password = "$dbPassword"

# Use dev.tfvars for additional configuration
"@

$tfvarsContent | Out-File -FilePath $tfvarsPath -Encoding UTF8
Write-Host "✅ Created $tfvarsPath" -ForegroundColor Green

# Step 10: Next steps
Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
Write-Host ("=" * 60)
Write-Host "1. Configure GitHub secrets (shown above)"
Write-Host "2. Initialize Terraform:" -ForegroundColor Yellow
Write-Host "   cd infrastructure/terraform/azure"
Write-Host "   terraform init ```
    -backend-config=`"resource_group_name=$resourceGroupName`" ```
    -backend-config=`"storage_account_name=$storageAccountName`" ```
    -backend-config=`"container_name=$containerName`" ```
    -backend-config=`"key=sensormine-dev.terraform.tfstate`""
Write-Host ""
Write-Host "3. Plan deployment:" -ForegroundColor Yellow
Write-Host "   terraform plan -var-file=`"environments/dev.tfvars`" -out=tfplan"
Write-Host ""
Write-Host "4. Apply deployment:" -ForegroundColor Yellow
Write-Host "   terraform apply tfplan"
Write-Host ""
Write-Host "5. Or push to GitHub to trigger automated deployment" -ForegroundColor Yellow

Write-Host "`n✨ Setup complete! Ready to deploy Sensormine Platform to Azure." -ForegroundColor Green
Write-Host ("=" * 60)

# Warning about credentials
Write-Host "`n⚠️  SECURITY NOTICE:" -ForegroundColor Red
Write-Host "  - Keep azure-setup-config.json SECURE (added to .gitignore)"
Write-Host "  - Keep terraform.tfvars SECURE (added to .gitignore)"
Write-Host "  - Rotate service principal credentials periodically"
Write-Host "  - Use Azure Key Vault for production secrets"
