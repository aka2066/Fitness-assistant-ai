import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new (Pinecone as any)({
  apiKey: process.env.PINECONE_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, type, content, metadata } = await request.json();
    
    if (!userId || !type || !content) {
      return NextResponse.json(
        { error: 'userId, type, and content are required' },
        { status: 400 }
      );
    }

    console.log('Creating embedding for:', { userId, type, content: content.substring(0, 100) + '...' });

    // Step 1: Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Step 2: Store in Pinecone
    const vectorId = uuidv4();
    const index = pinecone.index('fitness-assistant');

    const vectorData = {
      id: vectorId,
      values: embedding,
      metadata: {
        userId,
        type,
        content,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    await index.namespace(userId).upsert([vectorData]);

    console.log('Successfully stored embedding:', vectorId);

    return NextResponse.json({
      success: true,
      vectorId,
      embeddingLength: embedding.length,
      namespace: userId,
    });
    
  } catch (error) {
    console.error('Error in embeddings API:', error);
    return NextResponse.json(
      { error: 'Failed to create embedding' },
      { status: 500 }
    );
  }
} 