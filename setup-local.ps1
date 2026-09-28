# Crypto Payment Gateway - Local Development Setup Script (PowerShell)
# This script sets up the local development environment on Windows

Write-Host "🚀 Setting up Crypto Payment Gateway for local development..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Hardhat node is running
Write-Host "📡 Step 1: Checking if port 8545 is available..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 8545 is already in use. Please stop any running Hardhat node first." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✓ Port 8545 is available" -ForegroundColor Green
}

# Step 2: Start Hardhat node in a new window
Write-Host ""
Write-Host "📡 Step 2: Starting Hardhat node in a new terminal..." -ForegroundColor Yellow
Write-Host "   A new terminal window will open. Keep it running!" -ForegroundColor Cyan

$hardhatPath = Join-Path $PSScriptRoot "web3"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$hardhatPath'; Write-Host '🔗 Starting Hardhat Node...' -ForegroundColor Cyan; npx hardhat node"

Write-Host "   Waiting for Hardhat node to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test if node is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Hardhat node is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to connect to Hardhat node. Please check the Hardhat terminal." -ForegroundColor Red
    exit 1
}

# Step 3: Deploy mock tokens
Write-Host ""
Write-Host "🪙 Step 3: Deploying mock ERC20 tokens (USDT, USDC)..." -ForegroundColor Yellow
Set-Location web3
$deployTokens = npx hardhat run scripts/deploy-mock-tokens.js --network localhost
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Mock tokens deployed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy mock tokens" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Step 4: Deploy payment gateway
Write-Host ""
Write-Host "💳 Step 4: Deploying CryptoPaymentGateway contract..." -ForegroundColor Yellow
$deployGateway = npx hardhat run scripts/deploy-payment-gateway.js --network localhost
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Payment gateway deployed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy payment gateway" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Step 5: Update .env.local with new addresses
Write-Host ""
Write-Host "📝 Step 5: Updating .env.local with contract addresses..." -ForegroundColor Yellow
Set-Location ..

# Read deployment addresses from JSON
$deployment = Get-Content "web3\deployment-localhost.json" | ConvertFrom-Json
$paymentGateway = $deployment.contracts.CryptoPaymentGateway
$usdtAddress = $deployment.contracts.USDT
$usdcAddress = $deployment.contracts.USDC

# Update .env.local
$envContent = Get-Content ".env.local"
$envContent = $envContent -replace "NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=.*", "NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=$paymentGateway"
$envContent = $envContent -replace "NEXT_PUBLIC_USDT_ADDRESS=.*", "NEXT_PUBLIC_USDT_ADDRESS=$usdtAddress"
$envContent = $envContent -replace "NEXT_PUBLIC_USDC_ADDRESS=.*", "NEXT_PUBLIC_USDC_ADDRESS=$usdcAddress"
$envContent | Set-Content ".env.local"

Write-Host "✓ Environment variables updated" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Deployed Contract Addresses:" -ForegroundColor Cyan
Write-Host "   Payment Gateway: $paymentGateway" -ForegroundColor White
Write-Host "   USDT Token:      $usdtAddress" -ForegroundColor White
Write-Host "   USDC Token:      $usdcAddress" -ForegroundColor White

# Step 6: Check frontend dependencies
Write-Host ""
Write-Host "📦 Step 6: Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Final instructions
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Keep the Hardhat node terminal running" -ForegroundColor White
Write-Host "   2. Contracts are deployed and addresses are updated in .env.local" -ForegroundColor White
Write-Host "   3. Start the frontend with: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Default Hardhat Account (Import to MetaMask):" -ForegroundColor Cyan
Write-Host "   Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor Yellow
Write-Host "   Private Key: [omitted]" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Import this account into MetaMask to interact with the dApp" -ForegroundColor Magenta
Write-Host "   Network: Localhost 8545, Chain ID: 1337" -ForegroundColor Magenta
Write-Host ""

