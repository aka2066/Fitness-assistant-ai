import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, type, data, operation = 'upsert' } = await request.json();

    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is not set');
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    if (!userId || !type || !data) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: userId, type, data'
      }, { status: 400 });
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Get or create the fitness-assistant index
    let index;
    try {
      const indexes = await pinecone.listIndexes();
      const existingIndex = indexes.indexes?.find(idx => idx.name === 'fitness-assistant');
      
      if (!existingIndex) {
        console.log('Creating fitness-assistant index...');
        await pinecone.createIndex({
          name: 'fitness-assistant',
          dimension: 1536, // OpenAI ada-002 embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-2'
            }
          }
        });
        
        // Wait for index to be ready
        console.log('Waiting for index to be ready...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      index = pinecone.index('fitness-assistant');
    } catch (error) {
      console.error('Error setting up index:', error);
      throw error;
    }

    if (operation === 'upsert') {
      // Create text content for embedding
      let textContent = '';
      if (type === 'workout') {
        textContent = `User workout: ${data.exercise} - ${data.sets} sets, ${data.reps} reps, ${data.weight}lbs on ${data.date}. Duration: ${data.duration} minutes. Notes: ${data.notes || 'None'}`;
      } else if (type === 'meal') {
        textContent = `User meal: ${data.food} - ${data.calories} calories, ${data.protein}g protein, ${data.carbs}g carbs, ${data.fat}g fat on ${data.date}. Notes: ${data.notes || 'None'}`;
      } else if (type === 'profile') {
        // Generate descriptive text for profile embedding
        const details = [];
        if (data.name) details.push(`Name: ${data.name}`);
        if (data.age) details.push(`${data.age} years old`);
        if (data.height) details.push(`height ${data.height}`);
        if (data.weight) details.push(`weight ${data.weight} lbs`);
        if (data.activityLevel) details.push(`activity level: ${data.activityLevel}`);
        if (data.fitnessGoals) details.push(`fitness goals: ${data.fitnessGoals}`);
        if (data.dietaryRestrictions) details.push(`dietary restrictions: ${data.dietaryRestrictions}`);
        
        textContent = `User profile: ${details.join(', ')}`;
      }

      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: textContent,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Create vector for upsert
      const vector = {
        id: `${userId}-${type}-${data.id || Date.now()}`,
        values: embedding,
        metadata: {
          userId,
          type,
          text: textContent,
          timestamp: new Date().toISOString(),
          ...data
        }
      };

      // Upsert to Pinecone
      await index.upsert([vector]);

      console.log(`✅ Embedded and stored ${type} data for user ${userId}`);

      return NextResponse.json({
        success: true,
        message: `${type} data embedded and stored successfully`,
        vectorId: vector.id
      });

    } else if (operation === 'query') {
      // Query operation for RAG
      const { query, topK = 5 } = data;

      // Generate embedding for query
      const queryEmbeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: query,
      });

      const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

      // Query Pinecone
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK,
        filter: { userId },
        includeValues: false,
        includeMetadata: true
      });

      console.log(`🔍 Found ${queryResponse.matches?.length || 0} relevant results for user ${userId}`);

      return NextResponse.json({
        success: true,
        matches: queryResponse.matches,
        message: `Found ${queryResponse.matches?.length || 0} relevant results`
      });
    }

  } catch (error) {
    console.error('❌ Embeddings API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Embeddings operation failed'
    }, { status: 500 });
  }
} 