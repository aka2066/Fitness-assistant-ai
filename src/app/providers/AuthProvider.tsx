'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';

// Define types for the auth context
type AuthUser = {
  username: string;
  userId: string;
  signOut?: () => void;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await fetchAuthSession();
        const currentUser = await getCurrentUser();
        setUser({
          username: currentUser.username,
          userId: currentUser.userId
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
      <Authenticator>
        {({ signOut, user: authUser }) => (
          <div>
            {authUser ? (
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
    </AuthContext.Provider>
  );
}