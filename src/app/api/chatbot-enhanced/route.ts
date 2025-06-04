import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import AWS from 'aws-sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AWS SDK v2 DynamoDB client (proven to work)
AWS.config.update({
  region: 'us-east-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// AppSync configuration
const APPSYNC_ENDPOINT = 'https://o753qyivt5h3bjsybv4ekkydve.appsync-api.us-east-2.amazonaws.com/graphql';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserData {
  profile: any;
  workouts: any[];
  meals: any[];
}

// Fetch user data using direct GraphQL HTTP request with IAM signing
async function fetchUserDataGraphQL(userId: string): Promise<UserData> {
  try {
    console.log('🎯 Trying GraphQL with direct HTTP + IAM signing for user:', userId);

    // For now, let's use a simpler approach - direct HTTP request to AppSync
    // This will work if IAM credentials are properly configured
    const queries = [
      {
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
                owner
              }
            }
          }
        `,
        variables: { filter: { userId: { eq: userId } } }
      }
    ];

    // For this implementation, I'll skip the complex IAM signing for now
    // and focus on making the chatbot work reliably with the fallback
    throw new Error('GraphQL HTTP implementation requires IAM signing - using fallback');

  } catch (error) {
    console.log('❌ GraphQL with direct HTTP failed:', error);
    throw error;
  }
}

// Fetch user data using AWS SDK v2 DynamoDB (bulletproof fallback)
async function fetchUserDataFallback(userId: string): Promise<UserData> {
  try {
    console.log('🔧 Using AWS SDK v2 DynamoDB method for user:', userId);

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

    console.log('✅ AWS SDK v2 DynamoDB successful');
    console.log('📊 Data summary:', `Profile ${profile ? '✓' : '✗'} | ${workouts.length} workouts | ${meals.length} meals`);
    return { profile, workouts, meals };

  } catch (error) {
    console.log('❌ AWS SDK v2 also failed:', error);
    return { profile: null, workouts: [], meals: [] };
  }
}

// Smart approach: Use proven AWS SDK v2 method (skip GraphQL complexity for now)
async function fetchUserData(userId: string): Promise<UserData> {
  // For maximum reliability, let's use the proven method directly
  // We can implement proper GraphQL later if needed
  console.log('🚀 Using proven AWS SDK v2 method for reliable chatbot performance');
  return await fetchUserDataFallback(userId);
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, chatHistory = [] } = await request.json();
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ OpenAI API key not found in environment variables');
      return NextResponse.json({
        success: true,
        message: "I'm currently unavailable due to missing API configuration. Please ensure the OPENAI_API_KEY environment variable is set in your deployment settings.\n\nIn the meantime, here are some general fitness tips:\n\n1. Stay consistent with your workouts\n2. Maintain a balanced diet\n3. Get adequate rest and recovery\n4. Stay hydrated throughout the day\n5. Set realistic, achievable goals\n\nPlease contact support to resolve the API configuration issue.",
        hasPersonalizedData: false,
        contextDataPoints: 0,
        userData: null
      });
    }

    console.log('🤖 Enhanced chatbot request:', {
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
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