# csl-terminal

Trading terminal and landing for **CSL** — the first perpetual exchange for CS:2 skins on **Robinhood Chain**.

![Chain](https://img.shields.io/badge/chain-Robinhood%20Chain-CDF60A?logoColor=black)
![Settlement](https://img.shields.io/badge/settlement-USDG-10b981)
![Wallet](https://img.shields.io/badge/wallet-MetaMask%20%2F%20WalletConnect-f6851b)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)

→ Wallet auth — MetaMask / WalletConnect on Robinhood Chain (chainId 4663)  
→ Long or short 17 curated skin markets, up to 20x leverage  
→ TradingView-style charts, live skin-market feed over SSE  
→ Collateral and PnL in **USDG**; zero-balance accounts until USDG deposits ship at launch

## Stack

Next.js · TypeScript · wagmi + viem + RainbowKit · Tailwind · Vercel

## Develop

```
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_USDG_ADDRESS`, `NEXT_PUBLIC_WC_PROJECT_ID`.

## Deploy

```
vercel --prod
```
