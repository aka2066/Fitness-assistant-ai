import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, we'll mock the embedding creation until we have the Lambda deployed
    // In production, this would call the Lambda function
    const mockResponse = {
      success: true,
      vectorId: `${body.userId}-${body.type}-${Date.now()}`,
      embeddingLength: 1536,
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error in embeddings API:', error);
    return NextResponse.json(
      { error: 'Failed to create embedding' },
      { status: 500 }
    );
  }
} 