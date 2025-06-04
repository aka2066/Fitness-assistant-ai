import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import AWS from 'aws-sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-2',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserData {
  profile: any;
  workouts: any[];
  meals: any[];
}

// Fetch user data directly from DynamoDB using AWS SDK
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    console.log('🔍 Fetching user data for chatbot:', userId);

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
    workouts.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    meals.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

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

// Generate context string from user data
function generateContext(userData: UserData): string {
  const { profile, workouts, meals } = userData;
  
  let context = '';

  // Profile context
  if (profile) {
    context += `USER PROFILE:\n`;
    context += `- Name: ${profile.name}\n`;
    if (profile.age) context += `- Age: ${profile.age} years old\n`;
    if (profile.heightFeet && profile.heightInches) {
      context += `- Height: ${profile.heightFeet}'${profile.heightInches}"\n`;
    }
    if (profile.weight) context += `- Weight: ${profile.weight} lbs\n`;
    if (profile.fitnessGoals) context += `- Fitness Goals: ${profile.fitnessGoals}\n`;
    if (profile.activityLevel) context += `- Activity Level: ${profile.activityLevel}\n`;
    if (profile.dietaryRestrictions) context += `- Dietary Restrictions: ${profile.dietaryRestrictions}\n`;
    context += `\n`;
  }

  // Recent workouts context
  if (workouts.length > 0) {
    context += `RECENT WORKOUTS (${workouts.length}):\n`;
    workouts.slice(0, 5).forEach((workout: any, index: number) => {
      const date = new Date(workout.date || workout.createdAt).toLocaleDateString();
      context += `${index + 1}. ${workout.type} workout on ${date}`;
      if (workout.duration) context += ` - ${workout.duration} minutes`;
      if (workout.calories) context += ` - ${workout.calories} calories burned`;
      if (workout.exercises) {
        try {
          const exercises = JSON.parse(workout.exercises);
          if (Array.isArray(exercises) && exercises.length > 0) {
            const exerciseList = exercises.map((ex: any) => 
              `${ex.name || ex.exercise}${ex.sets ? ` (${ex.sets}x${ex.reps})` : ''}`
            ).join(', ');
            context += ` - Exercises: ${exerciseList}`;
          }
        } catch (e) {
          // If not valid JSON, include as text
          context += ` - ${workout.exercises}`;
        }
      }
      if (workout.notes) context += ` - Notes: ${workout.notes}`;
      context += `\n`;
    });
    context += `\n`;
  }

  // Recent meals context
  if (meals.length > 0) {
    context += `RECENT MEALS (${meals.length}):\n`;
    meals.slice(0, 5).forEach((meal: any, index: number) => {
      const date = new Date(meal.date || meal.createdAt).toLocaleDateString();
      context += `${index + 1}. ${meal.type} on ${date}`;
      if (meal.calories) context += ` - ${meal.calories} calories`;
      if (meal.foods) {
        try {
          const foods = JSON.parse(meal.foods);
          if (Array.isArray(foods) && foods.length > 0) {
            const foodList = foods.map((food: any) => food.name || food.food).join(', ');
            context += ` - Foods: ${foodList}`;
          }
        } catch (e) {
          // If not valid JSON, include as text
          context += ` - ${meal.foods}`;
        }
      }
      if (meal.notes) context += ` - Notes: ${meal.notes}`;
      context += `\n`;
    });
  }

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory = [], userId } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required for personalized responses'
      }, { status: 400 });
    }

    console.log('🤖 Enhanced chatbot request:', { message, userId, historyLength: chatHistory.length });

    // Fetch user data from DynamoDB
    const userData = await fetchUserData(userId);
    const hasData = userData.profile || userData.workouts.length > 0 || userData.meals.length > 0;
    
    // Generate context from user data
    const contextData = generateContext(userData);

    // Create system prompt with context
    const systemPrompt = `You are a knowledgeable fitness and nutrition assistant specialized in providing personalized advice. Your goal is to provide helpful, accurate, and personalized recommendations based on the user's actual data.

${hasData ? `IMPORTANT - USER'S ACTUAL DATA:
${contextData}

Based on this real data, provide personalized advice that references their specific profile, workouts, and meals. Be specific about their progress, patterns, and areas for improvement.` : 'The user hasn\'t logged any data yet. Provide general fitness advice and encourage them to start logging their workouts, meals, and profile information for more personalized recommendations.'}

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable advice based on their actual data
- Reference their specific workouts, meals, goals, and progress when relevant
- Suggest improvements based on their current patterns
- Ask clarifying questions when needed
- Always prioritize safety and recommend consulting healthcare professionals for medical concerns
- Keep responses conversational, friendly, and motivating
- If they ask about data they haven't logged yet, encourage them to start tracking it`;

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log(`💬 Sending to OpenAI with ${hasData ? 'personalized' : 'general'} context`);
    console.log(`📊 Data summary: ${userData.profile ? 'Profile ✓' : 'Profile ✗'} | ${userData.workouts.length} workouts | ${userData.meals.length} meals`);

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 600,
      temperature: 0.7,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at the moment.';

    console.log('✅ Enhanced chatbot response generated successfully');

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      hasPersonalizedData: hasData,
      dataSource: 'DynamoDB_Direct',
      dataSummary: {
        profile: !!userData.profile,
        workouts: userData.workouts.length,
        meals: userData.meals.length
      }
    });

  } catch (error) {
    console.error('❌ Enhanced chatbot error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again later.'
      },
      { status: 500 }
    );
  }
} 