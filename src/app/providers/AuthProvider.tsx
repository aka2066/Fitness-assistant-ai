'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

// Import and configure Amplify outputs
import outputs from '../../../amplify_outputs.json';

// Configure Amplify before anything else
Amplify.configure(outputs);

// Define types for the auth context
type AuthUser = {
  username: string;
  userId: string;
  name?: string;
  hasProfile?: boolean;
  signOut?: () => Promise<void>;
};

// Create Auth Context
const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
}>({ user: null, loading: true });

// Create useAuth hook
export function useAuth() {
  return useContext(AuthContext);
}

// Development mode flag - set to false to use real AWS Cognito authentication
const DEVELOPMENT_MODE = false;

// Inner component to handle authenticated content
function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await fetchAuthSession();
        const currentUser = await getCurrentUser();
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          signOut: async () => {
            await signOut();
            setUser(null);
          }
        });
      } catch (error) {
        console.log('No authenticated user', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (DEVELOPMENT_MODE) {
          // Mock user for development
          setUser({
            username: 'testuser',
            userId: 'dev-user-123'
          });
          setLoading(false);
          return;
        }

        await fetchAuthSession();
        const currentUser = await getCurrentUser();
        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
          signOut: async () => {
            await signOut();
            setUser(null);
          }
        });
      } catch (error) {
        console.log('No authenticated user', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  // In development mode, skip the Authenticator
  if (DEVELOPMENT_MODE) {
    return (
      <AuthContext.Provider value={{ user, loading }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <Authenticator>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Authenticator>
  );
}