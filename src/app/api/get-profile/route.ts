import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// AWS SDK v2 DynamoDB client
AWS.config.update({
  region: 'us-east-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
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

    const profile = result.Items?.[0];
    
    if (profile && profile.name) {
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

    // No profile found
    return NextResponse.json({
      success: false,
      error: 'No profile found'
    }, { status: 404 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile'
    }, { status: 500 });
  }
} 