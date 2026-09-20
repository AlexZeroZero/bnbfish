# BNBFISH

<p align="center"><img src="web/assets/brand/bnbfish-app-icon-v1.png" width="160" alt="BNBFISH icon"></p>

<p align="center"><strong>BNBFISH</strong> · BNB Smart Chain fishing game and ERC-721 collectible reference implementation</p>

> This project is for entertainment, collection and software development. NFTs have no promised economic value.

## What is included

- `contracts/` — Solidity contracts, fixed supply allocation and ERC-721 metadata.
- `web/` — browser game UI, responsive layout, localization, card gallery and artwork.
- `service/` — read-only web API and on-chain global catch statistics.
- `tests/` — local contract, protocol, budget and UI regression tests.
- `docs/` — public protocol and integration notes.
- `config/example.json` — safe local configuration with zero addresses.

## Architecture

```text
Browser wallet ── transaction ──> BNB Chain contract ──> ERC-721 catch
       │                                  │
       └──── read-only API <──────────────┘
                    │
             global catch feed
```

The browser never receives a seed phrase or private key. Claims and transfers are signed by the user wallet. The read-only API is not the source of truth; contract state and ERC-721 events are authoritative.

## Local development

Requirements: Node.js 20+, npm or pnpm, and a local EVM node for contract tests.

```bash
npm install
cp .env.example .env
cp config/example.json config/production.json
npm run build
npm test
npm start
```

Open `http://localhost:4187/`. The example config uses a zero contract address and local-development mode. Do not use it to sign or send mainnet transactions.

## Mainnet deployment

Production deployment is intentionally excluded from this public repository. Keep server credentials, operator keys, TLS files, RPC tokens and deployment state in a separate private operations repository or secret manager. Inject secrets at runtime; never commit them. Verify contract source and bytecode independently on BscScan before interacting with a deployment.

## NFT images and metadata

The contract provides ERC-721 metadata. Card artwork is served as a web asset in this reference implementation. Integrators should read `tokenURI`, verify ownership with `ownerOf`, and treat image URLs as presentation assets. See [`web/developers/nft/index.html`](web/developers/nft/index.html).

## Security and privacy

See [`SECURITY.md`](SECURITY.md). Do not put SSH passwords, seed phrases, private keys, RPC credentials, server IPs or operator state in issues, pull requests or commits.

## License

MIT. Artwork and third-party dependencies retain their own licenses.
