/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We import directly from the shared package's source. transpilePackages
  // tells Next to pass it through the build instead of expecting compiled JS.
  transpilePackages: ['@ai-task/shared'],
  experimental: {
    typedRoutes: true,
  },
};
export default nextConfig;
