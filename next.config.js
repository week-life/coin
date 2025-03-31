/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BINANCE_API_KEY: process.env.BINANCE_API_KEY,
    BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY,
  },
  reactStrictMode: true,
}

module.exports = nextConfig
