import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🧪 Testing chatbot components...');

    // Test 1: Check environment variables
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasPinecone = !!process.env.PINECONE_API_KEY;
    const openaiKeyPreview = process.env.OPENAI_API_KEY ? 
      process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 
      'Not set';
    
    console.log('🔑 Environment variables:', {
      OPENAI_API_KEY: hasOpenAI ? 'Set' : 'Missing',
      PINECONE_API_KEY: hasPinecone ? 'Set' : 'Missing'
    });

    // Test 2: Test chatbot API internally
    let chatbotTest = { working: false, error: null, response: null };
    try {
      const testResponse = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/chatbot-enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'test from internal test',
          userId: 'test-internal-user'
        })
      });
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        chatbotTest = {
          working: true,
          error: null,
          response: data.message ? data.message.substring(0, 100) + '...' : 'No message'
        };
      } else {
        chatbotTest = {
          working: false,
          error: `HTTP ${testResponse.status}`,
          response: null
        };
      }
    } catch (error: any) {
      chatbotTest = {
        working: false,
        error: error.message,
        response: null
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasOpenAI,
        hasPinecone,
        openaiKeyPreview
      },
      chatbotTest,
      status: chatbotTest.working ? 'ALL_SYSTEMS_GO' : 'ISSUES_DETECTED',
      message: chatbotTest.working ? 
        'Chatbot is working correctly with all components functional' :
        'Chatbot has issues - check the details above'
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'TEST_FAILED',
      error: error.message
    }, { status: 500 });
  }
} 