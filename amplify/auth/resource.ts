import { defineAuth } from '@aws-amplify/backend';

// Define the authentication configuration for the Amplify backend
// Simplified configuration with only supported properties
export const auth = defineAuth({
  loginWith: {
    email: true
  }
});