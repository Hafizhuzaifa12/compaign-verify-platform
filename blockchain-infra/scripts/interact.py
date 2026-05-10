#!/usr/bin/env python3
"""
Member 4: record a content hash for a campaign (dev mock TX hash when chain is not wired).
Replace the body with web3/hardhat calls when your node and contract are configured.

Usage: python interact.py <campaign_id> <sha256_hex_string>
Prints: one line — mock transaction hash (0x + 64 hex chars) for the backend to persist.
"""
from __future__ import annotations

import hashlib
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: interact.py <campaign_id> <content_sha256_hex>", file=sys.stderr)
        return 1
    campaign_id = sys.argv[1]
    content_hash = sys.argv[2]
    # Deterministic mock "transaction" hash; swap for real `storeCampaign(id, hash)` later.
    digest = hashlib.sha256(f"{campaign_id}|{content_hash}".encode("utf-8")).hexdigest()
    print(f"0x{digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
