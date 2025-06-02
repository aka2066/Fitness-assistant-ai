import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import outputs from '../../../../amplify_outputs.json';

// Configure Amplify for server-side use
Amplify.configure(outputs, { ssr: true });

const client = generateClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing DynamoDB connection...');

    // Try to scan all profiles to see what's actually in the table
    const allProfiles: any = await client.graphql({
      query: `
        query ListUserProfiles {
          listUserProfiles {
            items {
              id
              userId 
              age
              createdAt
              updatedAt
            }
          }
        }
      `
    });

    const profiles = allProfiles.data?.listUserProfiles?.items || [];
    
    console.log('📊 All profiles in database:', profiles);

    return NextResponse.json({
      success: true,
      profileCount: profiles.length,
      profiles: profiles,
      message: profiles.length > 0 ? 'Found profiles in database' : 'Database is empty'
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, age } = await request.json();
    
    console.log('🔄 Attempting to create profile for:', userId);

    // Try to create a profile with only the fields that exist
    const result: any = await client.graphql({
      query: `
        mutation CreateUserProfile($input: CreateUserProfileInput!) {
          createUserProfile(input: $input) {
            id
            userId
            age
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        input: {
          userId: userId,
          age: age
        }
      }
    });

    console.log('✅ Profile created:', result.data?.createUserProfile);

    return NextResponse.json({
      success: true,
      profile: result.data?.createUserProfile,
      message: 'Profile created successfully'
    });
    
  } catch (error) {
    console.error('❌ Profile creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
} 