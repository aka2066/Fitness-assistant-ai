/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'fitness-assistant',
    AMPLIFY_ACCESS_KEY_ID: process.env.AMPLIFY_ACCESS_KEY_ID,
    AMPLIFY_SECRET_ACCESS_KEY: process.env.AMPLIFY_SECRET_ACCESS_KEY,
  },
  experimental: {
    serverComponentsExternalPackages: ['aws-sdk']
  }
}

module.exports = nextConfig
