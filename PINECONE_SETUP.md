# 🚀 Pinecone Setup Guide for RAG Implementation

## Step 1: Create Pinecone Account

1. Go to https://www.pinecone.io/
2. Sign up for a free account (no credit card required for starter plan)
3. Verify your email address

## Step 2: Create Index

1. In the Pinecone dashboard, click "Create Index"
2. Configure the index:
   - **Index name**: `fitness-assistant`
   - **Dimensions**: `1536` (for OpenAI text-embedding-ada-002)
   - **Metric**: `cosine`
   - **Pod Type**: `p1.x1` (starter tier)
   - **Replicas**: `1`
   - **Shards**: `1`

## Step 3: Get API Key

1. Go to "API Keys" section in Pinecone dashboard
2. Copy your API key (starts with `pcsk_...`)

## Step 4: Set Environment Variable

Before deploying, set your Pinecone API key:

```bash
# In your terminal
export PINECONE_API_KEY=pcsk_your_actual_api_key_here
```

Or create a `.env.local` file:
```env
PINECONE_API_KEY=pcsk_your_actual_api_key_here
OPENAI_API_KEY=sk-proj8hVgyhiQFcBoaJU9nhxnD4lbHcNCAHM5IBg6rrkxsmd3QUds9KifKRPnN3u5V1d2KfSr0bf2BNT3BlbkFJmWAsU9EW0zpXWZCo5W8Up1ZtSiP5aXj307B9QnUOUrQR6JdX_MusgNH5LXLpMJ16Pzh_V7XYA
```

## Step 5: Deploy Updated Functions

```bash
npx ampx sandbox
```

## Step 6: Test RAG System

Once deployed, your AI chat will:

1. **Generate embeddings** for user data (profile, workouts, meals)
2. **Store vectors** in Pinecone with user namespaces
3. **Retrieve relevant context** when user asks questions
4. **Provide personalized responses** based on user's actual data

## RAG Flow

```
User Question → Embedding → Pinecone Search → User Profile → 
Augmented Prompt → OpenAI GPT-4 → Personalized Response
```

## Index Structure

- **Namespaces**: Per-user isolation (namespace = userId)
- **Vector IDs**: `{userId}-{type}-{uuid}`
- **Metadata**: Type, content, date, calories, duration, etc.

## Expected Benefits

✅ **Context-aware responses**: AI knows your workout history  
✅ **Personalized advice**: Based on your actual goals and restrictions  
✅ **Progress tracking**: References your past activities  
✅ **Smart recommendations**: Builds on your existing routine  

## Troubleshooting

- **Connection issues**: Check API key format (should start with `pcsk_`)
- **Index not found**: Verify index name is exactly `fitness-assistant`
- **Dimension errors**: Ensure 1536 dimensions for OpenAI embeddings
- **Namespace issues**: Each user gets isolated data in their namespace 