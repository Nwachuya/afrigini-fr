/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production build artifacts separate to avoid stale chunk
  // conflicts after switching between `next dev` and `next build`.
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
};

export default nextConfig;
