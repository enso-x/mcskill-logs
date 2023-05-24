/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpileModules: ['antd'],
  compiler: {
    styledComponents: true
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  }
}

module.exports = nextConfig
