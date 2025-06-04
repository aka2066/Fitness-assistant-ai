import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);
const client = generateClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserData {
  profile: any;
  workouts: any[];
  meals: any[];
}

// Fetch user data using GraphQL (works in production)
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    console.log('🔍 Fetching user data for chatbot:', userId);

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

    console.log('📊 Fetched user data:', {
      profile: profile ? `Found profile for ${profile.name}, age ${profile.age}` : 'No profile',
      workouts: `${workouts.length} workouts`,
      meals: `${meals.length} meals`
    });

    return { profile, workouts, meals };

  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    return { profile: null, workouts: [], meals: [] };
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

    // Fetch user's real data from DynamoDB
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