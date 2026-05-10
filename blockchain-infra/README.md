# Blockchain Infra

This module contains:

- Solidity contracts for campaign verification (`contracts/`)
- A blockchain bridge service (`service/app.py`) used by backend APIs
- Optional Hardhat tooling for future on-chain deployment work

## Bridge service API

- `GET /health` - service health and active network
- `POST /v1/records/store` - stores campaign hash record
- `POST /v1/records/verify` - verifies campaign hash against stored ledger record

The current bridge runs in `simulated-local` mode and keeps records in a persisted volume (`/data/ledger.json`) so backend and frontend can be tested end-to-end.
