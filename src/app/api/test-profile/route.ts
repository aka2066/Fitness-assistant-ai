import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify for server-side use
Amplify.configure(outputs, { ssr: true });

export async function GET() {
  try {
    console.log('🔍 Testing Amplify configuration...');

    const configInfo = {
      graphql_endpoint: outputs.data?.url || 'Not configured',
      region: outputs.data?.aws_region || 'Not configured',
      auth_type: outputs.data?.default_authorization_type || 'Not configured',
      user_pool_id: outputs.auth?.user_pool_id || 'Not configured',
      user_pool_client_id: outputs.auth?.user_pool_client_id || 'Not configured',
      tables: ['UserProfile', 'WorkoutLog', 'MealLog'],
      note: 'Configuration check only - authenticated queries require user login in frontend'
    };
    
    console.log('📊 Amplify configuration:', configInfo);

    return NextResponse.json({
      success: true,
      message: 'Amplify configuration loaded successfully',
      config: configInfo
    });
    
  } catch (error) {
    console.error('❌ Configuration test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    const { message = 'test' } = body;
    
    console.log('🔄 API test endpoint called with:', message);

    return NextResponse.json({
      success: true,
      message: 'API endpoint is working correctly',
      received: message,
      timestamp: new Date().toISOString(),
      note: 'This is a test endpoint. Real profile operations happen in the frontend with user authentication.'
    });
    
  } catch (error) {
    console.error('❌ API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
} 