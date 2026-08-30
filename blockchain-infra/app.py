from web3 import Web3
import hashlib
import sys

# =========================
# RPC CONNECTION
# =========================
RPC_URL = "https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

print("Connected:", w3.is_connected())

# =========================
# CONTRACT
# =========================
contract_address = "0xaCaBAC732725EC9b5969f0Da3061C25D43BD0b5b"

abi = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "campaigns",
      "outputs": [
        {
          "internalType": "string",
          "name": "contentHash",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "creator",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "hash",
          "type": "string"
        }
      ],
      "name": "storeCampaign",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "hash",
          "type": "string"
        }
      ],
      "name": "verifyCampaign",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
contract = w3.eth.contract(address=contract_address, abi=abi)

# =========================
# WALLET
# =========================
private_key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
account = w3.eth.account.from_key(private_key)

# =========================
# HASH FUNCTION
# =========================
def generate_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

# =========================
# STORE
# =========================
def store_campaign(campaign_id, data):
    hash_value = generate_hash(data)

    nonce = w3.eth.get_transaction_count(account.address)

    tx = contract.functions.storeCampaign(
        campaign_id,
        hash_value
    ).build_transaction({
        "chainId": 11155111,
        "gas": 200000,
        "gasPrice": w3.to_wei("10", "gwei"),
        "nonce": nonce,
        "from": account.address
    })

    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    print("TX_HASH:", tx_hash.hex())
    print("STATUS:", receipt.status)

    return tx_hash.hex()

# =========================
# VERIFY
# =========================
def verify_campaign(campaign_id, data):
    hash_value = generate_hash(data)

    result = contract.functions.verifyCampaign(
        campaign_id,
        hash_value
    ).call()

    print("VERIFY RESULT:", result)
    return result

# =========================
# CLI ENTRY POINT
# =========================
if __name__ == "__main__":
    campaign_id = int(sys.argv[1])
    data = sys.argv[2]

    store_campaign(campaign_id, data)
    verify_campaign(campaign_id, data)