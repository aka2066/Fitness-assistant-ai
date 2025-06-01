# 🚀 Deployment Guide - Fitness Assistant

## Prerequisites

1. **AWS Account** with sufficient permissions
2. **AWS CLI** configured with your credentials
3. **Node.js 18+** installed
4. **Pinecone Account** - Sign up at [pinecone.io](https://pinecone.io)
5. **OpenAI API Key** - Available from [OpenAI Dashboard](https://platform.openai.com/api-keys): `<YOUR_OPENAI_API_KEY>`

## Step 1: Set Up Pinecone Vector Database

1. **Create Pinecone Account** at [app.pinecone.io](https://app.pinecone.io)
2. **Create Index**:
   - Index Name: `fitness-assistant`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Pod Type: `p1.x1` (starter tier)
3. **Get API Key** from Pinecone dashboard

## Step 2: Configure AWS CLI

```bash
# Install AWS CLI (if not already installed)
pip install awscli

# Configure with your AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (e.g., us-east-1)
```

## Step 3: Deploy AWS Amplify Gen 2 Backend

```bash
# Navigate to project directory
cd fitness-assistant

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize and deploy sandbox environment for testing
npx ampx sandbox

# Wait for deployment (usually 5-10 minutes)
# This will create:
# - Cognito User Pool for authentication
# - DynamoDB tables for data storage
# - Lambda functions for AI processing
# - API Gateway endpoints
```

## Step 4: Configure Environment Variables

After deployment, update your environment variables:

### For Sandbox/Development:
Create `.env.local`:
```bash
# Replace with actual values from Amplify outputs
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/graphql

# OpenAI API Key (provided)
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX=fitness-assistant
```

### For Production Deployment:
```bash
# Deploy to production branch
npx ampx deploy --branch main

# Set environment variables in Lambda functions
aws lambda update-function-configuration \
  --function-name fitness-assistant-chatbot \
  --environment Variables='{
    "OPENAI_API_KEY":"<YOUR_OPENAI_API_KEY>",
    "PINECONE_API_KEY":"your_pinecone_api_key",
    "PINECONE_INDEX":"fitness-assistant"
  }'

aws lambda update-function-configuration \
  --function-name fitness-assistant-embeddings \
  --environment Variables='{
    "OPENAI_API_KEY":"<YOUR_OPENAI_API_KEY>",
    "PINECONE_API_KEY":"your_pinecone_api_key",
    "PINECONE_INDEX":"fitness-assistant"
  }'
```

## Step 5: Update Amplify Configuration

After deployment, Amplify will generate `amplify_outputs.json`. Update your configuration:

```typescript
// src/app/amplify-config.ts
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);
```

## Step 6: Deploy Frontend

### Option A: AWS Amplify Hosting
```bash
# Connect to Amplify Hosting
npx ampx deploy --branch main

# This will deploy both backend and frontend
```

### Option B: Vercel (Alternative)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
```

### Option C: Manual Build and Deploy
```bash
# Build the application
npm run build

# The build output will be in .next/
# Deploy to your preferred hosting platform
```

## Step 7: Testing the Deployment

1. **Visit your deployed URL**
2. **Create a test account** using the Cognito authentication
3. **Test each feature**:
   - Profile creation and editing
   - Workout logging
   - Meal logging
   - AI chat functionality

## Step 8: Monitoring and Logs

### Check Lambda Logs:
```bash
# View chatbot function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/fitness-assistant-chatbot"

# View embeddings function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/fitness-assistant-embeddings"
```

### Monitor Pinecone Usage:
- Check your Pinecone dashboard for vector count and usage

### Monitor DynamoDB:
- Check AWS Console > DynamoDB for table metrics

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure API Gateway has proper CORS configuration
   - Check that your domain is allowed in the CORS policy

2. **Authentication Errors**:
   - Verify Cognito User Pool configuration
   - Check that the frontend is using correct User Pool ID and Client ID

3. **Lambda Function Errors**:
   - Check CloudWatch logs for detailed error messages
   - Verify environment variables are set correctly

4. **Pinecone Connection Issues**:
   - Verify API key is correct
   - Ensure index name matches exactly
   - Check Pinecone dashboard for service status

5. **OpenAI API Errors**:
   - Verify API key is valid and has sufficient credits
   - Check rate limiting if getting 429 errors

### Useful Commands:

```bash
# Check Amplify status
npx ampx status

# View resources
npx ampx list

# Remove sandbox (if needed)
npx ampx sandbox delete

# View logs
npx ampx logs --function chatbot
npx ampx logs --function embeddings
```

## Security Considerations

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Enable CloudTrail** for audit logging
4. **Set up IAM roles** with least privilege principle
5. **Enable DynamoDB encryption** at rest
6. **Configure VPC** if additional network security is needed

## Cost Optimization

1. **Use DynamoDB On-Demand** billing for variable workloads
2. **Set up CloudWatch alarms** for cost monitoring
3. **Use Pinecone starter tier** for development
4. **Monitor OpenAI API usage** and set billing alerts

## Production Checklist

- [ ] AWS Amplify Gen 2 backend deployed
- [ ] Pinecone index created and configured
- [ ] All environment variables set
- [ ] Frontend deployed and accessible
- [ ] Authentication working (sign up/login)
- [ ] Profile creation and editing functional
- [ ] Workout logging working
- [ ] Meal logging working
- [ ] AI chat responding correctly
- [ ] All tests passing
- [ ] Monitoring and logging configured
- [ ] Security best practices implemented

---

**Deployment Complete! 🎉**

Your AI-Powered Fitness Assistant is now live and ready to help users with personalized fitness and nutrition recommendations. 