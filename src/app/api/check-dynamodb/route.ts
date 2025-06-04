import { NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import amplifyconfig from '../../../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplifyconfig);
const client = generateClient();

export async function GET() {
  try {
    console.log('🔍 Checking all DynamoDB tables...');

    // Try to query all tables to see what's actually there
    const results: any = {};

    // Check UserProfiles table
    try {
      const userProfileQuery = `
        query ListUserProfiles {
          listUserProfiles {
            items {
              id
              userId
              name
              age
              heightFeet
              heightInches
              weight
              fitnessGoals
              activityLevel
              owner
              createdAt
              updatedAt
            }
          }
        }
      `;

      const userProfileResult = await client.graphql({
        query: userProfileQuery,
        authMode: 'iam'
      }) as any;

      results.userProfiles = {
        count: userProfileResult.data?.listUserProfiles?.items?.length || 0,
        items: userProfileResult.data?.listUserProfiles?.items || []
      };
    } catch (error) {
      results.userProfiles = { error: error instanceof Error ? error.message : 'Failed to query' };
    }

    // Check WorkoutLogs table
    try {
      const workoutQuery = `
        query ListWorkoutLogs {
          listWorkoutLogs {
            items {
              id
              userId
              type
              duration
              calories
              notes
              owner
              createdAt
            }
          }
        }
      `;

      const workoutResult = await client.graphql({
        query: workoutQuery,
        authMode: 'iam'
      }) as any;

      results.workoutLogs = {
        count: workoutResult.data?.listWorkoutLogs?.items?.length || 0,
        items: workoutResult.data?.listWorkoutLogs?.items || []
      };
    } catch (error) {
      results.workoutLogs = { error: error instanceof Error ? error.message : 'Failed to query' };
    }

    // Check MealLogs table
    try {
      const mealQuery = `
        query ListMealLogs {
          listMealLogs {
            items {
              id
              userId
              type
              calories
              notes
              owner
              createdAt
            }
          }
        }
      `;

      const mealResult = await client.graphql({
        query: mealQuery,
        authMode: 'iam'
      }) as any;

      results.mealLogs = {
        count: mealResult.data?.listMealLogs?.items?.length || 0,
        items: mealResult.data?.listMealLogs?.items || []
      };
    } catch (error) {
      results.mealLogs = { error: error instanceof Error ? error.message : 'Failed to query' };
    }

    console.log('✅ DynamoDB check results:', results);

    return NextResponse.json({
      success: true,
      message: 'DynamoDB table check completed',
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('❌ Error checking DynamoDB:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 