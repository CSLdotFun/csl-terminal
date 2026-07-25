/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // wagmi/walletconnect optional peer deps we don't use
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stripe/crypto": false,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
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
