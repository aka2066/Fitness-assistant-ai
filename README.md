# 🏋️ AI-Powered Fitness & Nutrition Assistant

Full-stack RAG-enabled fitness coach built with Next.js, AWS Amplify Gen 2, and Pinecone vector database.

## 🗺️ Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI   │    │   AWS Amplify    │    │    Pinecone     │
│                 │    │                  │    │                 │
│ • Profile Form  │◄──►│ • Cognito Auth   │    │ • User Vectors  │
│ • Workout Log   │    │ • DynamoDB       │◄──►│ • RAG Queries   │
│ • Meal Log      │    │ • Lambda APIs    │    │ • Embeddings    │
│ • AI Chat       │    │ • GraphQL        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │    OpenAI API    │
                       │                  │
                       │ • Embeddings     │
                       │ • Chat GPT       │
                       │ • RAG Responses  │
                       └──────────────────┘

RAG Flow: User Input → Embedding → Pinecone Search → Context Retrieval → AI Response
```

## 📐 Pinecone Index Design

### Index Configuration
```yaml
Index Name: fitness-assistant
Dimensions: 1536 (OpenAI text-embedding-ada-002)
Metric: cosine
Environment: Serverless (AWS us-east-2)
```

### Namespace Strategy
```
User Isolation: namespace = userId
Vector IDs: {userId}-{type}-{uuid}
```

### Metadata Schema
```javascript
// Profile Vector
{
  userId: "user-123",
  type: "profile", 
  content: "User profile: John, 25 years old, 5'10\", 165 lbs...",
  timestamp: "2024-01-15T10:30:00Z",
  name: "John Doe",
  age: 25,
  fitnessGoals: "Build muscle and lose fat"
}

// Workout Vector  
{
  userId: "user-123",
  type: "workout",
  content: "User workout: Strength Training - 45 min, 350 cal...",
  timestamp: "2024-01-15T08:00:00Z", 
  workoutType: "Strength Training",
  duration: 45,
  calories: 350
}

// Meal Vector
{
  userId: "user-123", 
  type: "meal",
  content: "User meal: Grilled chicken with rice - 650 calories...",
  timestamp: "2024-01-15T12:00:00Z",
  mealType: "Lunch", 
  calories: 650,
  foods: "Grilled chicken, brown rice, vegetables"
}
```

## 🔧 AWS Amplify Gen 2 Configuration

### Backend Categories
```typescript
// amplify/backend.ts
export const backend = defineBackend({
  auth,           // Cognito User Pool + Identity Pool
  data,           // DynamoDB + GraphQL API  
  embeddingsFunction,  // OpenAI + Pinecone integration
  chatbotFunction     // RAG-powered AI chat
});
```

### Authentication
```typescript
// amplify/auth/resource.ts
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: { required: true },
  },
});
```

### Data Schema
```graphql
# amplify/data/resource.ts
type UserProfile @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  userId: String! @index(name: "byUserId")
  name: String
  age: Int
  heightFeet: Int
  heightInches: Int  
  weight: Float
  fitnessGoals: String
  activityLevel: String
  dietaryRestrictions: String
}

type WorkoutLog @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  userId: String! @index(name: "byUserId") 
  type: String!
  duration: Int
  calories: Int
  notes: String
  exercises: String
  date: String!
}

type MealLog @model @auth(rules: [{ allow: owner }]) {
  id: ID!
  userId: String! @index(name: "byUserId")
  type: String!
  calories: Int
  notes: String  
  foods: String
  date: String!
}
```

### Lambda Functions
```typescript
// amplify/functions/embeddings/resource.ts
export const embeddingsFunction = defineFunction({
  name: 'embeddings',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY,
    PINECONE_INDEX_NAME: 'fitness-assistant',
  },
});
```

## 🧪 Local Development & Deployment

### Prerequisites
```bash
# Required tools
node --version  # 18+
npm --version   # 9+

# Required accounts & keys
AWS Account (Free Tier)
OpenAI API Key: sk-proj8hVgyhiQFcBoaJU9nhxnD4lbHcNCAHM5IBg6rrkxsmd3QUds9KifKRPnN3u5V1d2KfSr0bf2BNT3BlbkFJmWAsU9EW0zpXWZCo5W8Up1ZtSiP5aXj307B9QnUOUrQR6JdX_MusgNH5LXLpMJ16Pzh_V7XYA
Pinecone API Key (Free Tier)
```

### Environment Setup
```bash
# 1. Clone repository
git clone https://github.com/aka2066/Fitness-assistant-ai.git
cd Fitness-assistant-ai

# 2. Install dependencies  
npm install

# 3. Configure environment variables
touch .env.local
echo "OPENAI_API_KEY=sk-proj8hVgyhiQFcBoaJU9nhxnD4lbHcNCAHM5IBg6rrkxsmd3QUds9KifKRPnN3u5V1d2KfSr0bf2BNT3BlbkFJmWAsU9EW0zpXWZCo5W8Up1ZtSiP5aXj307B9QnUOUrQR6JdX_MusgNH5LXLpMJ16Pzh_V7XYA" >> .env.local
echo "PINECONE_API_KEY=your_pinecone_key_here" >> .env.local
```

### Run Locally (Mock Backend)
```bash
# Start Amplify sandbox (creates local DynamoDB + Lambda)
npx ampx sandbox

# In separate terminal - start Next.js frontend  
npm run dev

# Access application
open http://localhost:3000
```

### Deploy to AWS
```bash
# Deploy to AWS Amplify
npx ampx sandbox --outputs-version 1

# Or deploy production environment
npx ampx pipeline deploy --branch main
```

### Test RAG System
```bash
# Test backend endpoints
curl -X POST http://localhost:3000/api/test-pinecone \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}'

# Run test suite
npm test
```

## ✅ Verification Checklist

- [ ] ✅ User can create profile → Profile embedded in Pinecone
- [ ] ✅ User can log workouts → Workout embedded in Pinecone  
- [ ] ✅ User can log meals → Meal embedded in Pinecone
- [ ] ✅ AI chat retrieves personal context from Pinecone
- [ ] ✅ RAG responses reference user's actual data
- [ ] ✅ Progress analytics show real metrics
- [ ] ✅ All data isolated by user namespace
- [ ] ✅ Authentication protects all routes
- [ ] ✅ Tests pass for components and Lambda functions

**🎯 Assessment Complete: Full-stack RAG-powered fitness assistant with personalized AI coaching!** 