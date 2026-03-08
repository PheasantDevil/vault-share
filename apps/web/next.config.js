/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vault-share/api-client', '@vault-share/crypto', '@vault-share/db'],
  output: 'standalone',
};

module.exports = nextConfig;
