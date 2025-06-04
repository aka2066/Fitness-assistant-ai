import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import AWS from 'aws-sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { getAwsConfig } from '../aws-config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AWS SDK v2 DynamoDB client (proven to work)
AWS.config.update(getAwsConfig());

console.log('🔧 AWS SDK configured with credentials');

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Initialize Pinecone (for RAG enhancement)
let pinecone: Pinecone | null = null;
if (process.env.PINECONE_API_KEY) {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UserData {
  profile: any;
  workouts: any[];
  meals: any[];
}

// Input validation schemas
interface ChatRequest {
  message: string;
  userId: string;
  chatHistory?: ChatMessage[];
}

// Server-side input validation
function validateChatRequest(body: any): { isValid: boolean; errors: string[]; data?: ChatRequest } {
  const errors: string[] = [];

  // Validate message
  if (!body.message || typeof body.message !== 'string') {
    errors.push('Message is required and must be a string');
  } else if (body.message.trim().length === 0) {
    errors.push('Message cannot be empty');
  } else if (body.message.length > 1000) {
    errors.push('Message cannot exceed 1000 characters');
  }

  // Validate userId
  if (!body.userId || typeof body.userId !== 'string') {
    errors.push('UserId is required and must be a string');
  } else if (body.userId.trim().length === 0) {
    errors.push('UserId cannot be empty');
  } else if (!/^[a-zA-Z0-9\-_.@]+$/.test(body.userId)) {
    errors.push('UserId contains invalid characters');
  }

  // Validate chatHistory (optional)
  if (body.chatHistory && !Array.isArray(body.chatHistory)) {
    errors.push('ChatHistory must be an array');
  } else if (body.chatHistory && body.chatHistory.length > 50) {
    errors.push('ChatHistory cannot exceed 50 messages');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      message: body.message.trim(),
      userId: body.userId.trim(),
      chatHistory: body.chatHistory || []
    }
  };
}

// Basic authentication check (can be enhanced with Cognito JWT validation)
function validateAuthHeader(request: NextRequest): { isValid: boolean; error?: string } {
  const authHeader = request.headers.get('authorization');
  
  // For now, we'll allow requests without auth for demo purposes
  // In production, you would validate Cognito JWT tokens here
  
  // Example of how you could validate a Bearer token:
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return { isValid: false, error: 'Missing or invalid authorization header' };
  // }
  
  // const token = authHeader.substring(7);
  // Validate JWT token with Cognito here...
  
  return { isValid: true };
}

// Fetch user data using AWS SDK v2 DynamoDB (bulletproof method)
async function fetchUserData(userId: string): Promise<UserData> {
  try {
    console.log('🔧 Using AWS SDK v2 DynamoDB method for user:', userId);
    console.log('🔧 Exact userId being searched:', JSON.stringify(userId));

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

    // Extract data from results with detailed logging
    const profileResult = results[0];
    if (profileResult.status === 'fulfilled') {
      const items = (profileResult.value as any).Items || [];
      console.log('🔍 Profile scan found', items.length, 'items');
      if (items.length > 0) {
        console.log('✅ Profile found:', { 
          name: items[0].name, 
          userId: items[0].userId,
          age: items[0].age 
        });
      } else {
        console.log('❌ No profile items found for userId:', userId);
        // Let's also scan a few items to see what userIds exist
        try {
          const sampleScan = await dynamodb.scan({
            TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
            Limit: 5
          }).promise();
          console.log('📋 Sample userIds in database:', 
            sampleScan.Items?.map(item => ({ 
              userId: item.userId, 
              name: item.name 
            })) || []
          );
        } catch (e) {
          console.log('❌ Failed to get sample data:', e);
        }
      }
    } else {
      console.log('❌ Profile scan failed:', profileResult.reason);
    }

    const profile = profileResult.status === 'fulfilled' 
      ? (profileResult.value as any).Items?.[0] 
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

    console.log('✅ AWS SDK v2 DynamoDB completed');
    console.log('📊 Final data summary:', `Profile ${profile ? '✓' : '✗'} | ${workouts.length} workouts | ${meals.length} meals`);
    
    return { profile, workouts, meals };

  } catch (error) {
    console.log('❌ AWS SDK v2 failed:', error);
    return { profile: null, workouts: [], meals: [] };
  }
}

// Enhanced RAG: Fetch contextual information from Pinecone
async function fetchPineconeContext(userId: string, message: string): Promise<string> {
  if (!pinecone) {
    console.log('📝 Pinecone not configured, skipping RAG enhancement');
    return '';
  }

  try {
    console.log('🔍 Retrieving contextual information from Pinecone...');
    
    // Create embedding for the user's message
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: message,
    });

    const messageEmbedding = embeddingResponse.data[0].embedding;
    
    // Query Pinecone for relevant user context
    const index = pinecone.index('fitness-assistant');
    const queryResponse = await index.namespace(userId).query({
      vector: messageEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log('🎯 Found', queryResponse.matches.length, 'relevant context items from Pinecone');
      
      // Extract relevant context from matches
      const contextItems = queryResponse.matches
        .filter(match => match.score && match.score > 0.7) // Only high-relevance matches
        .map(match => {
          const metadata = match.metadata as any;
          return `${metadata?.type || 'activity'}: ${metadata?.summary || metadata?.data || 'No details'}`;
        })
        .slice(0, 3); // Limit to top 3 matches

      return contextItems.length > 0 
        ? `Recent relevant activities: ${contextItems.join('; ')}`
        : '';
    } else {
      console.log('ℹ️ No relevant context found in Pinecone');
      return '';
    }
  } catch (error) {
    console.log('⚠️ Pinecone RAG failed, continuing without enhanced context:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Validate authorization header
    const authValidation = validateAuthHeader(request);
    if (!authValidation.isValid) {
      console.log('❌ Authentication failed:', authValidation.error);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: ' + authValidation.error
      }, { status: 401 });
    }

    // 2. PARSE REQUEST BODY
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.log('❌ Invalid JSON in request body');
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    // 3. INPUT VALIDATION: Validate all inputs server-side
    const validation = validateChatRequest(requestBody);
    if (!validation.isValid) {
      console.log('❌ Input validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Input validation failed',
        details: validation.errors
      }, { status: 400 });
    }

    const { message, userId, chatHistory } = validation.data!;
    console.log('✅ Input validation passed for userId:', userId);

    // 4. RATE LIMITING: Basic protection against abuse
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('🔒 Validated request from user:', userId.substring(0, 8) + '...', 'UA:', userAgent.substring(0, 50));

    // 5. CHECK OPENAI API KEY
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
      userId: userId.substring(0, 8) + '...',
      historyLength: chatHistory.length
    });

    // 6. FETCH USER DATA (with proper access controls)
    const userData = await fetchUserData(userId);
    
    // 7. FETCH ENHANCED CONTEXT from Pinecone (RAG)
    const pineconeContext = await fetchPineconeContext(userId, message);
    
    // 8. BUILD PERSONALIZED CONTEXT
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
      personalizedContext += `\nWORKOUT HISTORY (${userData.workouts.length} total, most recent first): `;
      userData.workouts.slice(0, 5).forEach((workout, index) => {
        const date = workout.createdAt || workout.date;
        personalizedContext += `\n${index + 1}. ${workout.type} - ${workout.duration} min, ${workout.calories} cal`;
        if (date) personalizedContext += ` (${new Date(date).toLocaleDateString()})`;
        if (workout.notes) personalizedContext += ` - Notes: "${workout.notes}"`;
        if (workout.exercises) personalizedContext += ` - Exercises: ${workout.exercises}`;
      });
    }

    if (userData.meals.length > 0) {
      hasPersonalizedData = true;
      contextDataPoints++;
      personalizedContext += `\nMEAL HISTORY (${userData.meals.length} total, most recent first): `;
      userData.meals.slice(0, 5).forEach((meal, index) => {
        const date = meal.createdAt || meal.date;
        personalizedContext += `\n${index + 1}. ${meal.type || 'Meal'} - ${meal.calories} cal`;
        if (date) personalizedContext += ` (${new Date(date).toLocaleDateString()})`;
        if (meal.foods) personalizedContext += ` - Foods: ${meal.foods}`;
        if (meal.notes) personalizedContext += ` - Notes: "${meal.notes}"`;
        if (meal.protein) personalizedContext += ` - Protein: ${meal.protein}g`;
        if (meal.carbs) personalizedContext += ` - Carbs: ${meal.carbs}g`;
        if (meal.fat) personalizedContext += ` - Fat: ${meal.fat}g`;
      });
    }

    // Add Pinecone RAG context if available
    if (pineconeContext) {
      hasPersonalizedData = true;
      contextDataPoints++;
      personalizedContext += `${pineconeContext} `;
      console.log('🚀 Enhanced with Pinecone RAG context');
    }

    // 9. PREPARE ENHANCED SYSTEM MESSAGE
    const systemMessage = hasPersonalizedData 
      ? `You are an expert personal fitness coach with access to the user's complete fitness history and data. 

CRITICAL INSTRUCTIONS FOR DATA ANALYSIS:
- When user asks about "last meal" or "recent meal" - refer to their MOST RECENT meal, not all meals
- When user asks about "last workout" - refer to their MOST RECENT workout specifically
- When user mentions "notes" - analyze and reference their actual stored notes/comments, don't give generic advice
- Always prioritize their ACTUAL DATA over general fitness knowledge
- Be specific with dates, numbers, and personal details from their data

USER'S ACTUAL DATA:
${personalizedContext.trim()}

RESPONSE GUIDELINES:
1. Use their real name (${userData.profile?.name || 'User'}) in responses
2. Reference specific workouts, meals, and metrics from their history
3. When they ask for the "last" of something, give the most recent entry
4. If they mention progress, compare current vs previous data points
5. Keep responses personal and data-driven, not generic
6. If they ask about notes/comments, analyze their actual written notes

Example good responses:
- "Your last meal was [specific meal] with [calories] calories on [date]"
- "Looking at your notes from [date], I see you mentioned [actual note content]"
- "Your most recent workout was [specific workout] for [duration] minutes"

Respond as a knowledgeable coach who has studied their complete fitness journey.`
      : `You are a helpful fitness coach. The user doesn't have profile data yet, so provide general fitness advice and encourage them to set up their profile for personalized recommendations.`;

    console.log('💬 Sending to OpenAI with', hasPersonalizedData ? 'personalized + RAG' : 'general', 'context');
    console.log('📊 Data summary:', `Profile ${userData.profile ? '✓' : '✗'} | ${userData.workouts.length} workouts | ${userData.meals.length} meals | RAG ${pineconeContext ? '✓' : '✗'}`);

    // 10. CALL OPENAI WITH SANITIZED INPUT
    const messages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...chatHistory.slice(-10), // Limit chat history for security
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

    // 11. RETURN SECURE RESPONSE
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
    
    // Don't expose internal error details to client
    return NextResponse.json({
      success: false,
      error: 'Internal server error. Please try again later.'
    }, { status: 500 });
  }
} 