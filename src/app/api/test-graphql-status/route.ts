import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import AWS from 'aws-sdk';

// Configure Amplify with environment-based config
Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://o753qyivt5h3bjsybv4ekkydve.appsync-api.us-east-2.amazonaws.com/graphql',
      region: 'us-east-2',
      defaultAuthMode: 'iam'
    }
  }
});

const client = generateClient();

// AWS SDK v2 setup
AWS.config.update({
  region: 'us-east-2',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

const LIST_USER_PROFILES = `
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
        createdAt
        updatedAt
        owner
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  // PREVENT RUNNING DURING BUILD/STATIC GENERATION
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_ENVIRONMENT) {
    return NextResponse.json({
      success: false,
      message: 'Test endpoint disabled during build process',
      environment: process.env.NODE_ENV,
      buildTime: new Date().toISOString()
    });
  }

  // PREVENT RUNNING IF NO PROPER CREDENTIALS
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({
      success: false,
      message: 'Test endpoint requires AWS credentials - skipping during build',
      hasCredentials: false,
      buildTime: new Date().toISOString()
    });
  }

  const testUserId = 'complete-test-user-1749011224051';
  
  console.log('🧪 GRAPHQL STATUS TEST');
  console.log('====================================');
  
  const results = {
    testUserId,
    graphqlStatus: 'unknown',
    graphqlError: null,
    graphqlData: null,
    awsSdkStatus: 'unknown', 
    awsSdkError: null,
    awsSdkData: null,
    conclusion: 'unknown'
  };

  // TEST 1: GraphQL Method
  console.log('1️⃣ Testing GraphQL method...');
  try {
    const graphqlResult: any = await client.graphql({
      query: LIST_USER_PROFILES,
      variables: {
        filter: { userId: { eq: testUserId } }
      }
    });
    
    console.log('✅ GraphQL raw response:', JSON.stringify(graphqlResult, null, 2));
    
    if (graphqlResult.data?.listUserProfiles?.items?.length > 0) {
      results.graphqlStatus = 'SUCCESS';
      results.graphqlData = graphqlResult.data.listUserProfiles.items[0];
      console.log('✅ GraphQL found profile:', (results.graphqlData as any).name);
    } else {
      results.graphqlStatus = 'NO_DATA';
      results.graphqlData = graphqlResult.data;
      console.log('⚠️ GraphQL returned no data');
    }
    
  } catch (error: any) {
    results.graphqlStatus = 'ERROR';
    results.graphqlError = error.message || 'Unknown GraphQL error';
    console.log('❌ GraphQL failed:', error.message);
  }

  // TEST 2: AWS SDK v2 Method  
  console.log('2️⃣ Testing AWS SDK v2 method...');
  try {
    const sdkResult = await dynamodb.scan({
      TableName: 'UserProfile-b7vimfsyujdibnpphmpxriv3c4-NONE',
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': testUserId
      }
    }).promise();
    
    console.log('✅ AWS SDK scan result count:', sdkResult.Items?.length || 0);
    
    if (sdkResult.Items && sdkResult.Items.length > 0) {
      results.awsSdkStatus = 'SUCCESS';
      results.awsSdkData = sdkResult.Items[0];
      console.log('✅ AWS SDK found profile:', (results.awsSdkData as any).name);
    } else {
      results.awsSdkStatus = 'NO_DATA';
      results.awsSdkData = sdkResult.Items;
      console.log('⚠️ AWS SDK returned no data');
    }
    
  } catch (error: any) {
    results.awsSdkStatus = 'ERROR';
    results.awsSdkError = error.message || 'Unknown AWS SDK error';
    console.log('❌ AWS SDK failed:', error.message);
  }

  // CONCLUSION
  console.log('3️⃣ Analysis...');
  if (results.graphqlStatus === 'SUCCESS' && results.awsSdkStatus === 'SUCCESS') {
    results.conclusion = 'BOTH_WORKING';
    console.log('🎯 CONCLUSION: Both GraphQL and AWS SDK are working');
  } else if (results.graphqlStatus === 'SUCCESS') {
    results.conclusion = 'GRAPHQL_ONLY';
    console.log('🎯 CONCLUSION: Only GraphQL is working');
  } else if (results.awsSdkStatus === 'SUCCESS') {
    results.conclusion = 'AWS_SDK_ONLY';
    console.log('🎯 CONCLUSION: Only AWS SDK is working (GraphQL failing)');
  } else {
    results.conclusion = 'BOTH_FAILING';
    console.log('🎯 CONCLUSION: Both methods are failing');
  }
  
  console.log('====================================');

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    testResults: results,
    summary: {
      graphqlWorking: results.graphqlStatus === 'SUCCESS',
      awsSdkWorking: results.awsSdkStatus === 'SUCCESS',
      chatbotDataSource: results.awsSdkStatus === 'SUCCESS' ? 'AWS SDK v2 (reliable)' : 'Unknown',
      recommendation: results.graphqlStatus === 'SUCCESS' ? 'Use GraphQL' : 'Continue using AWS SDK v2 fallback'
    }
  });
} 