FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install web3 eth-account py-solc-x
COPY . .

# Compile the Solidity contract and produce the ABI + bytecode artifact.
# py-solc-x downloads the solc binary automatically.
RUN python -c "\
import json, pathlib, solcx; \
solcx.install_solc('0.8.20'); \
src = pathlib.Path('contracts/CampaignRegistry.sol').read_text(); \
out = solcx.compile_source(src, output_values=['abi','bin'], solc_version='0.8.20'); \
key = [k for k in out if 'CampaignRegistry' in k][0]; \
data = out[key]; \
pathlib.Path('artifacts').mkdir(exist_ok=True); \
pathlib.Path('artifacts/CampaignRegistry.json').write_text( \
    json.dumps({'abi': data['abi'], 'bytecode': data['bin']}, indent=2)); \
print('Compiled CampaignRegistry.sol → artifacts/CampaignRegistry.json')"

ENTRYPOINT ["python"]
CMD ["scripts/deploy.py"]
