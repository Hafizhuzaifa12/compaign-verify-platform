"""CLI helpers for the deployed CampaignRegistry.

Examples:
    python interact.py attest cmp_847f 0xa4f1… 9740 60 https://verit.io/c/cmp_847f
    python interact.py get cmp_847f
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from pathlib import Path

try:
    from web3 import Web3
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "web3.py is required: pip install 'web3==6.20.0'"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTIFACT = ROOT / "artifacts" / "CampaignRegistry.json"


def campaign_id(text: str) -> bytes:
    return Web3.keccak(text=text)


def content_hash(payload: bytes | str) -> bytes:
    if isinstance(payload, str):
        payload = payload.encode("utf-8")
    return hashlib.sha256(payload).digest()


def _contract(w3: Web3) -> "Web3.eth.contract":
    address = os.environ.get("CONTRACT_ADDRESS")
    if not address:
        raise SystemExit("CONTRACT_ADDRESS env var is required")

    artifact_path = Path(os.environ.get("CONTRACT_ARTIFACT", DEFAULT_ARTIFACT))
    abi = json.loads(artifact_path.read_text(encoding="utf-8"))["abi"]
    return w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)


def cmd_attest(args: argparse.Namespace) -> None:
    w3 = Web3(Web3.HTTPProvider(os.environ.get("RPC_URL", "http://localhost:8545")))
    contract = _contract(w3)

    sender = w3.eth.accounts[0]
    tx_hash = contract.functions.attest(
        campaign_id(args.campaign),
        content_hash(args.content_hash_input),
        int(args.auth_bp),
        int(args.df_bp),
        args.uri,
    ).transact({"from": sender})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Attested {args.campaign} → tx {tx_hash.hex()} in block {receipt.blockNumber}")


def cmd_get(args: argparse.Namespace) -> None:
    w3 = Web3(Web3.HTTPProvider(os.environ.get("RPC_URL", "http://localhost:8545")))
    contract = _contract(w3)
    result = contract.functions.getAttestation(campaign_id(args.campaign)).call()
    print(
        json.dumps(
            {
                "contentHash": result[0].hex(),
                "authenticityScoreBp": result[1],
                "deepfakeScoreBp": result[2],
                "verifiedAt": result[3],
                "verifier": result[4],
                "offChainUri": result[5],
            },
            indent=2,
        )
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="CampaignRegistry CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_attest = sub.add_parser("attest", help="Publish an attestation")
    p_attest.add_argument("campaign", help="Campaign id string, e.g. cmp_847f")
    p_attest.add_argument("content_hash_input", help="Bytes whose sha256 to commit")
    p_attest.add_argument("auth_bp", help="Authenticity score in basis points (0–10000)")
    p_attest.add_argument("df_bp", help="Deepfake-risk score in basis points (0–10000)")
    p_attest.add_argument("uri", help="Off-chain URI of the full record")
    p_attest.set_defaults(func=cmd_attest)

    p_get = sub.add_parser("get", help="Fetch an attestation")
    p_get.add_argument("campaign")
    p_get.set_defaults(func=cmd_get)

    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
