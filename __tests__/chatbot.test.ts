import { handler } from '../amplify/functions/chatbot/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'This is a mock AI response' } }]
          })
        }
      }
    }))
  };
});

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => {
  const mockIndex = {
    namespace: jest.fn().mockReturnValue({
      query: jest.fn().mockResolvedValue({
        matches: [
          {
            id: 'workout_1',
            score: 0.9,
            metadata: {
              type: 'workout',
              notes: 'Strength training focused on upper body',
              date: '2025-05-25T14:30:00Z',
              calories: 350
            }
          },
          {
            id: 'meal_1',
            score: 0.85,
            metadata: {
              type: 'meal',
              notes: 'Protein rich post-workout meal',
              date: '2025-05-25T16:00:00Z',
              calories: 600
            }
          }
        ]
      })
    })
  };
  
  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnValue(mockIndex)
    }))
  };
});

describe('Chatbot Lambda Function Handler', () => {
  // Set environment variables for the test
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { 
      ...originalEnv,
      OPENAI_API_KEY: 'test-openai-key',
      PINECONE_API_KEY: 'test-pinecone-key',
      PINECONE_INDEX: 'fitness-assistant'
    };
  });
  
  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('processes user message and returns an AI recommendation with context', async () => {
    // Create mock event
    const mockEvent = {
      body: JSON.stringify({
        message: 'What should I eat after my workout?',
        userId: 'test-user-123'
      })
    } as APIGatewayProxyEvent;
    
    // Call the handler
    const result = await handler(mockEvent);
    
    // Assert response structure
    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual(expect.objectContaining({
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }));
    
    // Parse response body
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('response');
    expect(responseBody).toHaveProperty('context');
    expect(responseBody.response).toBe('This is a mock AI response');
  });
  
  it('returns error when required fields are missing', async () => {
    // Create mock event with missing fields
    const mockEvent = {
      body: JSON.stringify({
        message: 'What should I eat after my workout?'
        // Missing userId
      })
    } as APIGatewayProxyEvent;
    
    // Call the handler
    const result = await handler(mockEvent);
    
    // Assert response is an error
    expect(result.statusCode).toBe(400);
    
    // Parse response body
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('required');
  });
});
