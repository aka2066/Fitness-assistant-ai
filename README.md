# 🏋️ AI-Powered Fitness & Nutrition Assistant

Full-stack RAG-enabled fitness coach built with Next.js, AWS Amplify Gen 2, and Pinecone vector database.

## 🗺️ Detailed Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                🌐 FRONTEND (Next.js 14)                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Profile   │  │  Workouts   │  │    Meals    │  │   AI Chat   │  │ Analytics   │ │
│  │    Page     │  │    Page     │  │    Page     │  │    Page     │  │    Page     │ │
│  │             │  │             │  │             │  │             │  │             │ │
│  │ • Form      │  │ • Log Form  │  │ • Log Form  │  │ • Chat UI   │  │ • Charts    │ │
│  │ • Save      │  │ • History   │  │ • History   │  │ • History   │  │ • Metrics   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│           │               │               │               │               │           │
│           └───────────────┼───────────────┼───────────────┼───────────────┘           │
│                          │               │               │                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                    🔐 AUTH PROVIDER (AWS Cognito Client)                        │ │
│  │  • JWT Token Management  • Route Protection  • User Context                    │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                           │
└─────────────────────────────────────────┼───────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │            📡 HTTPS/GraphQL              │
                    │                     │                     │
┌───────────────────▼─────────────────────▼─────────────────────▼───────────────────┐
│                           ☁️ AWS AMPLIFY GEN 2 BACKEND                            │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                          🔐 AUTHENTICATION LAYER                            │  │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │  │
│  │  │   Cognito       │    │   Identity      │    │      IAM        │        │  │
│  │  │   User Pool     │    │     Pool        │    │     Roles       │        │  │
│  │  │                 │    │                 │    │                 │        │  │
│  │  │ • Sign Up       │◄──►│ • AWS Creds    │◄──►│ • API Access    │        │  │
│  │  │ • Sign In       │    │ • Federation    │    │ • DB Access     │        │  │
│  │  │ • JWT Tokens    │    │ • Temp Creds    │    │ • Lambda Exec   │        │  │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘        │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                            📊 API LAYER (AppSync)                           │  │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │  │
│  │  │    GraphQL      │    │   REST API      │    │   Resolvers     │        │  │
│  │  │   Endpoint      │    │   Gateway       │    │                 │        │  │
│  │  │                 │    │                 │    │                 │        │  │
│  │  │ • Mutations     │    │ • /api/chat     │    │ • DynamoDB      │        │  │
│  │  │ • Queries       │    │ • /api/embed    │    │ • Lambda        │        │  │
│  │  │ • Subscriptions │    │ • /api/test     │    │ • Auth Rules    │        │  │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘        │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                          ⚡ LAMBDA FUNCTIONS                                │  │
│  │                                                                             │  │
│  │  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │  │
│  │  │        🤖 CHATBOT FUNCTION      │  │      📝 EMBEDDINGS FUNCTION     │   │  │
│  │  │                                 │  │                                 │   │  │
│  │  │ Input: User message + history   │  │ Input: User data (profile/logs) │   │  │
│  │  │                                 │  │                                 │   │  │
│  │  │ 1. Validate request             │  │ 1. Validate data                │   │  │
│  │  │ 2. Create query embedding       │  │ 2. Generate text content        │   │  │
│  │  │ 3. Search Pinecone vectors      │  │ 3. Create OpenAI embedding      │   │  │
│  │  │ 4. Fetch DynamoDB data          │  │ 4. Store in Pinecone            │   │  │
│  │  │ 5. Build context prompt         │  │ 5. Return success status        │   │  │
│  │  │ 6. Call OpenAI Chat API         │  │                                 │   │  │
│  │  │ 7. Return AI response           │  │ Environment:                    │   │  │
│  │  │                                 │  │ • OPENAI_API_KEY               │   │  │
│  │  │ Environment:                    │  │ • PINECONE_API_KEY             │   │  │
│  │  │ • OPENAI_API_KEY               │  │ • PINECONE_INDEX_NAME          │   │  │
│  │  │ • PINECONE_API_KEY             │  │                                 │   │  │
│  │  │ • PINECONE_INDEX_NAME          │  │                                 │   │  │
│  │  └─────────────────────────────────┘  └─────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                           🗄️ DATABASE LAYER                                 │  │
│  │                                                                             │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │  │
│  │  │  UserProfile    │  │  WorkoutLog     │  │   MealLog       │              │  │
│  │  │     Table       │  │     Table       │  │    Table        │              │  │
│  │  │                 │  │                 │  │                 │              │  │
│  │  │ PK: id          │  │ PK: id          │  │ PK: id          │              │  │
│  │  │ GSI: userId     │  │ GSI: userId     │  │ GSI: userId     │              │  │
│  │  │                 │  │                 │  │                 │              │  │
│  │  │ • name          │  │ • type          │  │ • type          │              │  │
│  │  │ • age           │  │ • duration      │  │ • calories      │              │  │
│  │  │ • height        │  │ • calories      │  │ • foods         │              │  │
│  │  │ • weight        │  │ • notes         │  │ • notes         │              │  │
│  │  │ • goals         │  │ • exercises     │  │ • date          │              │  │
│  │  │ • restrictions  │  │ • date          │  │ • owner         │              │  │
│  │  │ • owner         │  │ • owner         │  │                 │              │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘              │  │
│  │                                                                             │  │
│  │  Authorization: @auth(rules: [{ allow: owner }])                           │  │
│  │  Indexes: @index(name: "byUserId", fields: ["userId"])                     │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                     ▼                    ▼                    ▼
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│     🤖 OpenAI API       │  │    🌲 Pinecone VectorDB │  │   📊 External APIs     │
│                         │  │                         │  │                         │
│ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │
│ │   Chat Completion   │ │  │ │  fitness-assistant  │ │  │ │   Future Integrations│ │
│ │                     │ │  │ │      Index          │ │  │ │                     │ │
│ │ Model: gpt-3.5-turbo│ │  │ │                     │ │  │ │ • Nutrition APIs    │ │
│ │ Max Tokens: 500     │ │  │ │ Dimensions: 1536    │ │  │ │ • Wearable Devices  │ │
│ │ Temperature: 0.7    │ │  │ │ Metric: cosine      │ │  │ │ • Health Platforms  │ │
│ │                     │ │  │ │ Pod Type: Serverless│ │  │ │                     │ │
│ └─────────────────────┘ │  │ │                     │ │  │ └─────────────────────┘ │
│                         │  │ │ Namespaces:         │ │  │                         │
│ ┌─────────────────────┐ │  │ │ • user-123          │ │  │                         │
│ │   Text Embeddings   │ │  │ │ • user-456          │ │  │                         │
│ │                     │ │  │ │ • user-789          │ │  │                         │
│ │ Model: ada-002      │ │  │ │                     │ │  │                         │
│ │ Dimensions: 1536    │ │  │ │ Vectors per user:   │ │  │                         │
│ │ Usage: RAG queries  │ │  │ │ • 1 Profile vector  │ │  │                         │
│ │ + Content embedding │ │  │ │ • N Workout vectors │ │  │                         │
│ └─────────────────────┘ │  │ │ • M Meal vectors    │ │  │                         │
└─────────────────────────┘  │ │                     │ │  └─────────────────────────┘
                             │ │ Vector Structure:   │ │
                             │ │ {                   │ │
                             │ │   id: "user-type-uuid"│ │
                             │ │   values: [1536 dims]│ │
                             │ │   metadata: {       │ │
                             │ │     userId: "..."   │ │
                             │ │     type: "..."     │ │
                             │ │     content: "..."  │ │
                             │ │     timestamp: "..." │ │
                             │ │     ...custom_data  │ │
                             │ │   }                 │ │
                             │ │ }                   │ │
                             │ └─────────────────────┘ │
                             └─────────────────────────┘

                    ┌─────────────────────────────────────────────────┐
                    │              🔄 RAG PIPELINE FLOW               │
                    └─────────────────────────────────────────────────┘

    1. User Input          2. Authentication     3. Embedding Creation
   ┌─────────────┐        ┌─────────────┐       ┌─────────────┐
   │"Suggest a   │───────►│Validate JWT │──────►│OpenAI       │
   │post-workout │        │Token &      │       │text-embedding│
   │meal"        │        │Get userId   │       │-ada-002     │
   └─────────────┘        └─────────────┘       └─────────────┘
                                                       │
                                                       ▼
    6. AI Response        5. Context Assembly   4. Vector Search
   ┌─────────────┐        ┌─────────────┐       ┌─────────────┐
   │"Based on    │◄───────│Combine:     │◄──────│Query        │
   │your last    │        │• DynamoDB   │       │Pinecone     │
   │workout..."  │        │• Pinecone   │       │Namespace    │
   └─────────────┘        │• User prompt│       │for topK=5   │
                          └─────────────┘       └─────────────┘

                    ┌─────────────────────────────────────────────────┐
                    │             💾 DATA FLOW DIAGRAM                │
                    └─────────────────────────────────────────────────┘

Profile Creation:
Frontend Form → GraphQL Mutation → DynamoDB → Embedding API → OpenAI → Pinecone

Workout/Meal Logging:
Frontend Form → GraphQL Mutation → DynamoDB → Embedding API → OpenAI → Pinecone

AI Chat Query:
Frontend Message → Lambda Function → [OpenAI + Pinecone + DynamoDB] → AI Response

Analytics Dashboard:
Frontend Load → GraphQL Query → DynamoDB → Metrics Calculation → Chart Display
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
OpenAI API Key:
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
echo "OPENAI_API_KEY=your_openai_key_here" >> .env.local
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
