import { defineFunction } from '@aws-amplify/backend';

export const embeddingsFunction = defineFunction({
  name: 'embeddings',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
    PINECONE_INDEX_NAME: 'fitness-assistant',
  },
}); 