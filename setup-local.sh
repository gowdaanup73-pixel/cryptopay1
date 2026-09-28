#!/bin/bash

# Crypto Payment Gateway - Local Development Setup Script
# This script sets up the local development environment

echo "🚀 Setting up Crypto Payment Gateway for local development..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Hardhat node is running
echo "📡 Step 1: Checking Hardhat node..."
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Hardhat node is already running on port 8545${NC}"
    echo "Please stop it first (Ctrl+C in the terminal running it)"
    exit 1
else
    echo -e "${GREEN}✓ Port 8545 is available${NC}"
fi

# Step 2: Start Hardhat node in background
echo ""
echo "📡 Step 2: Starting Hardhat node..."
cd web3
npx hardhat node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo -e "${GREEN}✓ Hardhat node started (PID: $HARDHAT_PID)${NC}"
echo "Waiting for node to be ready..."
sleep 5

# Step 3: Deploy mock tokens
echo ""
echo "🪙 Step 3: Deploying mock ERC20 tokens (USDT, USDC)..."
npx hardhat run scripts/deploy-mock-tokens.js --network localhost
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Mock tokens deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy mock tokens${NC}"
    kill $HARDHAT_PID
    exit 1
fi

# Step 4: Deploy payment gateway
echo ""
echo "💳 Step 4: Deploying CryptoPaymentGateway contract..."
npx hardhat run scripts/deploy-payment-gateway.js --network localhost
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Payment gateway deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy payment gateway${NC}"
    kill $HARDHAT_PID
    exit 1
fi

# Step 5: Update .env.local with new addresses
echo ""
echo "📝 Step 5: Updating .env.local with contract addresses..."
cd ..

# Read deployment addresses
PAYMENT_GATEWAY=$(cat web3/deployment-localhost.json | grep -o '"CryptoPaymentGateway": "[^"]*"' | cut -d'"' -f4)
USDT_ADDRESS=$(cat web3/deployment-localhost.json | grep -o '"USDT": "[^"]*"' | cut -d'"' -f4)
USDC_ADDRESS=$(cat web3/deployment-localhost.json | grep -o '"USDC": "[^"]*"' | cut -d'"' -f4)

# Update .env.local
sed -i.bak "s/NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=.*/NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS=$PAYMENT_GATEWAY/" .env.local
sed -i.bak "s/NEXT_PUBLIC_USDT_ADDRESS=.*/NEXT_PUBLIC_USDT_ADDRESS=$USDT_ADDRESS/" .env.local
sed -i.bak "s/NEXT_PUBLIC_USDC_ADDRESS=.*/NEXT_PUBLIC_USDC_ADDRESS=$USDC_ADDRESS/" .env.local

echo -e "${GREEN}✓ Environment variables updated${NC}"
echo ""
echo "📋 Deployed Contract Addresses:"
echo "   Payment Gateway: $PAYMENT_GATEWAY"
echo "   USDT Token:      $USDT_ADDRESS"
echo "   USDC Token:      $USDC_ADDRESS"

# Step 6: Install frontend dependencies if needed
echo ""
echo "📦 Step 6: Checking frontend dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Final instructions
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📚 Next steps:"
echo "   1. The Hardhat node is running in the background (PID: $HARDHAT_PID)"
echo "   2. Contracts are deployed and addresses are updated in .env.local"
echo "   3. Start the frontend with: npm run dev"
echo ""
echo "🔧 Useful commands:"
echo "   - View Hardhat logs: tail -f web3/hardhat-node.log"
echo "   - Stop Hardhat node: kill $HARDHAT_PID"
echo "   - Restart setup: ./setup-local.sh"
echo ""
echo "🌐 Default accounts (from Hardhat):"
echo "   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "   Private Key: [omitted]"
echo ""
echo "💡 Import this account into MetaMask to interact with the dApp"

