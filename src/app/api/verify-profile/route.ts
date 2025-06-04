import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import amplifyconfig from '../../../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplifyconfig);
const client = generateClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    console.log('🔍 Checking profiles for userId:', userId);

    // Query UserProfiles with userPool auth (like the real app)
    const listQuery = `
      query ListUserProfiles($filter: ModelUserProfileFilterInput) {
        listUserProfiles(filter: $filter) {
          items {
            id
            userId
            name
            age
            heightFeet
            heightInches
            weight
            fitnessGoals
            activityLevel
            dietaryRestrictions
            owner
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await client.graphql({
      query: listQuery,
      variables: {
        filter: {
          userId: {
            eq: userId
          }
        }
      },
      authMode: 'userPool'
    }) as any;

    console.log('✅ Query result:', result);

    return NextResponse.json({
      success: true,
      userId: userId,
      profiles: result.data?.listUserProfiles?.items || [],
      totalCount: result.data?.listUserProfiles?.items?.length || 0,
      message: `Found ${result.data?.listUserProfiles?.items?.length || 0} profiles for user ${userId}`
    });

  } catch (error) {
    console.error('❌ Error verifying profile:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 