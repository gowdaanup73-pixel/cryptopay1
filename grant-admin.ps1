# grant-admin.ps1
# Grants admin (owner + reviewer) access for the NEW admin wallet on Polygon Mainnet.
#
# NEW ADMIN: 0x9f7A82baE2cb215E887bbBA1D73501c57163e210
# OLD COMPROMISED ACCOUNT: 0x52b6af09417423ed709c9C11bbbbe967b1a4F561 — DO NOT USE
#
# Usage:
#   # Use default new admin address:
#   .\grant-admin.ps1
#
#   # Or override with a different address:
#   .\grant-admin.ps1 -Address 0xSomeOtherAddress

param(
    [string]$Address = "0x9f7A82baE2cb215E887bbBA1D73501c57163e210"
)

# Safety check: block the compromised address
$COMPROMISED = "0x52b6af09417423ed709c9C11bbbbe967b1a4F561"
if ($Address.ToLower() -eq $COMPROMISED.ToLower()) {
    Write-Host ""
    Write-Host "[BLOCKED] This address is COMPROMISED and has been removed from this project." -ForegroundColor Red
    Write-Host "          Do NOT use: $COMPROMISED" -ForegroundColor Red
    Write-Host "          Use the new admin wallet instead: 0x9f7A82baE2cb215E887bbBA1D73501c57163e210" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not $Address -or $Address.Length -ne 42 -or -not $Address.StartsWith("0x")) {
    Write-Host ""
    Write-Host "[ERROR] Invalid address. Must be a 42-character hex string starting with 0x" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  Grant Admin Access — CoinCrop (Polygon Mainnet)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  New Admin Address : $Address" -ForegroundColor Green
Write-Host "  Network           : Polygon Mainnet (chainId: 137)" -ForegroundColor White
Write-Host ""

$env:ADMIN_ADDRESS = $Address
$web3Dir = Join-Path $PSScriptRoot "web3"

# Run for Polygon Mainnet
Write-Host "---------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  Running grant-admin on POLYGON MAINNET..." -ForegroundColor Yellow
Write-Host "---------------------------------------------------------------" -ForegroundColor Yellow

Push-Location $web3Dir
npx hardhat run scripts/grant-admin-all.js --network polygon 2>&1
$polygonResult = $LASTEXITCODE
Pop-Location

if ($polygonResult -ne 0) {
    Write-Host ""
    Write-Host "  [WARN] Polygon grant-admin failed. Possible causes:" -ForegroundColor Yellow
    Write-Host "    1. web3/.env DEPLOYER_PRIVATE_KEY not set (must be the current contract owner)" -ForegroundColor Yellow
    Write-Host "    2. Contract not yet deployed (run: npx hardhat run scripts/deploy-polygon.js --network polygon)" -ForegroundColor Yellow
    Write-Host "    3. Insufficient MATIC for gas" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host "  SUCCESS! Admin privileges granted on Polygon Mainnet." -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Address $Address now has:" -ForegroundColor White
    Write-Host "    * Contract Owner  — full admin control" -ForegroundColor White
    Write-Host "    * KYC Reviewer    — can approve/reject KYC submissions" -ForegroundColor White
    Write-Host ""
    Write-Host "  Connect MetaMask to Polygon Mainnet (chainId: 137)" -ForegroundColor White
    Write-Host ""
}
