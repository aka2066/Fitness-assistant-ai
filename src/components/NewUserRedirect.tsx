'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/providers/AuthProvider';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export default function NewUserRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (!user?.userId) return;

      try {
        const listQuery = `
          query ListUserProfiles($filter: ModelUserProfileFilterInput) {
            listUserProfiles(filter: $filter) {
              items {
                id
                userId
              }
            }
          }
        `;
        
        const result: any = await client.graphql({
          query: listQuery,
          variables: {
            filter: {
              userId: {
                eq: user.userId
              }
            }
          }
        });

        const profiles = result.data?.listUserProfiles?.items || [];
        
        // If no profile exists, redirect to profile page
        if (profiles.length === 0) {
          console.log('🔄 New user detected, redirecting to profile...');
          router.push('/profile');
        }
      } catch (error) {
        console.error('Error checking user profile:', error);
      }
    };

    // Only check after a short delay to ensure the user is fully authenticated
    const timer = setTimeout(checkProfileAndRedirect, 1000);
    return () => clearTimeout(timer);
  }, [user, router]);

  return null; // This component doesn't render anything
} 