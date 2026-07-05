<div align="center">
  <img src="https://raw.githubusercontent.com/CSLdotFun/.github/main/profile/csl-logo.png" width="90" alt="CSL"/>

  # csl-terminal

  ![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
  ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
  ![Privy](https://img.shields.io/badge/auth-Privy-6A5BFF)
  ![Deploy](https://img.shields.io/badge/deploy-Vercel-000000?logo=vercel&logoColor=white)
</div>

Trading terminal and landing for **CSL** — the first perpetual exchange for CS:2 skins on Solana.

→ Next.js 14, Tailwind, shadcn/ui  
→ TradingView lightweight-charts: 15m–1W candles, full history since each skin's release  
→ Live prices over SSE from [`csl-backend`](https://github.com/CSLdotFun/csl-backend)  
→ Privy auth — Twitter, Google, Phantom (Solana)  
→ Auth-gated trading, zero-balance accounts until USDC deposits ship

## Run

```
npm install
npm run dev
```

Set the price engine URL in `.env.production`:

```
NEXT_PUBLIC_API_URL=https://<your-backend>
```

Empty value falls back to a built-in simulated feed for local dev.

## Deploy

Vercel: `vercel --prod`

— [csl.fun](https://csl.fun) · [docs.csl.fun](https://docs.csl.fun) · [@csldotfun](https://x.com/csldotfun)
