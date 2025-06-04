import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Pinecone connection...');
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Test 1: List indexes
    const indexes = await pinecone.listIndexes();
    console.log('📊 Available Pinecone indexes:', indexes);

    let indexStats = null;
    try {
      // Test 2: Try to access the fitness-assistant index if it exists
      const index = pinecone.index('fitness-assistant');
      
      // Test 3: Get index stats
      indexStats = await index.describeIndexStats();
      console.log('📈 Fitness-assistant index stats:', indexStats);
    } catch (indexError) {
      console.log('ℹ️ fitness-assistant index not found or inaccessible');
    }

    return NextResponse.json({
      success: true,
      message: 'Pinecone connection successful!',
      indexes: indexes,
      indexStats: indexStats,
      indexName: 'fitness-assistant',
      hasApiKey: !!process.env.PINECONE_API_KEY
    });

  } catch (error) {
    console.error('❌ Pinecone connection error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Pinecone connection failed'
    }, { status: 500 });
  }
} 