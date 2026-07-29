"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAccount, useSignMessage } from "wagmi"

const API = process.env.NEXT_PUBLIC_API_URL || ""

type StoredToken = { token: string; exp: number }

function storageKey(addr: string) { return `csl_auth_${addr.toLowerCase()}` }

function readToken(addr: string | undefined): string | null {
  if (!addr || typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey(addr))
    if (!raw) return null
    const parsed: StoredToken = JSON.parse(raw)
    if (!parsed?.token || Date.now() > parsed.exp) return null
    return parsed.token
  } catch { return null }
}

function writeToken(addr: string, token: string) {
  try {
    // decode the payload's exp without needing a JWT library — same shape the backend issues
    const [body] = token.split(".")
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")))
    window.localStorage.setItem(storageKey(addr), JSON.stringify({ token, exp: payload.exp } as StoredToken))
  } catch {
    // fall back to a conservative 1-day cache if decoding ever fails
    window.localStorage.setItem(storageKey(addr), JSON.stringify({ token, exp: Date.now() + 86400000 }))
  }
}

/**
 * Wallet sign-in: proves control of the connected address via a signed
 * message (no gas, no transaction) and caches the resulting session token.
 * Every authenticated API call should use `authHeader()` instead of the old
 * `x-wallet` header — the backend now verifies a real signature happened.
 */
export function useAuthToken() {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [token, setToken] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const inFlight = useRef<Promise<string | null> | null>(null)

  useEffect(() => {
    setToken(isConnected ? readToken(address) : null)
  }, [address, isConnected])

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!address) return null
    const cached = readToken(address)
    if (cached) { setToken(cached); return cached }
    if (inFlight.current) return inFlight.current

    const run = (async () => {
      setSigningIn(true)
      try {
        const nonceRes = await fetch(`${API}/api/auth/nonce?address=${address}`)
        if (!nonceRes.ok) return null
        const { message } = await nonceRes.json()
        const signature = await signMessageAsync({ message })
        const verifyRes = await fetch(`${API}/api/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature }),
        })
        if (!verifyRes.ok) return null
        const { token: newToken } = await verifyRes.json()
        writeToken(address, newToken)
        setToken(newToken)
        return newToken
      } catch {
        return null // user rejected the signature, or a network error — caller decides how to handle "no token"
      } finally {
        setSigningIn(false)
        inFlight.current = null
      }
    })()
    inFlight.current = run
    return run
  }, [address, signMessageAsync])

  // convenience: get a valid token, signing in transparently if needed
  const getToken = useCallback(async (): Promise<string | null> => {
    return token ?? (await signIn())
  }, [token, signIn])

  const authHeader = useCallback((t?: string | null): Record<string, string> => {
    const use = t ?? token
    return use ? { Authorization: `Bearer ${use}` } : {}
  }, [token])

  return { token, signedIn: !!token, signingIn, signIn, getToken, authHeader }
}
