import { NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import amplifyconfig from '../../../../amplify_outputs.json';

// Configure Amplify
Amplify.configure(amplifyconfig);
const client = generateClient();

export async function POST() {
  try {
    console.log('🧪 Testing profile save functionality...');

    const testUserId = 'test-real-user-' + Date.now();
    
    const createQuery = `
      mutation CreateUserProfile($input: CreateUserProfileInput!) {
        createUserProfile(input: $input) {
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
    `;

    const profileData = {
      userId: testUserId,
      name: 'Test Real User',
      age: 30,
      heightFeet: 6,
      heightInches: 2,
      weight: 180.0,
      fitnessGoals: 'Test saving to DynamoDB',
      activityLevel: 'Very active (hard exercise 6-7 days/week)',
      dietaryRestrictions: 'No restrictions',
      owner: testUserId, // Set owner for authorization
    };

    console.log('📋 Attempting to save profile:', profileData);

    // Try with identityPool auth
    const result = await client.graphql({
      query: createQuery,
      variables: {
        input: profileData
      },
      authMode: 'iam'
    }) as any;

    console.log('✅ Save result:', result);

    if (result.data?.createUserProfile) {
      return NextResponse.json({
        success: true,
        message: '🎉 Profile saved successfully to DynamoDB!',
        profile: result.data.createUserProfile,
        instructions: `Check AWS DynamoDB console for user: ${testUserId}`
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No data returned from mutation',
        result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error testing save:', error);
    
    let errorMessage = 'Unknown error';
    if (error && typeof error === 'object') {
      if ('errors' in error && Array.isArray((error as any).errors)) {
        errorMessage = (error as any).errors.map((e: any) => e.message).join(', ');
      } else if ('message' in error) {
        errorMessage = (error as any).message;
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error
    }, { status: 500 });
  }
} 