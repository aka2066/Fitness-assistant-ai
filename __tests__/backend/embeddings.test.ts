/**
 * @jest-environment node
 */

import { handler } from '../../amplify/functions/embeddings/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: new Array(1536).fill(0.1) }]
        })
      }
    }))
  };
});

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      namespace: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ upsertedCount: 1 })
      })
    })
  }))
}));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234')
}));

describe('Embeddings Lambda Function', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    body: JSON.stringify({
      userId: 'test-user-123',
      type: 'workout',
      content: 'Completed 30 minutes of cardio exercise',
      metadata: {
        duration: 30,
        calories: 250,
        workoutType: 'Cardio'
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.PINECONE_INDEX = 'test-index';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for missing required fields', async () => {
    const eventMissingFields = {
      ...mockEvent,
      body: JSON.stringify({ userId: 'test-user' }) // missing type and content
    };

    const result = await handler(eventMissingFields as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });

  it('should successfully create embeddings', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('success', true);
    expect(responseBody).toHaveProperty('vectorId');
    expect(responseBody).toHaveProperty('embeddingLength', 1536);
  });

  it('should handle different content types', async () => {
    const mealEvent = {
      ...mockEvent,
      body: JSON.stringify({
        userId: 'test-user-123',
        type: 'meal',
        content: 'Had grilled chicken with vegetables for lunch',
        metadata: {
          calories: 450,
          mealType: 'Lunch'
        }
      })
    };

    const result = await handler(mealEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('success', true);
  });

  it('should handle profile type content', async () => {
    const profileEvent = {
      ...mockEvent,
      body: JSON.stringify({
        userId: 'test-user-123',
        type: 'profile',
        content: 'User profile: 25 years old, 175cm tall, 70kg. Goal: Build muscle.',
        metadata: {
          age: 25,
          height: 175,
          weight: 70,
          fitnessGoals: 'Build muscle'
        }
      })
    };

    const result = await handler(profileEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('success', true);
  });

  it('should include CORS headers', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    expect(result.headers).toHaveProperty('Access-Control-Allow-Headers', 'Content-Type');
    expect(result.headers).toHaveProperty('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
}); 