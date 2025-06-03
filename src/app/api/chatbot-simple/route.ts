import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import OpenAI from 'openai';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify for server-side use
Amplify.configure(outputs, { ssr: true });

const client = generateClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Agent types for routing
type AgentType = 'workout' | 'nutrition' | 'progress' | 'general';

// Determine which agent should handle the message
function determineAgent(message: string): AgentType {
  const text = message.toLowerCase();
  
  if (text.includes('workout') || text.includes('exercise') || text.includes('training') || text.includes('gym')) {
    return 'workout';
  } else if (text.includes('nutrition') || text.includes('meal') || text.includes('diet') || text.includes('food') || text.includes('eat')) {
    return 'nutrition';
  } else if (text.includes('progress') || text.includes('goal') || text.includes('achievement') || text.includes('track')) {
    return 'progress';
  }
  
  return 'general';
}

// Fetch user data from DynamoDB
async function fetchUserData(userId: string) {
  try {
    console.log('🔍 Fetching user data for:', userId);

    // Try to fetch user profile without auth mode first
    const profileResult: any = await client.graphql({
      query: `
        query ListUserProfiles($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter) {
            items {
              id 
              userId 
              age
              createdAt 
              updatedAt
            }
          }
        }
      `,
      variables: {
        filter: { userId: { eq: userId } }
      }
    });

    const profile = profileResult.data?.listUserProfiles?.items?.[0];

    console.log('📊 Raw profile data:', profile);
    console.log('📊 Fetched data:', {
      profile: profile ? `Found REAL profile for user ${userId}, age: ${profile.age}, ID: ${profile.id}` : 'No profile found in database',
      profileData: profile || 'None'
    });

    // Return actual data if found, otherwise indicate no data
    if (profile && profile.age) {
      return { 
        profile: {
          name: 'User',
          age: profile.age,
          fitnessGoals: 'General fitness and health',
          activityLevel: 'Moderate',
          userId: profile.userId,
          dataSource: 'REAL_DATABASE'
        }, 
        workouts: [], 
        meals: [] 
      };
    } else {
      console.log('❌ No real profile data found - using fallback');
      return { 
        profile: { 
          name: 'User', 
          age: null, 
          fitnessGoals: 'General fitness',
          activityLevel: 'Moderate',
          dataSource: 'FALLBACK_DATA'
        }, 
        workouts: [], 
        meals: [] 
      };
    }
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    // Return empty data instead of failing completely
    return { 
      profile: { 
        name: 'User', 
        age: null, 
        fitnessGoals: 'General fitness',
        activityLevel: 'Moderate',
        dataSource: 'ERROR_FALLBACK'
      }, 
      workouts: [], 
      meals: [] 
    };
  }
}

// Workout agent
async function workoutAgent(message: string, userData: any): Promise<string> {
  const { profile, workouts } = userData;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Age: ${profile.age}, Goals: ${profile.fitnessGoals}, Activity Level: ${profile.activityLevel}` : 'No profile data available'}

Recent Workouts:
${workouts.slice(0, 5).map((w: any) => `- ${w.exercise}: ${w.sets}x${w.reps} @ ${w.weight}lbs (${w.date})`).join('\n') || 'No recent workouts logged'}

User Question: ${message}

As a specialized workout coach, provide detailed, personalized workout recommendations based on their profile and recent activities.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a specialized workout and exercise planning agent. Focus on workout routines, exercise form, progression, and training strategies. Be specific and actionable.'
      },
      { role: 'user', content: context }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Unable to generate workout recommendation.';
}

// Nutrition agent
async function nutritionAgent(message: string, userData: any): Promise<string> {
  const { profile, meals } = userData;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Weight: ${profile.weight}lbs, Goals: ${profile.fitnessGoals}, Dietary Restrictions: ${profile.dietaryRestrictions || 'None specified'}` : 'No profile data available'}

Recent Meals:
${meals.slice(0, 5).map((m: any) => `- ${m.food}: ${m.calories} cal, ${m.protein}g protein (${m.meal}, ${m.date})`).join('\n') || 'No recent meals logged'}

User Question: ${message}

As a specialized nutrition coach, provide detailed dietary recommendations based on their profile and eating patterns.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a specialized nutrition and meal planning agent. Focus on diet, nutrition, meal planning, and dietary strategies. Be specific and actionable.'
      },
      { role: 'user', content: context }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Unable to generate nutrition recommendation.';
}

// Progress agent
async function progressAgent(message: string, userData: any): Promise<string> {
  const { profile, workouts, meals } = userData;
  
  // Calculate analytics
  const workoutCount = workouts.length;
  const avgCalories = meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0) / Math.max(meals.length, 1);
  const recentWeight = workouts
    .filter((w: any) => w.weight)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Goals: ${profile.fitnessGoals}` : 'No profile data available'}

Progress Analytics:
- Total Workouts Logged: ${workoutCount}
- Average Daily Calories: ${Math.round(avgCalories)}
- Most Recent Lifting Weight: ${recentWeight || 'N/A'}lbs
- Profile Weight: ${profile?.weight || 'N/A'}lbs

Recent Activity Summary:
Workouts: ${workouts.slice(0, 3).map((w: any) => `${w.exercise} on ${w.date}`).join(', ') || 'No recent workouts'}
Meals: ${meals.slice(0, 3).map((m: any) => `${m.food} (${m.calories} cal)`).join(', ') || 'No recent meals'}

User Question: ${message}

As a progress tracking specialist, analyze their data and provide insights about their fitness journey.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a specialized progress tracking and analytics agent. Focus on analyzing fitness data, tracking improvements, and providing motivational insights.'
      },
      { role: 'user', content: context }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Unable to generate progress analysis.';
}

// General agent
async function generalAgent(message: string, userData: any): Promise<string> {
  const { profile } = userData;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Age: ${profile.age}, Goals: ${profile.fitnessGoals}` : 'No profile data available'}
User Question: ${message}

Provide helpful general fitness advice and guidance.
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a general fitness coach. Provide helpful advice on fitness, health, and wellness topics. Be encouraging and informative.'
      },
      { role: 'user', content: context }
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Unable to generate fitness advice.';
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Simple response without OpenAI for testing
    const simpleResponses = [
      "That's a great question about fitness! I'm here to help you with your health and wellness journey.",
      "Based on general fitness principles, I'd recommend staying consistent with your routine and gradually increasing intensity.",
      "Nutrition and exercise go hand in hand. Make sure you're getting adequate protein and staying hydrated!",
      "Remember that rest and recovery are just as important as your workout routine. Listen to your body.",
      "Setting realistic, achievable goals is key to long-term fitness success. What specific goals are you working toward?"
    ];

    const randomResponse = simpleResponses[Math.floor(Math.random() * simpleResponses.length)];

    return NextResponse.json({ 
      response: randomResponse,
      timestamp: new Date().toISOString(),
      mode: 'simple'
    });

  } catch (error) {
    console.error('Simple chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
} 