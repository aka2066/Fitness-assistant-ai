// src/app/amplify-config.ts
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import outputs from '../../amplify_outputs.json';

// Configure AWS Amplify with the outputs from the deployed backend
Amplify.configure(outputs);

// Create and export API client for use in components
export const client = generateClient();

// For debugging - show the actual configuration being used
console.log('Amplify configured with backend outputs:', {
  userPoolId: outputs.auth?.user_pool_id,
  userPoolClientId: outputs.auth?.user_pool_client_id,
  region: outputs.auth?.aws_region,
  apiUrl: outputs.data?.url
});