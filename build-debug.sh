#!/bin/bash

# Script to debug Next.js build issues
echo "Build debugging script started at $(date)"

# Print environment info
echo "==== Environment Info ===="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check package.json
echo "==== Package.json contents ===="
cat package.json

# Check Next.js config
echo "==== Next.js config check ===="
if [ -f "next.config.js" ]; then
  echo "next.config.js exists:"
  cat next.config.js
else
  echo "next.config.js does not exist"
fi

# Check for environment variables
echo "==== Environment Variables Check ===="
if [ -z "$OPENAI_API_KEY" ]; then
  echo "WARNING: OPENAI_API_KEY is not set"
else
  echo "OPENAI_API_KEY is set (value hidden)"
fi

if [ -z "$PINECONE_API_KEY" ]; then
  echo "WARNING: PINECONE_API_KEY is not set"
else
  echo "PINECONE_API_KEY is set (value hidden)"
fi

if [ -z "$PINECONE_INDEX_NAME" ]; then
  echo "WARNING: PINECONE_INDEX_NAME is not set"
else
  echo "PINECONE_INDEX_NAME value: $PINECONE_INDEX_NAME"
fi

# Try building with increased memory and debug
echo "==== Starting build with increased memory ===="
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Report build status
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "Build completed successfully!"
else
  echo "Build failed with exit code $BUILD_STATUS"
fi

echo "Build debugging script completed at $(date)"
exit $BUILD_STATUS
