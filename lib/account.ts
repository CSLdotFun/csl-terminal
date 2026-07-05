// Shared client-side account store. Real actions only: balance starts at 0
// (no deposits yet), positions/history reflect what the user actually did.
export type Side = "long" | "short"
export type Position = {
  id: string; key: string; name: string; image: string; side: Side
  entry: number; collateral: number; leverage: number; notional: number; units: number; liq: number; openedAt: number
}
export type ClosedTrade = {
  id: string; key: string; name: string; image: string; side: Side
  leverage: number; entry: number; exit: number; pnl: number; closedAt: number
}
export type Account = {
  balance: number
  realized: number
  volume: number
  trades: number
  positions: Position[]
  history: ClosedTrade[]
}

const KEY = "csl_account_v2"
export const emptyAccount = (): Account => ({ balance: 0, realized: 0, volume: 0, trades: 0, positions: [], history: [] })

export function loadAccount(): Account {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyAccount()
    const a = JSON.parse(raw)
    return {
      balance: Number(a.balance) || 0,
      realized: Number(a.realized) || 0,
      volume: Number(a.volume) || 0,
      trades: Number(a.trades) || 0,
      positions: Array.isArray(a.positions) ? a.positions : [],
      history: Array.isArray(a.history) ? a.history : [],
    }
  } catch { return emptyAccount() }
}

export function saveAccount(a: Account) {
  try { localStorage.setItem(KEY, JSON.stringify(a)) } catch {}
}
