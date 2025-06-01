// src/app/amplify-config.ts
import { Amplify } from 'aws-amplify';

// Configure AWS Amplify v6 with the correct format
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_ESChqlTm',
      userPoolClientId: '33dpb2sprgmkgvmiicoq02hn0'
    }
  },
  API: {
    REST: {
      chatbot: {
        endpoint: 'https://6jdiv33lb2.execute-api.us-east-2.amazonaws.com/default/chatbot',
        region: 'us-east-2'
      },
      embeddings: {
        endpoint: 'https://u2sn8q3mfh.execute-api.us-east-2.amazonaws.com/default/embeddings',
        region: 'us-east-2'
      }
    }
  }
});

// For more verbose debugging
console.log('Amplify configured with Cognito User Pool:', {
  userPoolId: 'us-east-2_ESChqlTm',
  userPoolClientId: '33dpb2sprgmkgvmiicoq02hn0'
});