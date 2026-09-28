# CryptoPay

CryptoPay is a Next.js payment and lending dApp with an Express API, PostgreSQL database, and Hardhat smart contracts. This guide covers a quick frontend start and the complete local development stack.

## Requirements

- Node.js 18 or newer with npm
- Docker Desktop, for the local PostgreSQL database
- MetaMask, if you want to connect a wallet
- Python, only if you want to retrain the optional loan-risk model

If the repository is private, a teammate must have GitHub access before cloning it.

## Quick Start: Frontend

From the repository root, install dependencies and start Next.js:

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend defaults to the local network configuration. Wallet transactions and API-backed features need the local services described below.

To customize public frontend settings, copy `.env.example` to `.env.local` and edit it. Values prefixed with `NEXT_PUBLIC_` are exposed in the browser; never put private keys, API secrets, service-role keys, or passwords in `.env.local`.

## Full Local Development Stack

Open separate terminals from the repository root. Install each package once:

```powershell
npm ci
cd web3
npm ci
cd ..\backend
npm ci
cd ..
```

### 1. Start the local blockchain

In terminal 1:

```powershell
cd web3
npx hardhat node
```

This starts a local test chain at `http://127.0.0.1:8545` (chain ID `1337`). Use only its disposable test accounts; never fund or reuse them on a public network.

### 2. Deploy the local contracts

In terminal 2:

```powershell
cd web3
npx hardhat run scripts/deploy-mock-tokens.js --network localhost
npx hardhat run scripts/deploy-payment-gateway.js --network localhost
npx hardhat run scripts/distribute-tokens.js --network localhost
npx hardhat run scripts/deploy-croploan.js --network localhost
```

Keep the deployment output handy. If a contract address differs from the address configured in the frontend, set the matching public `NEXT_PUBLIC_*_ADDRESS` value in `.env.local` and restart Next.js.

### 3. Configure and start PostgreSQL

In terminal 3:

```powershell
cd backend
Copy-Item .env.example .env
docker compose up -d
```

The compose file creates the local `cryptopay` database and applies the initial migration. The example `.env` is for local setup only: set `SERVER_PRIVATE_KEY` to a disposable private key printed by your local Hardhat node, and set `CONTRACT_ADDRESS` to the deployed local payment gateway address. Set a random `JWT_SECRET` for local development. Do not use a real wallet key here.

The backend `.env.example` includes placeholder Pinata and verification-provider values. Replace them with valid credentials only when testing those integrations. Keep all backend credentials in `backend/.env`; that file is ignored by Git.

### 4. Start the backend

In terminal 4:

```powershell
cd backend
npm run dev
```

Check the API and database connection at [http://localhost:4000/health](http://localhost:4000/health).

### 5. Start the frontend

In terminal 5, from the repository root:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In MetaMask, add the local network with RPC `http://127.0.0.1:8545` and chain ID `1337`. Import only a disposable account printed by the local Hardhat node.

## Optional: Retrain the Loan-Risk Model

From the repository root:

```powershell
cd backend
python -m pip install -r scripts/requirements.txt
python scripts/train-loan-model.py
```

The backend can start without retraining; this is only needed to regenerate the local model artifacts.

## Project Layout

- `pages/`, `components/`, `styles/`: Next.js frontend
- `backend/`: Express API, PostgreSQL migration, and optional Python model
- `web3/contracts/`, `web3/scripts/`: Solidity contracts and local deployment scripts
- `commands.md`: condensed local development commands
- `backend/README.md`: backend API and configuration details

## Security Notes

- `.env.local`, `backend/.env`, and `web3/.env` are excluded by `.gitignore`.
- Share only example templates such as `.env.example`; never commit real credentials.
- Anything named `NEXT_PUBLIC_*` is public in a Next.js browser bundle. Keep secrets in backend-only environment variables.
- Rotate any credential that has previously been exposed. Ignoring a file does not revoke its values.