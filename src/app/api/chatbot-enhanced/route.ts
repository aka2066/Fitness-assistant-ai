import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import AWS from 'aws-sdk';
import outputs from '../../../../amplify_outputs.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure AWS SDK as backup
AWS.config.update({
  region: 'us-east-2',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Try to configure Amplify (might not work in API routes)
try {
  Amplify.configure(outputs);
} catch (error) {
  console.log('🔧 Amplify config failed in API route, using AWS SDK fallback');
}

const client = generateClient();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserData {
  profile: any;
  workouts: any[];
  meals: any[];
}

// Fetch user data using GraphQL (try first)
async function fetchUserDataGraphQL(userId: string): Promise<UserData> {
  try {
    console.log('🔍 Trying GraphQL method for user:', userId);

    const results = await Promise.allSettled([
      // Fetch user profile
      client.graphql({
        query: `
          query ListUserProfiles($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter) {
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
                dietaryRestrictions
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: {
          filter: {
            userId: { eq: userId }
          }
        }
      }),
      // Fetch workout logs
      client.graphql({
        query: `
          query ListWorkoutLogs($filter: ModelWorkoutLogFilterInput) {
            listWorkoutLogs(filter: $filter) {
              items {
                id
                userId
                type
                duration
                calories
                notes
                createdAt
              }
            }
          }
        `,
        variables: {
          filter: {
            userId: { eq: userId }
          }
        }
      }),
      // Fetch meal logs
      client.graphql({
        query: `
          query ListMealLogs($filter: ModelMealLogFilterInput) {
            listMealLogs(filter: $filter) {
              items {
                id
                userId
                type
                calories
                notes
                createdAt
              }
            }
          }
        `,
        variables: {
          filter: {
            userId: { eq: userId }
          }
        }
      })
    ]);

    const profileResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const workoutResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const mealResult = results[2].status === 'fulfilled' ? results[2].value : null;

    const profile = (profileResult as any)?.data?.listUserProfiles?.items?.[0] || null;
    const workouts = (workoutResult as any)?.data?.listWorkoutLogs?.items || [];
    const meals = (mealResult as any)?.data?.listMealLogs?.items || [];

    // Check if we got valid data
    if (profile || workouts.length > 0 || meals.length > 0) {
      console.log('✅ GraphQL method successful');
      return { profile, workouts, meals };
    } else {
      throw new Error('No data returned from GraphQL');
    }

  } catch (error) {
    console.log('❌ GraphQL method failed:', error);
    throw error;
  }
}

// Fetch user data using AWS SDK (fallback)
async function fetchUserDataAWS(userId: string): Promise<UserData> {
  try {
    console.log('🔧 Using AWS SDK fallback method for user:', userId);

    const results = await Promise.allSettled([
      // Fetch user profile
      dynamodb.scan({
        TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise(),

      // Fetch workout logs
      dynamodb.scan({
        TableName: 'WorkoutLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise(),

      // Fetch meal logs
      dynamodb.scan({
        TableName: 'MealLog-b7vimfsyujdibnpphmpxriv3c4-NONE',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      }).promise()
    ]);

    // Extract data from results
    const profile = results[0].status === 'fulfilled' 
      ? (results[0].value as any).Items?.[0] 
      : null;

    const workouts = results[1].status === 'fulfilled' 
      ? (results[1].value as any).Items || []
      : [];

    const meals = results[2].status === 'fulfilled' 
      ? (results[2].value as any).Items || []
      : [];

    // Sort by date (newest first)
    workouts.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    meals.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    console.log('✅ AWS SDK fallback successful');
    return { profile, workouts, meals };

  } catch (error) {
    console.log('❌ AWS SDK fallback also failed:', error);
    return { profile: null, workouts: [], meals: [] };
  }
}

// Hybrid fetch: try GraphQL first, fallback to AWS SDK
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    // Try GraphQL method first (works in client-side and some API environments)
    const data = await fetchUserDataGraphQL(userId);
    return data;
  } catch (error) {
    // Fallback to AWS SDK method (works in all environments)
    console.log('🔄 Falling back to AWS SDK method...');
    const data = await fetchUserDataAWS(userId);
    return data;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, chatHistory = [] } = await request.json();
    
    console.log('🤖 Enhanced chatbot request:', {
      message,
      userId,
      historyLength: chatHistory.length
    });

    if (!message?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      });
    }

    // Fetch user's real data from DynamoDB (hybrid approach)
    const userData = await fetchUserData(userId);
    
    // Build personalized context
    let personalizedContext = '';
    let hasPersonalizedData = false;
    let contextDataPoints = 0;

    if (userData.profile) {
      hasPersonalizedData = true;
      contextDataPoints++;
      personalizedContext += `User Profile: ${userData.profile.name || 'User'}, age ${userData.profile.age}, `;
      
      if (userData.profile.heightFeet && userData.profile.heightInches) {
        personalizedContext += `height ${userData.profile.heightFeet}'${userData.profile.heightInches}", `;
      }
      
      if (userData.profile.weight) {
        personalizedContext += `weight ${userData.profile.weight} lbs, `;
      }
      
      if (userData.profile.fitnessGoals) {
        personalizedContext += `fitness goals: ${userData.profile.fitnessGoals}, `;
      }
      
      if (userData.profile.activityLevel) {
        personalizedContext += `activity level: ${userData.profile.activityLevel}, `;
      }
      
      if (userData.profile.dietaryRestrictions) {
        personalizedContext += `dietary restrictions: ${userData.profile.dietaryRestrictions}, `;
      }
    }

    if (userData.workouts.length > 0) {
      hasPersonalizedData = true;
      contextDataPoints++;
      personalizedContext += `Recent workouts: `;
      userData.workouts.slice(-3).forEach(workout => {
        personalizedContext += `${workout.type} for ${workout.duration} minutes (${workout.calories} calories), `;
      });
    }

    if (userData.meals.length > 0) {
      hasPersonalizedData = true;
      contextDataPoints++;
      personalizedContext += `Recent meals: `;
      userData.meals.slice(-3).forEach(meal => {
        personalizedContext += `${meal.type} (${meal.calories} calories), `;
      });
    }

    // Prepare system message
    const systemMessage = hasPersonalizedData 
      ? `You are a personal fitness coach with access to the user's real fitness data. Use this information to provide personalized advice: ${personalizedContext.trim()}`
      : `You are a helpful fitness coach. The user doesn't have profile data yet, so provide general fitness advice and encourage them to set up their profile for personalized recommendations.`;

    console.log('💬 Sending to OpenAI with', hasPersonalizedData ? 'personalized' : 'general', 'context');
    console.log('📊 Data summary:', `Profile ${userData.profile ? '✓' : '✗'} | ${userData.workouts.length} workouts | ${userData.meals.length} meals`);

    // Call OpenAI with personalized context
    const messages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...chatHistory.slice(-10), // Include recent chat history
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    console.log('✅ Enhanced chatbot response generated successfully');

    return NextResponse.json({
      success: true,
      message: responseMessage,
      hasPersonalizedData,
      contextDataPoints,
      userData: hasPersonalizedData ? {
        hasProfile: !!userData.profile,
        workoutCount: userData.workouts.length,
        mealCount: userData.meals.length
      } : null
    });

  } catch (error) {
    console.error('❌ Enhanced chatbot error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
} 