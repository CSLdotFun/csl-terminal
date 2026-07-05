import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "CSL - Trade CS:2 Skins on Solana",
  description:
    "The first platform to leverage trade CS:2 skins on Solana. Long or short your favorite skins with up to 100x leverage.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
          <Toaster />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
