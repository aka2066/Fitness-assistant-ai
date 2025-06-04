import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check what environment variables are available
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      
      // AWS/Amplify credentials
      hasAmplifyAccessKey: !!process.env.AMPLIFY_ACCESS_KEY_ID,
      hasAmplifySecretKey: !!process.env.AMPLIFY_SECRET_ACCESS_KEY,
      amplifyAccessKeyStart: process.env.AMPLIFY_ACCESS_KEY_ID?.substring(0, 8) + '...',
      
      // Legacy AWS variables (just to check)
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsAccessKeyStart: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
      
      // OpenAI and Pinecone
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyStart: process.env.OPENAI_API_KEY?.substring(0, 8) + '...',
      hasPinecone: !!process.env.PINECONE_API_KEY,
      pineconeIndexName: process.env.PINECONE_INDEX_NAME,
      
      // All environment variable keys (filtered for security)
      allEnvKeys: Object.keys(process.env).filter(key => 
        !key.includes('SECRET') && 
        !key.includes('PASSWORD') && 
        !key.includes('TOKEN') &&
        !key.includes('KEY')
      ).sort()
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck
    });

  } catch (error) {
    console.error('Environment debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
} 