/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vault-share/api-client', '@vault-share/crypto', '@vault-share/db'],
};

module.exports = nextConfig;
