import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { chatbotFunction } from './functions/chatbot/resource';
import { embeddingsFunction } from './functions/embeddings/resource';

defineBackend({
  auth,
  data,
  chatbotFunction,
  embeddingsFunction,
});

// Add environment variables to the hosting environment
defineBackend({
  auth,
  data,
  chatbotFunction,
  embeddingsFunction,
}).addOutput({
  custom: {
    OPENAI_API_KEY: chatbotFunction.environment.OPENAI_API_KEY,
    PINECONE_API_KEY: chatbotFunction.environment.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: chatbotFunction.environment.PINECONE_INDEX_NAME,
  }
});

// This is to check the backend configuration
