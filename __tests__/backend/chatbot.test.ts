/**
 * @jest-environment node
 */

import { handler } from '../../amplify/functions/chatbot/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');

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
            choices: [{ message: { content: 'Mock AI response' } }]
          })
        }
      }
    }))
  };
});

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      namespace: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue({
          matches: [
            {
              id: 'test-id',
              score: 0.95,
              metadata: {
                type: 'workout',
                content: 'Test workout content',
                date: '2024-01-01'
              }
            }
          ]
        })
      })
    })
  }))
}));

describe('Chatbot Lambda Function', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      message: 'What workout should I do today?',
      userId: 'test-user-123'
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  beforeEach(() => {
    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.PINECONE_INDEX = 'test-index';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for missing message', async () => {
    const eventWithoutMessage = {
      ...mockEvent,
      body: JSON.stringify({ userId: 'test-user' })
    };

    const result = await handler(eventWithoutMessage as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  it('should return 400 for missing userId', async () => {
    const eventWithoutUserId = {
      ...mockEvent,
      body: JSON.stringify({ message: 'test message' })
    };

    const result = await handler(eventWithoutUserId as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  it('should successfully process chat request', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('response');
    expect(responseBody).toHaveProperty('context');
    expect(responseBody.response).toBe('Mock AI response');
  });

  it('should handle malformed JSON', async () => {
    const malformedEvent = {
      ...mockEvent,
      body: 'invalid json'
    };

    const result = await handler(malformedEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  it('should include CORS headers', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(result.headers).toHaveProperty('Access-Control-Allow-Headers', 'Content-Type');
    expect(result.headers).toHaveProperty('Access-Control-Allow-Methods', 'POST, OPTIONS');
  });
}); 