/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app talks to the backend directly via NEXT_PUBLIC_API_URL (absolute,
  // including the /api/v1 suffix). No local package transpilation or rewrites
  // are required, which keeps the Vercel build self-contained.
};

module.exports = nextConfig;
