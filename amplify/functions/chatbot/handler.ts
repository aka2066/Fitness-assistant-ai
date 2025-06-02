import { APIGatewayProxyHandler } from 'aws-lambda';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new (Pinecone as any)({
  apiKey: process.env.PINECONE_API_KEY!,
});

interface RetrievedContext {
  id: string;
  type: 'workout' | 'meal' | 'profile';
  content: string;
  metadata: any;
  score: number;
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
    const { message, userId } = JSON.parse(event.body || '{}');

    if (!message || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message and userId are required' }),
      };
    }

    // Step 1: Generate embedding for user's message
    const messageEmbedding = await generateEmbedding(message);

    // Step 2: Retrieve relevant context from Pinecone
    const retrievedContext = await retrieveContext(userId, messageEmbedding);

    // Step 3: Build augmented prompt with retrieved context
    const augmentedPrompt = buildAugmentedPrompt(message, retrievedContext, userId);

    // Step 4: Generate response using OpenAI
    const response = await generateResponse(augmentedPrompt);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        response,
        context: retrievedContext,
        contextUsed: retrievedContext.length > 0
      }),
    };
  } catch (error) {
    console.error('Chatbot error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  return response.data[0].embedding;
}

async function retrieveContext(
  userId: string,
  queryEmbedding: number[]
): Promise<RetrievedContext[]> {
  try {
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    
    const queryResult = await index.namespace(userId).query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      includeValues: false,
    });

    return queryResult.matches?.map(match => ({
      id: match.id,
      type: match.metadata?.type as 'workout' | 'meal' | 'profile',
      content: match.metadata?.content as string,
      metadata: match.metadata,
      score: match.score || 0,
    })) || [];
  } catch (error) {
    console.error('Error retrieving from Pinecone:', error);
    return [];
  }
}

function buildAugmentedPrompt(
  originalMessage: string,
  context: RetrievedContext[],
  userId: string
): string {
  let prompt = `You are an AI fitness and nutrition coach. Help the user with their request based on their past activities and data.

User ID: ${userId}

Relevant Past Activities and Data:
`;
  
  if (context.length > 0) {
    context.forEach((item, index) => {
      prompt += `${index + 1}. ${item.type.toUpperCase()}: ${item.content}\n`;
      if (item.metadata?.date) {
        prompt += `   Date: ${item.metadata.date}\n`;
      }
      if (item.metadata?.calories) {
        prompt += `   Calories: ${item.metadata.calories}\n`;
      }
      if (item.metadata?.duration) {
        prompt += `   Duration: ${item.metadata.duration} minutes\n`;
      }
      prompt += `   Relevance Score: ${(item.score * 100).toFixed(1)}%\n\n`;
    });
  } else {
    prompt += 'No past activities found for this user yet. Provide general fitness and nutrition advice.';
  }

  prompt += `\nUser Question: ${originalMessage}

Please provide a personalized, helpful response based on the user's past activities when available. Be specific and actionable in your recommendations. Reference their past activities when relevant. If no past activities are available, provide general but helpful fitness and nutrition advice.`;

  return prompt;
}

async function generateResponse(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a knowledgeable and encouraging fitness and nutrition coach. Provide personalized, actionable advice based on the user\'s activity history when available. Be conversational and supportive.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return completion.choices[0].message.content || 'I apologize, but I could not generate a response at this time.';
} 