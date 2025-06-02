import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: 'sk-proj8hVgyhiQFcBoaJU9nhxnD4lbHcNCAHM5IBg6rrkxsmd3QUds9KifKRPnN3u5V1d2KfSr0bf2BNT3BlbkFJmWAsU9EW0zpXWZCo5W8Up1ZtSiP5aXj307B9QnUOUrQR6JdX_MusgNH5LXLpMJ16Pzh_V7XYA',
});

const pinecone = new Pinecone({
  apiKey: 'pcsk_2YeBCc_3BgnVr2ENQbJJmDws13s55b3ZvKYywHgoZ2bR1ygu3Bnd1LV1km5x9t4pBkfMNb',
});

interface RetrievedContext {
  id: string;
  type: 'workout' | 'meal' | 'profile';
  content: string;
  metadata: any;
  score: number;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();
    
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    console.log('Chat request:', { message, userId });

    // Step 1: Generate embedding for user's message
    const messageEmbedding = await generateEmbedding(message);

    // Step 2: Retrieve relevant context from Pinecone
    const retrievedContext = await retrieveContext(userId, messageEmbedding);

    // Step 3: Build augmented prompt with retrieved context
    const augmentedPrompt = buildAugmentedPrompt(message, retrievedContext, userId);

    // Step 4: Generate response using OpenAI
    const response = await generateResponse(augmentedPrompt);

    return NextResponse.json({
      response,
      context: retrievedContext.length,
      contextUsed: retrievedContext.length > 0,
      retrievedData: retrievedContext, // For debugging
    });
    
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const index = pinecone.index('fitness-assistant');
    
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
    // Return empty context if Pinecone fails - still provide basic response
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