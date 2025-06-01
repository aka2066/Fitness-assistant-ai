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
  // Configure server-side optimization
  experimental: {
    // Enable app directory if using the app router
    appDir: true,
    // Optimize for server components
    serverComponents: true,
  },
  // Disable source maps in production to reduce build size
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
