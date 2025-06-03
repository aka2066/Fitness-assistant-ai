import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Pinecone connection...');
    
    const pinecone = new (Pinecone as any)({
      apiKey: process.env.PINECONE_API_KEY || 'pcsk_2YeBCc_3BgnVr2ENQbJJmDws13s55b3ZvKYywHgoZ2bR1ygu3Bnd1LV1km5x9t4pBkfMNb',
    });

    // Test 1: List indexes
    const indexes = await pinecone.listIndexes();
    console.log('📊 Available Pinecone indexes:', indexes);

    // Test 2: Try to access the fitness-assistant index
    const index = pinecone.index('fitness-assistant');
    
    // Test 3: Get index stats
    const stats = await index.describeIndexStats();
    console.log('📈 Fitness-assistant index stats:', stats);

    return NextResponse.json({
      success: true,
      message: 'Pinecone connection successful!',
      indexes: indexes,
      indexStats: stats,
      indexName: 'fitness-assistant'
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