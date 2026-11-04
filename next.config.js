/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Native / server-only packages must not be bundled by webpack.
    serverComponentsExternalPackages: ['argon2', 'mongoose'],
  },
};

module.exports = nextConfig;
