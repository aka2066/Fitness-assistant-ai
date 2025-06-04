import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// AWS SDK v2 DynamoDB client
AWS.config.update({
  region: 'us-east-2',
  ...(process.env.AMPLIFY_ACCESS_KEY_ID && process.env.AMPLIFY_SECRET_ACCESS_KEY && {
    accessKeyId: process.env.AMPLIFY_ACCESS_KEY_ID,
    secretAccessKey: process.env.AMPLIFY_SECRET_ACCESS_KEY,
  })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    console.log('🔍 get-profile: Looking for userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'UserId is required' 
      }, { status: 400 });
    }

    // Fetch user profile from DynamoDB
    const result = await dynamodb.scan({
      TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();

    console.log('🔍 get-profile: Found', result.Items?.length || 0, 'items');
    
    const profile = result.Items?.[0];
    
    if (profile && profile.name) {
      console.log('✅ get-profile: Found profile for', profile.name);
      return NextResponse.json({
        success: true,
        profile: {
          name: profile.name,
          age: profile.age,
          fitnessGoals: profile.fitnessGoals,
          activityLevel: profile.activityLevel
        }
      });
    }

    console.log('❌ get-profile: No profile found for userId:', userId);
    // No profile found
    return NextResponse.json({
      success: false,
      error: 'No profile found'
    }, { status: 404 });

  } catch (error) {
    console.error('❌ get-profile error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 });
  }
} 