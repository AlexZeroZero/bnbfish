# Open-source architecture

## Trust boundaries

1. The contract is authoritative for allocation, ownership, limits and token metadata.
2. The browser is a presentation and wallet-signing client; local storage cannot create an NFT.
3. The service API is read-only aggregation for the global feed and may be stale during RPC outages.
4. Operator automation, if used by a deployment, must be supplied through private runtime configuration and is not part of the public release.

## Data that must stay private

Never commit private keys, mnemonic phrases, SSH credentials, RPC tokens, TLS account files, server addresses used for administration, operator ledgers or production `.env` files. Use `config/example.json` only as a development template.

## Reproducible checks

```bash
npm test
rg -n -i "private.?key|mnemonic|password|BEGIN .*PRIVATE|\.env" .
```

The second command may match explanatory documentation; inspect matches before publication.
