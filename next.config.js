/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpileModules: ['antd'],
  compiler: {
    styledComponents: true
  }
}

module.exports = nextConfig
