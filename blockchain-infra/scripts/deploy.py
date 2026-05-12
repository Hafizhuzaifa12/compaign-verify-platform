"""Deploy CampaignRegistry to the configured RPC endpoint.

Usage:
    python deploy.py

Env:
    RPC_URL           default: http://localhost:8545
    DEPLOYER_KEY      0x-prefixed private key (required for non-dev nets)
    CONTRACT_ARTIFACT default: ../artifacts/CampaignRegistry.json
"""

from __future__ import annotations

import json
import os
from pathlib import Path

try:
    from web3 import Web3
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "web3.py is required: pip install 'web3==6.20.0'"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTIFACT = ROOT / "artifacts" / "CampaignRegistry.json"


def load_artifact(path: Path) -> tuple[str, list]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload["bytecode"], payload["abi"]


def main() -> None:
    rpc_url = os.environ.get("RPC_URL", "http://localhost:8545")
    artifact_path = Path(os.environ.get("CONTRACT_ARTIFACT", DEFAULT_ARTIFACT))
    private_key = os.environ.get("DEPLOYER_KEY")

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise SystemExit(f"Could not connect to RPC at {rpc_url}")

    bytecode, abi = load_artifact(artifact_path)
    contract = w3.eth.contract(abi=abi, bytecode=bytecode)

    if private_key:
        account = w3.eth.account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)
        tx = contract.constructor().build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gas": 1_500_000,
                "gasPrice": w3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    else:
        # Local dev: assume an unlocked account.
        deployer = w3.eth.accounts[0]
        tx_hash = contract.constructor().transact({"from": deployer})

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Deployed CampaignRegistry at {receipt.contractAddress}")
    print(f"  tx: {tx_hash.hex()}")
    print(f"  block: {receipt.blockNumber}")


if __name__ == "__main__":
    main()
