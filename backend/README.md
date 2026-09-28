# CryptoPay Backend

Node.js + TypeScript + Express backend for the CryptoPay payment gateway.  
Handles **wallet-based auth**, **KYC verification** (PAN + Aadhaar), **IPFS proof storage** (Pinata), and **on-chain finalization** (Sepolia).

---

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This starts a PostgreSQL 15 container and automatically runs the migration (`migrations/001_init.sql`).

**Without Docker**: create a `cryptopay` database and run:

```bash
psql $DATABASE_URL -f migrations/001_init.sql
```

### 3. Configure .env

```bash
cp .env.example .env
# Edit .env with your real values (API keys, private key, etc.)
```

### 4. Run in development mode

```bash
npm run dev
```

Server starts at **http://localhost:4000**.  
Health check: **http://localhost:4000/health**

### AI loan risk model

Install the Python model dependencies and generate the local model artifacts before starting the backend:

```bash
python -m pip install -r scripts/requirements.txt
python scripts/train-loan-model.py
```

The training script creates 1,000 synthetic records with a 20% default rate and writes the model, test metrics, confusion matrix, and feature importance under `scripts/`. The backend loads the model worker at startup. Set `PYTHON_EXECUTABLE` if Python is not available as `python` (Windows) or `python3` (other platforms). If the model cannot load, predictions are explicitly marked with `demo: true`.

---

## API Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/auth/nonce?address=0x...` | — | Get a nonce to sign |
| `POST` | `/auth/verify` | — | Verify signature, get JWT |

### KYC

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`  | `/kyc/status` | JWT | Current KYC status |
| `POST` | `/kyc/pan/start` | JWT | Start PAN verification |
| `POST` | `/kyc/aadhaar/offline` | JWT | Upload Aadhaar offline ZIP |
| `POST` | `/kyc/finalize` | JWT | Finalize KYC → IPFS → on-chain |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/loan-risk` | Score loan default probability from loan features |
| `GET` | `/api/ai/model-metrics` | Return evaluation metrics, confusion matrix, and feature importance |

---

## Example Curl Requests

### 1. Get nonce

```bash
curl http://localhost:4000/auth/nonce?address=0xYourWalletAddress
# Response: { "nonce": "a1b2c3d4-..." }
```

### 2. Verify signature (sign the nonce with MetaMask first)

The message to sign in MetaMask:
```
Sign this message to log in to CryptoPay.

Nonce: a1b2c3d4-...
```

```bash
curl -X POST http://localhost:4000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0xYourWalletAddress",
    "signature": "0xSignatureFromMetaMask..."
  }'
# Response: { "token": "eyJhbGci...", "wallet": "0x...", "message": "Authentication successful" }
```

### 3. Check KYC status

```bash
curl http://localhost:4000/kyc/status \
  -H "Authorization: Bearer eyJhbGci..."
# Response: { "wallet": "0x...", "panStatus": "PENDING", "aadhaarStatus": "PENDING", ... }
```

### 4. Start PAN verification

```bash
curl -X POST http://localhost:4000/kyc/pan/start \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "pan": "ABCDE1234F",
    "fullName": "John Doe",
    "dob": "1990-01-15"
  }'
# Response: { "panValid": true, "nameMatch": true, "panStatus": "PASSED", ... }
```

### 5. Upload Aadhaar offline eKYC ZIP

```bash
curl -X POST http://localhost:4000/kyc/aadhaar/offline \
  -H "Authorization: Bearer eyJhbGci..." \
  -F "file=@/path/to/offline-ekyc.zip" \
  -F "passcode=YourShareCode1234"
# Response: { "aadhaarVerified": true, "name": "...", "maskedAadhaar": "XXXX-XXXX-1234", ... }
```

### 6. Finalize KYC (both PAN + Aadhaar must be PASSED)

```bash
curl -X POST http://localhost:4000/kyc/finalize \
  -H "Authorization: Bearer eyJhbGci..."
# Response: { "overallKycStatus": "VERIFIED", "kycProofHash": "0x...", "ipfsCid": "baf...", "txHash": "0x..." }
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 4000) |
| `JWT_SECRET` | Random secret for JWT signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint |
| `SERVER_PRIVATE_KEY` | Private key for on-chain transactions (must be funded + authorized as reviewer) |
| `CONTRACT_ADDRESS` | CryptoPaymentGateway contract address on Sepolia |
| `PINATA_API_KEY` | Pinata API key |
| `PINATA_SECRET_KEY` | Pinata secret key |
| `PINATA_JWT` | Pinata JWT token |
| `PAN_AGGREGATOR_BASE_URL` | PAN verification aggregator base URL |
| `PAN_AGGREGATOR_ENDPOINT` | PAN verification endpoint path |
| `PAN_AGGREGATOR_API_KEY` | PAN aggregator API key |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |

---

## Project Structure

```
backend/
├── docker-compose.yml          # PostgreSQL container
├── package.json
├── tsconfig.json
├── .env.example
├── migrations/
│   └── 001_init.sql            # Database schema
├── src/
│   ├── index.ts                # Express entry point
│   ├── config/
│   │   ├── env.ts              # Environment variables
│   │   ├── db.ts               # PostgreSQL pool
│   │   └── blockchain.ts       # Ethers.js provider + contract
│   ├── middleware/
│   │   └── auth.ts             # JWT authentication
│   ├── routes/
│   │   ├── auth.ts             # /auth/nonce, /auth/verify
│   │   └── kyc.ts              # /kyc/status, /kyc/pan/start, /kyc/aadhaar/offline, /kyc/finalize
│   ├── services/
│   │   ├── pan.ts              # PAN aggregator integration
│   │   ├── aadhaar.ts          # Aadhaar offline eKYC
│   │   ├── blockchain.ts       # On-chain interactions
│   │   └── pinata.ts           # IPFS upload
│   └── utils/
│       └── verhoeff.ts         # Aadhaar checksum algorithm
└── README.md
```

---

## Where to Paste Your Keys

| What | Where |
|------|-------|
| PAN aggregator base URL + endpoint | `.env` → `PAN_AGGREGATOR_BASE_URL`, `PAN_AGGREGATOR_ENDPOINT` |
| PAN aggregator API key | `.env` → `PAN_AGGREGATOR_API_KEY` |
| Smart contract address | `.env` → `CONTRACT_ADDRESS` (already set to Sepolia deployment) |
| Smart contract ABI | Auto-loaded from `web3/artifacts/` (no action needed) |
| Pinata keys | `.env` → `PINATA_API_KEY`, `PINATA_SECRET_KEY`, `PINATA_JWT` |
| Server wallet private key | `.env` → `SERVER_PRIVATE_KEY` |
| UIDAI signing certificate | `src/services/aadhaar.ts` → look for `TODO: Paste the UIDAI public signing certificate` |
