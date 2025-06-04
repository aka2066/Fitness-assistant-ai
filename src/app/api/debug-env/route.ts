import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development or with a secret key for security
  const authHeader = request.headers.get('x-debug-key');
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev && authHeader !== 'debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET ✅' : 'MISSING ❌',
    PINECONE_API_KEY: process.env.PINECONE_API_KEY ? 'SET ✅' : 'MISSING ❌',
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'MISSING ❌',
    AWS_REGION: process.env.AWS_REGION || 'NOT SET',
    // Show available env vars (filtered for security)
    availableEnvVars: Object.keys(process.env)
      .filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('TOKEN'))
      .slice(0, 20)
  };

  return NextResponse.json({
    environment: envCheck,
    timestamp: new Date().toISOString(),
    host: request.headers.get('host'),
    message: 'Environment variable check complete'
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
} 