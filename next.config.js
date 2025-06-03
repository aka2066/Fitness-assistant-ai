/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development
  reactStrictMode: true,
  // Add trailing slash to URLs (can help with routing)
  trailingSlash: true,
  // Optimize image handling
  images: {
    domains: ['amplify-fitness-assistant-main-123456.s3.amazonaws.com'],
    unoptimized: true,
  },
  // Configure AWS Amplify specific settings for serverless deployments
  // This helps with environment variables and static optimization
  transpilePackages: [
    '@aws-amplify/ui-react',
    'aws-amplify'
  ],
  // Next.js 14+ uses App Router by default, so we don't need to specify it as experimental
  // The experimental options have been removed to fix build warnings
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
};

export default nextConfig;
