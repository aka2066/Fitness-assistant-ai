import { NextRequest, NextResponse } from 'next/server';
import { processWithFitnessAgents } from '@/lib/fitness-agents';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();
    
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    console.log('LangGraph chat request:', { message, userId });

    // Process the message using LangGraph multi-agent system
    const response = await processWithFitnessAgents(message, userId);

    return NextResponse.json({
      response,
      agentType: 'langgraph-multi-agent',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('LangGraph chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 