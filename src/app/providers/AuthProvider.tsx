'use client';

import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Using the Authenticator component from AWS Amplify UI React
  // This component handles authentication automatically based on the Amplify configuration
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div>
          {user ? (
            // Show the application when user is authenticated
            <div>
              {children}
            </div>
          ) : (
            // This should not be reached as Authenticator will show the login UI automatically
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              fontSize: '18px' 
            }}>
              Please sign in to access the Fitness Assistant.
            </div>
          )}
        </div>
      )}
    </Authenticator>
  );
}