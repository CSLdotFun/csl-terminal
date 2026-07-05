/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Privy optional peer deps we don't use (fiat onramp, farcaster, memo ix)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stripe/crypto": false,
      "@farcaster/mini-app-solana": false,
      "@solana-program/memo": false,
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
