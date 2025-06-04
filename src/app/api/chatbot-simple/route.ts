import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Simple chatbot test starting...');
    
    // Parse request
    const { message, userId } = await request.json();
    
    if (!message || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing message or userId'
      }, { status: 400 });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    console.log('🤖 Calling OpenAI with simplified request...');
    
    // Simple OpenAI call without DynamoDB or Pinecone
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful fitness coach. Provide brief, encouraging responses.' 
        },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const responseMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    console.log('✅ Simple chatbot response generated successfully');

    return NextResponse.json({
      success: true,
      message: responseMessage,
      simplified: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Simple chatbot error:', error);
    
    return NextResponse.json({
      success: false,
      error: `Detailed error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown'
    }, { status: 500 });
  }
} 