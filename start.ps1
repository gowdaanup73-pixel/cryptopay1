# Crypto Payment Gateway - Simple Startup Script
# Run this to start the entire project

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " CRYPTO PAYMENT GATEWAY - STARTUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes on ports
Write-Host "[1/8] Cleaning up ports..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8545 -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -ne 0) {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.OwningProcess -ne 0) {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2
Write-Host "  Done!" -ForegroundColor Green
Write-Host ""

# Compile contracts
Write-Host "[2/8] Compiling smart contracts..." -ForegroundColor Yellow
Set-Location web3
npx hardhat clean | Out-Null
$compileResult = npx hardhat compile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Compilation failed!" -ForegroundColor Red
    Write-Host $compileResult
    exit 1
}
Write-Host "  Done! Contracts compiled successfully" -ForegroundColor Green
Write-Host ""

# Start Hardhat node
Write-Host "[3/8] Starting Hardhat blockchain..." -ForegroundColor Yellow
Write-Host "  Opening new terminal for Hardhat node..." -ForegroundColor Cyan
$hardhatPath = $PWD.Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$hardhatPath'; Write-Host 'HARDHAT NODE RUNNING' -ForegroundColor Green; npx hardhat node"
Start-Sleep -Seconds 8

# Test connection
try {
    $body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
    Invoke-WebRequest -Uri "http://localhost:8545" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 | Out-Null
    Write-Host "  Done! Hardhat node running on port 8545" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Could not connect to Hardhat node!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy mock tokens
Write-Host "[4/8] Deploying mock tokens (USDT, USDC)..." -ForegroundColor Yellow
npx hardhat run scripts/deploy-mock-tokens.js --network localhost | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Token deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Done! Mock tokens deployed" -ForegroundColor Green
Write-Host ""

# Deploy payment gateway
Write-Host "[5/9] Deploying Payment Gateway contract..." -ForegroundColor Yellow
npx hardhat run scripts/deploy-payment-gateway.js --network localhost | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Gateway deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Done! Payment Gateway deployed" -ForegroundColor Green
Write-Host ""

# Distribute tokens to all accounts
Write-Host "[6/9] Distributing tokens to test accounts..." -ForegroundColor Yellow
npx hardhat run scripts/distribute-tokens.js --network localhost | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Token distribution failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Done! All accounts now have USDT and USDC" -ForegroundColor Green
Write-Host ""

# Update environment variables
Write-Host "[7/9] Updating environment variables..." -ForegroundColor Yellow
Set-Location ..
$deployment = Get-Content "web3\deployment-localhost.json" | ConvertFrom-Json
$gateway = $deployment.contracts.CryptoPaymentGateway
$usdt = $deployment.contracts.USDT
$usdc = $deployment.contracts.USDC

$env = Get-Content ".env.local"
$env = $env -replace "NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=.*", "NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=$gateway"
$env = $env -replace "NEXT_PUBLIC_USDT_ADDRESS=.*", "NEXT_PUBLIC_USDT_ADDRESS=$usdt"
$env = $env -replace "NEXT_PUBLIC_USDC_ADDRESS=.*", "NEXT_PUBLIC_USDC_ADDRESS=$usdc"
$env | Set-Content ".env.local"
Write-Host "  Done! Addresses updated in .env.local" -ForegroundColor Green
Write-Host ""

# Check dependencies
Write-Host "[8/9] Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Cyan
    npm install | Out-Null
}
Write-Host "  Done! Dependencies ready" -ForegroundColor Green
Write-Host ""

# Start frontend
Write-Host "[9/9] Starting frontend server..." -ForegroundColor Yellow
Write-Host "  Opening new terminal for Next.js..." -ForegroundColor Cyan
$rootPath = $PWD.Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootPath'; Write-Host 'NEXT.JS SERVER RUNNING' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 10

# Find which port Next.js is using
$port = 3000
foreach ($p in @(3000, 3001, 3002)) {
    if (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue) {
        $port = $p
        break
    }
}
Write-Host "  Done! Frontend running on port $port" -ForegroundColor Green
Write-Host ""

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " PROJECT STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "SERVICES RUNNING:" -ForegroundColor Cyan
Write-Host "  Hardhat:  http://localhost:8545" -ForegroundColor White
Write-Host "  Frontend: http://localhost:$port" -ForegroundColor White
Write-Host ""
Write-Host "CONTRACTS DEPLOYED:" -ForegroundColor Cyan
Write-Host "  Gateway: $gateway" -ForegroundColor White
Write-Host "  USDT:    $usdt" -ForegroundColor White
Write-Host "  USDC:    $usdc" -ForegroundColor White
Write-Host ""
Write-Host "TEST ACCOUNTS (All have tokens!):" -ForegroundColor Cyan
Write-Host "  Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" -ForegroundColor Yellow
Write-Host "  Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8" -ForegroundColor Yellow
Write-Host "  Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" -ForegroundColor Yellow
Write-Host "  (+ 17 more accounts available)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Each account has:" -ForegroundColor Cyan
Write-Host "    - 10,000 ETH" -ForegroundColor White
Write-Host "    - 10,000 USDT" -ForegroundColor White
Write-Host "    - 10,000 USDC" -ForegroundColor White
Write-Host ""
Write-Host "  Import any account to MetaMask:" -ForegroundColor Cyan
Write-Host "  Account 0 Key: [omitted]" -ForegroundColor Gray
Write-Host "  Account 1 Key: [omitted]" -ForegroundColor Gray
Write-Host "  Account 2 Key: [omitted]" -ForegroundColor Gray
Write-Host ""
Write-Host "METAMASK NETWORK:" -ForegroundColor Cyan
Write-Host "  Name:     Localhost 8545" -ForegroundColor White
Write-Host "  RPC:      http://127.0.0.1:8545" -ForegroundColor White
Write-Host "  Chain ID: 1337" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://localhost:$port"
Write-Host ""
Write-Host "Keep both terminal windows running!" -ForegroundColor Yellow
Write-Host ""

