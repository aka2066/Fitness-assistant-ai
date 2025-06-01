import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { chatbotFunction } from './functions/chatbot/resource';
import { embeddingsFunction } from './functions/embeddings/resource';

export const backend = defineBackend({
  auth,
  data,
  chatbotFunction,
  embeddingsFunction,
}); 