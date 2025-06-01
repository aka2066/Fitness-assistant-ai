import { APIGatewayProxyHandler } from 'aws-lambda';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface EmbeddingRequest {
  userId: string;
  type: 'profile' | 'workout' | 'meal';
  content: string;
  metadata: Record<string, any>;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { userId, type, content, metadata }: EmbeddingRequest = JSON.parse(
      event.body || '{}'
    );

    if (!userId || !type || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'userId, type, and content are required',
        }),
      };
    }

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Prepare metadata for Pinecone
    const pineconeMetadata = {
      type,
      content,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Store in Pinecone with user namespace
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const vectorId = `${userId}-${type}-${uuidv4()}`;

    await index.namespace(userId).upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: pineconeMetadata,
      },
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        vectorId,
        embeddingLength: embedding.length,
        message: `Successfully stored ${type} embedding for user ${userId}`,
      }),
    };
  } catch (error) {
    console.error('Embeddings error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}; 