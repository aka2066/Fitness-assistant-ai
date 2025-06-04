import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory = [], userId } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🤖 Chatbot request:', { message, userId, historyLength: chatHistory.length });

    let contextData = '';
    let contextDataPoints = 0;
    
    // If user ID is provided and Pinecone is configured, use RAG
    if (userId && process.env.PINECONE_API_KEY) {
      try {
        console.log('🔍 Retrieving user context from Pinecone...');
        
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY,
        });

        const index = pinecone.index('fitness-assistant');

        // Generate embedding for the user's message
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: message,
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // Query Pinecone for relevant user data
        const queryResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,
          filter: { userId },
          includeValues: false,
          includeMetadata: true
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
          console.log(`📊 Found ${queryResponse.matches.length} relevant data points`);
          
          contextData = queryResponse.matches
            .map((match, idx) => `${idx + 1}. ${match.metadata?.text}`)
            .join('\n');
          
          contextDataPoints = queryResponse.matches.length;
        } else {
          console.log('ℹ️ No relevant user data found in Pinecone');
        }

      } catch (ragError) {
        console.error('⚠️ RAG retrieval failed:', ragError);
        // Continue without RAG data
      }
    }

    // Create system prompt with context
    const systemPrompt = `You are a knowledgeable fitness and nutrition assistant. Your goal is to provide helpful, accurate, and personalized advice about workouts, nutrition, and health.

${contextData ? `IMPORTANT: The user has the following relevant history/data that you should reference in your response:

${contextData}

Use this information to provide personalized advice based on their actual data. Reference specific workouts, meals, or progress when relevant.` : 'The user doesn\'t have historical data available yet, so provide general but helpful fitness advice.'}

Guidelines:
- Be encouraging and supportive
- Provide specific, actionable advice
- Reference the user's actual data when available
- Ask clarifying questions when needed
- Always prioritize safety and recommend consulting healthcare professionals for medical concerns
- Keep responses conversational and friendly`;

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log(`💬 Sending to OpenAI with ${contextData ? 'personalized' : 'general'} context`);

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, but I cannot provide a response at the moment.';

    console.log('✅ Chatbot response generated successfully');

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      hasPersonalizedData: !!contextData,
      contextDataPoints: contextDataPoints
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);

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