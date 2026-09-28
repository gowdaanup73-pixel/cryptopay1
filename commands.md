# Project Commands

## Terminal 1 - Hardhat Blockchain
```powershell
cd "C:\project folder\W_T_F_1-main\web3"
npx hardhat node
```

## Terminal 2 - Deploy Contracts
```powershell
cd "C:\project folder\W_T_F_1-main\web3"
npx hardhat run scripts/deploy-mock-tokens.js --network localhost
npx hardhat run scripts/deploy-payment-gateway.js --network localhost
npx hardhat run scripts/distribute-tokens.js --network localhost
npx hardhat run scripts/deploy-croploan.js --network localhost
```

## Terminal 3 - Backend
```powershell
cd "C:\project folder\W_T_F_1-main\backend"
npm run dev
```

## Terminal 4 - Frontend
```powershell
cd "C:\project folder\W_T_F_1-main"
npm run dev
```

## Access Points
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Hardhat: http://localhost:8545

## MetaMask Settings
- Network: Localhost 8545
- Chain ID: 1337
- RPC: http://127.0.0.1:8545
- Test account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266