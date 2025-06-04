import { NextRequest, NextResponse } from 'next/server';
import AWS from 'aws-sdk';
import { getAwsConfig } from '../aws-config';

// Configure AWS SDK v2
AWS.config.update(getAwsConfig());
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

    console.log('🔍 Debugging user data for:', userId);

    // Check all three tables for this user
    const results = await Promise.allSettled([
      // Profile
      dynamodb.scan({
        TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }).promise(),

      // Workouts  
      dynamodb.scan({
        TableName: 'WorkoutLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId', 
        ExpressionAttributeValues: { ':userId': userId }
      }).promise(),

      // Meals
      dynamodb.scan({
        TableName: 'MealLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      }).promise()
    ]);

    const profile = results[0].status === 'fulfilled' ? (results[0].value as any).Items?.[0] : null;
    const workouts = results[1].status === 'fulfilled' ? (results[1].value as any).Items || [] : [];
    const meals = results[2].status === 'fulfilled' ? (results[2].value as any).Items || [] : [];

    // Get a sample of existing userIds to see what's in the database
    const sampleQuery = await dynamodb.scan({
      TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
      Limit: 10,
      ProjectionExpression: 'userId, #n',
      ExpressionAttributeNames: { '#n': 'name' }
    }).promise();

    return NextResponse.json({
      success: true,
      debug: {
        searchedUserId: userId,
        foundProfile: profile,
        foundWorkouts: workouts.length,
        foundMeals: meals.length,
        workoutDetails: workouts.slice(0, 3).map((w: any) => ({
          type: w.type,
          date: w.date || w.createdAt,
          calories: w.calories,
          duration: w.duration
        })),
        mealDetails: meals.slice(0, 3).map((m: any) => ({
          type: m.type,
          date: m.date || m.createdAt, 
          calories: m.calories,
          foods: m.foods
        })),
        existingUserIds: sampleQuery.Items?.map(item => item.userId) || [],
        tableAccess: {
          profile: results[0].status === 'fulfilled',
          workouts: results[1].status === 'fulfilled', 
          meals: results[2].status === 'fulfilled'
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 