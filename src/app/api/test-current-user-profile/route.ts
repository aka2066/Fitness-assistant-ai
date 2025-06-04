import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-2',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    console.log('🧪 Testing current user profile access for chatbot:', userId);

    // Test direct DynamoDB scan for user's profile (same method as enhanced chatbot)
    const scanResult = await dynamodb.scan({
      TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise();

    const profile = scanResult.Items && scanResult.Items.length > 0 ? scanResult.Items[0] : null;

    if (profile) {
      return NextResponse.json({
        success: true,
        message: 'Profile found successfully for chatbot!',
        profile: {
          name: profile.name,
          age: profile.age,
          heightFeet: profile.heightFeet,
          heightInches: profile.heightInches,
          weight: profile.weight,
          fitnessGoals: profile.fitnessGoals,
          activityLevel: profile.activityLevel,
          dietaryRestrictions: profile.dietaryRestrictions
        },
        userId: userId,
        canAccessData: true
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No profile found for this user',
        userId: userId,
        canAccessData: false
      });
    }

  } catch (error) {
    console.error('❌ Error testing user profile access:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      canAccessData: false
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST your userId to test profile access for chatbot',
    example: { userId: 'your-user-id' }
  });
} 