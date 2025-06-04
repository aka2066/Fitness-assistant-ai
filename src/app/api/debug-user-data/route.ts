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

    console.log('🔍 Debug: Looking for user data for userId:', userId);
    console.log('🔍 Debug: UserId validation test:', {
      userId: userId,
      length: userId.length,
      regexTest: /^[a-zA-Z0-9\-_.@]+$/.test(userId),
      containsHyphens: userId.includes('-'),
      type: typeof userId
    });

    // Check all three tables
    const results = await Promise.allSettled([
      // 1. Check UserProfile table
      dynamodb.scan({
        TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise(),

      // 2. Check WorkoutLog table
      dynamodb.scan({
        TableName: 'WorkoutLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise(),

      // 3. Check MealLog table
      dynamodb.scan({
        TableName: 'MealLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise(),

      // 4. Also scan first few items to see what userIds exist
      dynamodb.scan({
        TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
        Limit: 10
      }).promise()
    ]);

    const profile = results[0].status === 'fulfilled' 
      ? (results[0].value as any).Items || []
      : [];

    const workouts = results[1].status === 'fulfilled' 
      ? (results[1].value as any).Items || []
      : [];

    const meals = results[2].status === 'fulfilled' 
      ? (results[2].value as any).Items || []
      : [];

    const allProfiles = results[3].status === 'fulfilled' 
      ? (results[3].value as any).Items || []
      : [];

    // Extract sample userIds from the database for comparison
    const existingUserIds = allProfiles.map(p => p.userId).filter(Boolean);

    return NextResponse.json({
      success: true,
      debug: {
        searchedUserId: userId,
        foundProfile: profile.length > 0 ? profile[0] : null,
        foundWorkouts: workouts.length,
        foundMeals: meals.length,
        existingUserIds: existingUserIds.slice(0, 5), // Show first 5 for comparison
        allProfilesCount: allProfiles.length,
        tableAccess: {
          profile: results[0].status === 'fulfilled',
          workouts: results[1].status === 'fulfilled', 
          meals: results[2].status === 'fulfilled',
          scan: results[3].status === 'fulfilled'
        }
      }
    });

  } catch (error) {
    console.error('Debug user data error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to debug user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 