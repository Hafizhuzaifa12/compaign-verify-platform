from web3 import Web3
import hashlib

# =========================
# 1. RPC CONNECTION
# =========================
RPC_URL = "https://sepolia.infura.io/v3/7bb4956380e1413b931c49602a0dd1a0"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

print("Connected:", w3.is_connected())

# =========================
# 2. CONTRACT DETAILS
# =========================
contract_address = "0xaCaBAC732725EC9b5969f0Da3061C25D43BD0b5b"

abi = [
    {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "campaigns",
        "outputs": [
            {"internalType": "string", "name": "contentHash", "type": "string"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "creator", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "string", "name": "hash", "type": "string"}
        ],
        "name": "storeCampaign",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "id", "type": "uint256"},
            {"internalType": "string", "name": "hash", "type": "string"}
        ],
        "name": "verifyCampaign",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

contract = w3.eth.contract(address=contract_address, abi=abi)

# =========================
# 3. WALLET SETUP
# =========================
private_key = "1fbe4b54fcd4467580e431bd2cbc0634b110fadf204c0bf8a965d555cc9fd65e"  # ⚠️ NEVER SHARE PUBLICLY
account = w3.eth.account.from_key(private_key)

# =========================
# 4. HASH FUNCTION
# =========================
def generate_hash(data):
    return hashlib.sha256(data.encode()).hexdigest()

# =========================
# 5. STORE FUNCTION
# =========================
def store_campaign(campaign_id, data):
    hash_value = generate_hash(data)
    print("STORE HASH:", hash_value)

    nonce = w3.eth.get_transaction_count(account.address)

    txn = contract.functions.storeCampaign(
        campaign_id,
        hash_value
    ).build_transaction({
        "chainId": 11155111,  # Sepolia
        "gas": 200000,
        "gasPrice": w3.to_wei("10", "gwei"),
        "nonce": nonce,
        "from": account.address
    })

    signed_txn = w3.eth.account.sign_transaction(txn, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

    print("Store TX Hash:", w3.to_hex(tx_hash))

# =========================
# 6. VERIFY FUNCTION
# =========================
def verify_campaign(campaign_id, data):
    hash_value = generate_hash(data)
    print("VERIFY HASH:", hash_value)

    result = contract.functions.verifyCampaign(
        campaign_id,
        hash_value
    ).call()

    print("Verification Result:", result)

# =========================
# 7. TEST RUN
# =========================
if __name__ == "__main__":

    print("Account:", account.address)

    data = "My First Campaign Data"

    store_campaign(1, data)
    verify_campaign(1, data)