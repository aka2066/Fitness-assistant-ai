import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify for server-side use
Amplify.configure(outputs, { ssr: true });

const client = generateClient();

export async function POST(request: NextRequest) {
  try {
    const { userId, testType } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const results = {
      cognito: { connected: true, userId },
      dynamodb: { connected: false, tables: {} as any },
      errors: [] as string[]
    };

    // Test 1: UserProfile table
    try {
      if (testType === 'create-profile' || testType === 'all') {
        const createProfileQuery = `
          mutation CreateUserProfile($input: CreateUserProfileInput!) {
            createUserProfile(input: $input) {
              id
              userId
              name
              age
              createdAt
              owner
            }
          }
        `;
        
        const profileResult: any = await client.graphql({
          query: createProfileQuery,
          variables: {
            input: {
              userId: userId,
              name: `Test User ${Date.now()}`,
              age: 25,
              owner: userId
            }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          UserProfile: {
            connected: true,
            created: profileResult.data?.createUserProfile || null
          }
        };
      }
    } catch (error: any) {
      results.errors.push(`UserProfile error: ${error.message}`);
      results.dynamodb.tables = {
        ...results.dynamodb.tables,
        UserProfile: { connected: false, error: error.message }
      };
    }

    // Test 2: WorkoutLog table
    try {
      if (testType === 'create-workout' || testType === 'all') {
        const createWorkoutQuery = `
          mutation CreateWorkoutLog($input: CreateWorkoutLogInput!) {
            createWorkoutLog(input: $input) {
              id
              userId
              type
              duration
              date
              createdAt
              owner
            }
          }
        `;
        
        const workoutResult: any = await client.graphql({
          query: createWorkoutQuery,
          variables: {
            input: {
              userId: userId,
              type: "Test Workout",
              duration: 30,
              date: new Date().toISOString(),
              owner: userId
            }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          WorkoutLog: {
            connected: true,
            created: workoutResult.data?.createWorkoutLog || null
          }
        };
      }
    } catch (error: any) {
      results.errors.push(`WorkoutLog error: ${error.message}`);
      results.dynamodb.tables = {
        ...results.dynamodb.tables,
        WorkoutLog: { connected: false, error: error.message }
      };
    }

    // Test 3: MealLog table
    try {
      if (testType === 'create-meal' || testType === 'all') {
        const createMealQuery = `
          mutation CreateMealLog($input: CreateMealLogInput!) {
            createMealLog(input: $input) {
              id
              userId
              type
              calories
              date
              createdAt
              owner
            }
          }
        `;
        
        const mealResult: any = await client.graphql({
          query: createMealQuery,
          variables: {
            input: {
              userId: userId,
              type: "Test Meal",
              calories: 500,
              date: new Date().toISOString(),
              owner: userId
            }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          MealLog: {
            connected: true,
            created: mealResult.data?.createMealLog || null
          }
        };
      }
    } catch (error: any) {
      results.errors.push(`MealLog error: ${error.message}`);
      results.dynamodb.tables = {
        ...results.dynamodb.tables,
        MealLog: { connected: false, error: error.message }
      };
    }

    // Test 4: List existing data
    if (testType === 'list' || testType === 'all') {
      try {
        // List profiles
        const listProfilesQuery = `
          query ListUserProfiles($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter) {
              items {
                id
                userId
                name
                age
                createdAt
              }
            }
          }
        `;
        
        const profilesResult: any = await client.graphql({
          query: listProfilesQuery,
          variables: {
            filter: { userId: { eq: userId } }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          UserProfile: {
            ...results.dynamodb.tables.UserProfile,
            existing: profilesResult.data?.listUserProfiles?.items || []
          }
        };
      } catch (error: any) {
        results.errors.push(`List profiles error: ${error.message}`);
      }

      try {
        // List workouts
        const listWorkoutsQuery = `
          query ListWorkoutLogs($filter: ModelWorkoutLogFilterInput) {
            listWorkoutLogs(filter: $filter) {
              items {
                id
                userId
                type
                duration
                date
                createdAt
              }
            }
          }
        `;
        
        const workoutsResult: any = await client.graphql({
          query: listWorkoutsQuery,
          variables: {
            filter: { userId: { eq: userId } }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          WorkoutLog: {
            ...results.dynamodb.tables.WorkoutLog,
            existing: workoutsResult.data?.listWorkoutLogs?.items || []
          }
        };
      } catch (error: any) {
        results.errors.push(`List workouts error: ${error.message}`);
      }

      try {
        // List meals
        const listMealsQuery = `
          query ListMealLogs($filter: ModelMealLogFilterInput) {
            listMealLogs(filter: $filter) {
              items {
                id
                userId
                type
                calories
                date
                createdAt
              }
            }
          }
        `;
        
        const mealsResult: any = await client.graphql({
          query: listMealsQuery,
          variables: {
            filter: { userId: { eq: userId } }
          }
        });

        results.dynamodb.tables = {
          ...results.dynamodb.tables,
          MealLog: {
            ...results.dynamodb.tables.MealLog,
            existing: mealsResult.data?.listMealLogs?.items || []
          }
        };
      } catch (error: any) {
        results.errors.push(`List meals error: ${error.message}`);
      }
    }

    // Determine if DynamoDB is connected
    results.dynamodb.connected = Object.values(results.dynamodb.tables).some((table: any) => table.connected);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      testType,
      results
    });

  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test database connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 