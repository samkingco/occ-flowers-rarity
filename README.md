# OCC Flowers rarity data

This repository contains tooling and data for [OCC Flowers](https://www.occ.xyz/flowers), and is free to use without credit or attribution, for any means.

> OCC#1 🌺 Flowers is a collection 4096 programatically generated on-chain flowers, for you to own or to share. Each flower is 100% generated on-chain, including it's metadata. No ipfs/arweave, no external rendering script. Just SVGs created by the contract.

## Output

- `output/flowers.json` contains all tokenIds, their attributes, and base64 images.
- `output/occurrences.json` contains the number of occurrences by attribute.
- `output/rarity-occurrences.json` contains a mapping of `tokenId` to `score` (which is the sum of number of occcrences of each child attribute for a `tokenId`), sorted ascending by `score`. It also includes `rarest` which is how rare the flowers attributes are (`1` == `rarest`, `4096` == `least rare`), based on this specific ranking mechanism.
- `output/rarity-probability.json` contains a mapping of `tokenId` to `rank` by probabilistic occurence rather than rank.
- `output/rarity-rt-formula.json` contains a mapping of `tokenId` to `rank` using the [Rarity Tools](https://rarity.tools/) formula of `score = 1 / (sum of items with trait value / total items)`.

## Run locally

Add a `.env` file with the `ETH_PROVIDER_URL` variable to use a custom RPC provider. Falls back to `http://localhost:8545`.

```bash
# Install dependencies
npm install

# Pick all flowers
npm run collect

# Parse flower statistics
npm run parse
```

# Credits

- [Anish Agnihotri](https://github.com/Anish-Agnihotri) for the orignal versions of these scripts for [loot](https://www.lootproject.com/).

# License

OCC Flowers rarity is licensed under [The Unlicense](https://github.com/samkingco/occ-flowers-rarity/blob/master/LICENSE)—a license with no conditions whatsoever which dedicates works to the public domain.

Unlicensed works, modifications, and larger works may be distributed under different terms and without source code.
