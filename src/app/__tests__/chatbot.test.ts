import { handler } from '../../amplify/functions/chatbot/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'This is a test response from OpenAI about fitness advice.'
            }
          }]
        })
      }
    }
  }));
});

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      namespace: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue({
          matches: [
            {
              metadata: {
                type: 'workout',
                notes: 'Did 30 minutes of cardio',
                date: '2024-01-01',
                calories: 300
              }
            }
          ]
        })
      })
    })
  }))
}));

describe('Chatbot Lambda Handler', () => {
  const mockEvent: APIGatewayProxyEvent = {
    body: JSON.stringify({
      message: 'What should I eat after my workout?',
      userId: 'test-user-123'
    }),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/chatbot',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  };

  beforeEach(() => {
    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.PINECONE_INDEX = 'test-index';
  });

  it('should return a properly formatted response', async () => {
    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    });

    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('response');
    expect(body).toHaveProperty('context');
    expect(typeof body.response).toBe('string');
    expect(typeof body.context).toBe('number');
  });

  it('should handle missing message parameter', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({ userId: 'test-user-123' })
    };

    const result = await handler(invalidEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Message and userId are required');
  });

  it('should handle missing userId parameter', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({ message: 'Test message' })
    };

    const result = await handler(invalidEvent);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Message and userId are required');
  });

  it('should handle malformed JSON in request body', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: 'invalid json'
    };

    const result = await handler(invalidEvent);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal server error');
  });

  it('should include CORS headers in error responses', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({})
    };

    const result = await handler(invalidEvent);

    expect(result.headers).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    });
  });
}); 