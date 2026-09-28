# ============================================
# Crypto Payment Gateway - Complete Startup Script
# ============================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🚀 CRYPTO PAYMENT GATEWAY - COMPLETE PROJECT STARTUP   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $connection
}

# Function to kill process on port
function Stop-PortProcess {
    param($Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        if ($conn.OwningProcess -ne 0) {
            Write-Host "  Stopping process $($conn.OwningProcess) on port $Port..." -ForegroundColor Yellow
            Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
}

# ============================================
# STEP 1: Clean up existing processes
# ============================================
Write-Host "📋 STEP 1: Cleaning up existing processes..." -ForegroundColor Yellow
Write-Host ""

if (Test-Port 8545) {
    Write-Host "  ⚠️  Port 8545 is in use. Stopping existing Hardhat node..." -ForegroundColor Yellow
    Stop-PortProcess 8545
    Write-Host "  ✅ Port 8545 cleared" -ForegroundColor Green
} else {
    Write-Host "  ✅ Port 8545 is available" -ForegroundColor Green
}

if (Test-Port 3000) {
    Write-Host "  ⚠️  Port 3000 is in use. Stopping existing Next.js server..." -ForegroundColor Yellow
    Stop-PortProcess 3000
    Write-Host "  ✅ Port 3000 cleared" -ForegroundColor Green
}

if (Test-Port 3001) {
    Write-Host "  ⚠️  Port 3001 is in use. Stopping existing Next.js server..." -ForegroundColor Yellow
    Stop-PortProcess 3001
    Write-Host "  ✅ Port 3001 cleared" -ForegroundColor Green
}

Write-Host ""

# ============================================
# STEP 2: Compile Smart Contracts
# ============================================
Write-Host "📋 STEP 2: Compiling Smart Contracts..." -ForegroundColor Yellow
Write-Host ""

Set-Location web3

Write-Host "  🧹 Cleaning previous build artifacts..." -ForegroundColor Cyan
npx hardhat clean | Out-Null

Write-Host "  🔨 Compiling contracts..." -ForegroundColor Cyan
$compileOutput = npx hardhat compile 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Contracts compiled successfully!" -ForegroundColor Green
    Write-Host "     $compileOutput" -ForegroundColor Gray
} else {
    Write-Host "  ❌ Contract compilation failed!" -ForegroundColor Red
    Write-Host "     $compileOutput" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# ============================================
# STEP 3: Start Hardhat Local Blockchain
# ============================================
Write-Host "📋 STEP 3: Starting Hardhat Local Blockchain..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  🔗 Launching Hardhat node in new terminal..." -ForegroundColor Cyan
Write-Host "     ⚠️  Keep the Hardhat terminal running!" -ForegroundColor Yellow

# Start Hardhat node in a new window
$hardhatJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; Write-Host 'HARDHAT LOCAL BLOCKCHAIN NODE' -ForegroundColor Cyan; Write-Host ''; npx hardhat node"
) -PassThru

Write-Host "  ⏳ Waiting for Hardhat node to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Test if node is running
try {
    $body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    $testConnection = Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Hardhat node is running on http://localhost:8545" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to connect to Hardhat node!" -ForegroundColor Red
    Write-Host "     Please check the Hardhat terminal for errors" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# ============================================
# STEP 4: Deploy Mock ERC20 Tokens
# ============================================
Write-Host "📋 STEP 4: Deploying Mock ERC20 Tokens (USDT, USDC)..." -ForegroundColor Yellow
Write-Host ""

$deployTokens = npx hardhat run scripts/deploy-mock-tokens.js --network localhost 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Mock tokens deployed successfully!" -ForegroundColor Green
    
    # Extract addresses from output
    $usdtMatch = $deployTokens | Select-String "Mock USDT deployed to: (0x[a-fA-F0-9]+)"
    $usdcMatch = $deployTokens | Select-String "Mock USDC deployed to: (0x[a-fA-F0-9]+)"
    
    if ($usdtMatch) {
        Write-Host "     USDT: $($usdtMatch.Matches.Groups[1].Value)" -ForegroundColor Cyan
    }
    if ($usdcMatch) {
        Write-Host "     USDC: $($usdcMatch.Matches.Groups[1].Value)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ❌ Failed to deploy mock tokens!" -ForegroundColor Red
    Write-Host "     $deployTokens" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# ============================================
# STEP 5: Deploy Payment Gateway Contract
# ============================================
Write-Host "📋 STEP 5: Deploying CryptoPaymentGateway Contract..." -ForegroundColor Yellow
Write-Host ""

$deployGateway = npx hardhat run scripts/deploy-payment-gateway.js --network localhost 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Payment Gateway deployed successfully!" -ForegroundColor Green
    
    # Extract address from output
    $gatewayMatch = $deployGateway | Select-String "CryptoPaymentGateway deployed to: (0x[a-fA-F0-9]+)"
    
    if ($gatewayMatch) {
        Write-Host "     Gateway: $($gatewayMatch.Matches.Groups[1].Value)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ❌ Failed to deploy Payment Gateway!" -ForegroundColor Red
    Write-Host "     $deployGateway" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# ============================================
# STEP 6: Update Environment Variables
# ============================================
Write-Host "📋 STEP 6: Updating Environment Variables..." -ForegroundColor Yellow
Write-Host ""

Set-Location ..

# Read deployment addresses
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

Write-Host "  ✅ Environment variables updated in .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "  📋 Contract Addresses:" -ForegroundColor Cyan
Write-Host "     Payment Gateway: $paymentGateway" -ForegroundColor White
Write-Host "     USDT Token:      $usdtAddress" -ForegroundColor White
Write-Host "     USDC Token:      $usdcAddress" -ForegroundColor White

Write-Host ""

# ============================================
# STEP 7: Install Frontend Dependencies
# ============================================
Write-Host "📋 STEP 7: Checking Frontend Dependencies..." -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "  📦 Installing frontend dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""

# ============================================
# STEP 8: Start Wallet Authentication Backend
# ============================================
Write-Host "STEP 8: Starting Wallet Authentication Backend..." -ForegroundColor Yellow
Write-Host ""

$backendPath = Join-Path $PWD "backend"
if (-not (Test-Path (Join-Path $backendPath "node_modules"))) {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Cyan
    Push-Location $backendPath
    npm install
    $backendInstallExitCode = $LASTEXITCODE
    Pop-Location
    if ($backendInstallExitCode -ne 0) {
        Write-Host "  Backend dependency installation failed!" -ForegroundColor Red
        exit 1
    }
}

if (Test-Port 4000) {
    Write-Host "  Wallet authentication backend is already listening on port 4000." -ForegroundColor Cyan
} else {
    Write-Host "  Launching wallet authentication API in a new terminal..." -ForegroundColor Cyan
    $backendJob = Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendPath'; Write-Host 'CRYPTOPAY AUTHENTICATION BACKEND' -ForegroundColor Cyan; Write-Host ''; npm run dev"
    ) -PassThru
}

Write-Host "  Checking wallet authentication API..." -ForegroundColor Cyan
$authReady = $false
for ($attempt = 0; $attempt -lt 20 -and -not $authReady; $attempt++) {
    try {
        $authCheck = Invoke-WebRequest -Uri "http://localhost:4000/auth/nonce?address=0x0000000000000000000000000000000000000001" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $authReady = $authCheck.StatusCode -eq 200
    } catch {
        Start-Sleep -Seconds 1
    }
}
if (-not $authReady) {
    Write-Host "  Wallet authentication API did not start correctly!" -ForegroundColor Red
    Write-Host "     Check the backend terminal for errors." -ForegroundColor Red
    exit 1
}
Write-Host "  Wallet authentication API is running on http://localhost:4000" -ForegroundColor Green

Write-Host ""

# ============================================
# STEP 9: Start Frontend Development Server
# ============================================
Write-Host "📋 STEP 9: Starting Frontend Development Server..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  🌐 Launching Next.js in new terminal..." -ForegroundColor Cyan
Write-Host "     ⚠️  Keep the Next.js terminal running!" -ForegroundColor Yellow

# Start Next.js in a new window
$nextJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; Write-Host 'NEXT.JS DEVELOPMENT SERVER' -ForegroundColor Cyan; Write-Host ''; npm run dev"
) -PassThru

Write-Host "  ⏳ Waiting for Next.js to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Check if Next.js is running
$nextRunning = $false
foreach ($port in @(3000, 3001, 3002)) {
    if (Test-Port $port) {
        Write-Host "  ✅ Next.js is running on http://localhost:$port" -ForegroundColor Green
        $nextRunning = $true
        $frontendPort = $port
        break
    }
}

if (-not $nextRunning) {
    Write-Host "  ⚠️  Could not detect Next.js server. Check the Next.js terminal." -ForegroundColor Yellow
    $frontendPort = 3000
}

Write-Host ""

# ============================================
# SUCCESS! Show Summary
# ============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ PROJECT STARTED SUCCESSFULLY! ✅           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Your Crypto Payment Gateway is now running!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 RUNNING SERVICES:" -ForegroundColor Yellow
Write-Host "   🔗 Hardhat Blockchain:  http://localhost:8545" -ForegroundColor White
Write-Host "   🌐 Frontend DApp:       http://localhost:$frontendPort" -ForegroundColor White
Write-Host ""
Write-Host "📋 DEPLOYED CONTRACTS:" -ForegroundColor Yellow
Write-Host "   💳 Payment Gateway:     $paymentGateway" -ForegroundColor White
Write-Host "   🪙 USDT Token:          $usdtAddress" -ForegroundColor White
Write-Host "   🪙 USDC Token:          $usdcAddress" -ForegroundColor White
Write-Host ""
Write-Host "🔑 TEST ACCOUNT (Import to MetaMask):" -ForegroundColor Yellow
Write-Host "   Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor Cyan
Write-Host "   Private Key: [omitted]" -ForegroundColor Cyan
Write-Host "   Balance:     10,000 ETH" -ForegroundColor Cyan
Write-Host ""
Write-Host "🦊 METAMASK SETUP:" -ForegroundColor Yellow
Write-Host "   Network Name: Localhost 8545" -ForegroundColor White
Write-Host "   RPC URL:      http://127.0.0.1:8545" -ForegroundColor White
Write-Host "   Chain ID:     1337" -ForegroundColor White
Write-Host "   Currency:     ETH" -ForegroundColor White
Write-Host ""
Write-Host "📚 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:$frontendPort in your browser" -ForegroundColor White
Write-Host "   2. Configure MetaMask with the network settings above" -ForegroundColor White
Write-Host "   3. Import the test account into MetaMask" -ForegroundColor White
Write-Host "   4. Connect your wallet to the DApp" -ForegroundColor White
Write-Host "   5. Start testing KYC, products, and payments!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   Keep both terminal windows (Hardhat and Next.js) running!" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C in those terminals to stop the services." -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 For more information, see QUICK_START.md" -ForegroundColor Cyan
Write-Host ""

# Open browser
Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:$frontendPort"

Write-Host ""
Write-Host "✨ Happy Building! ✨" -ForegroundColor Magenta
Write-Host ""

