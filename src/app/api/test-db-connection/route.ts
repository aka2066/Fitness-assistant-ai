import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify for server-side use
Amplify.configure(outputs, { ssr: true });

export async function GET() {
  try {
    // Simple connection test without authentication
    const results = {
      amplify_configured: true,
      graphql_endpoint: outputs.data?.url || 'Not configured',
      region: outputs.data?.aws_region || 'Not configured',
      auth_type: outputs.data?.default_authorization_type || 'Not configured',
      user_pool_id: outputs.auth?.user_pool_id || 'Not configured',
      tables_configured: ['UserProfile', 'WorkoutLog', 'MealLog'],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration check completed',
      results
    });

  } catch (error) {
    console.error('Configuration check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch {
      // If no JSON body, use defaults
      body = {};
    }

    const { testType = 'config' } = body;

    const results = {
      test_type: testType,
      amplify_configured: true,
      graphql_endpoint: outputs.data?.url || 'Not configured',
      region: outputs.data?.aws_region || 'Not configured',
      auth_type: outputs.data?.default_authorization_type || 'Not configured',
      user_pool_id: outputs.auth?.user_pool_id || 'Not configured',
      tables_configured: ['UserProfile', 'WorkoutLog', 'MealLog'],
      note: 'This is a configuration test. Authenticated GraphQL calls require user login.',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration test completed successfully',
      results
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to test database connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 