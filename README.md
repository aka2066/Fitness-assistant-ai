# 🏋️‍♂️ Fitness Assistant - AI-Powered Fitness & Nutrition Tracker

A comprehensive full-stack fitness application with AI-powered recommendations using RAG (Retrieval-Augmented Generation) technology, built with Next.js, AWS Amplify Gen 2, and OpenAI.

## 🎯 **Assessment Deliverables**

✅ **User Profile Page** - Age, Height, Weight, Fitness Goals with DynamoDB + Pinecone storage  
✅ **Workout & Meal Logging** - Structured data capture with embedding generation  
✅ **Ask Coach Chatbot** - RAG-powered AI recommendations  
✅ **Frontend Pages** - Responsive design with Material-UI  
✅ **AWS Amplify Gen 2** - Complete backend infrastructure  
✅ **Testing Suite** - Unit tests for React components and Lambda functions  
✅ **Security & Validation** - AWS Cognito authentication and input validation  
📹 **Loom Video Walkthrough** - ≤10 minutes demonstration (see link below)

## 🎬 **Video Demonstration**

**📹 [Loom Video Walkthrough](YOUR_LOOM_LINK_HERE)** - Complete feature demonstration including:
- User authentication and profile setup
- Workout logging with embedding generation
- Meal tracking and nutrition logging  
- AI chatbot RAG implementation in action
- Responsive design across all pages
- Backend Lambda function operations

*Note: Replace YOUR_LOOM_LINK_HERE with your actual Loom recording URL*

## 🏗️ **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Profile   │  │  Workouts   │  │    Meals    │  │ AI Chat │ │
│  │    Page     │  │   Logging   │  │   Logging   │  │Interface│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│                              │                                  │
│                    Material-UI + Responsive Design             │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   AWS Amplify Gen 2  │
                    │    (Authentication)  │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AWS Cognito │    │   API Gateway   │    │   DynamoDB      │
│(User Auth)  │    │   + Lambda      │    │                 │
└─────────────┘    │   Functions     │    │ ┌─────────────┐ │
                   │                 │    │ │UserProfile  │ │
                   │ ┌─────────────┐ │    │ │WorkoutLog   │ │
                   │ │  Chatbot    │ │    │ │MealLog      │ │
                   │ │  Function   │ │    │ │ChatHistory  │ │
                   │ └─────────────┘ │    │ └─────────────┘ │
                   │ ┌─────────────┐ │    └─────────────────┘
                   │ │Embeddings   │ │
                   │ │  Function   │ │
                   │ └─────────────┘ │
                   └─────────┬───────┘
                             │
                    ┌────────▼────────┐
                    │   OpenAI API    │
                    │                 │
                    │ • text-embedding│
                    │   -ada-002      │
                    │ • GPT-4 Chat    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Pinecone      │
                    │  Vector Store   │
                    │                 │
                    │ User Namespaces │
                    │ • Profile Vec   │
                    │ • Workout Vec   │
                    │ • Meal Vec      │
                    └─────────────────┘
```

## 📊 **Pinecone Index Design**

### Index Configuration
- **Dimension**: 1536 (OpenAI text-embedding-ada-002)
- **Metric**: Cosine similarity
- **Index Name**: `fitness-assistant`

### Namespace Strategy
- **Per-User Namespaces**: Each user has their own namespace (`user_id`)
- **Vector Isolation**: Complete data separation between users

### Metadata Schema
```json
{
  "type": "profile | workout | meal",
  "content": "Text content that was embedded",
  "userId": "User identifier",
  "timestamp": "ISO date string",
  
  // Profile specific
  "age": "number",
  "height": "number (cm)",
  "weight": "number (kg)",
  "fitnessGoals": "string",
  "activityLevel": "string",
  
  // Workout specific
  "date": "ISO date string",
  "duration": "number (minutes)",
  "calories": "number",
  "workoutType": "string",
  
  // Meal specific
  "date": "ISO date string", 
  "calories": "number",
  "mealType": "Breakfast | Lunch | Dinner | Snack"
}
```

## 💻 **Tech Stack**

### Frontend
- **Next.js 15** - React framework with SSR
- **Material-UI (MUI) 7** - Component library
- **TypeScript** - Type safety
- **Emotion** - CSS-in-JS styling

### Backend
- **AWS Amplify Gen 2** - Backend-as-a-Service
- **AWS Lambda** - Serverless functions
- **DynamoDB** - NoSQL database
- **API Gateway** - REST API endpoints
- **AWS Cognito** - Authentication & user management

### AI & Vector Storage
- **OpenAI API** - Embeddings (text-embedding-ada-002) & Chat (GPT-4)
- **Pinecone** - Vector database for RAG

### Testing
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **@testing-library/jest-dom** - DOM testing utilities

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+
- npm or yarn
- AWS Account (for deployment)
- OpenAI API Key: `<YOUR_OPENAI_API_KEY>`
- Pinecone API Key (sign up at pinecone.io)

### Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   cd fitness-assistant
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.local file
   NEXT_PUBLIC_USER_POOL_ID=your_cognito_user_pool_id
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=your_cognito_client_id
   NEXT_PUBLIC_API_URL=your_api_gateway_url
   OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=fitness-assistant
   ```

3. **Initialize Amplify (for deployment):**
   ```bash
   npx ampx sandbox
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm test
   npm run test:coverage
   ```

### Mock Development (No AWS)
For local development without AWS deployment:
```bash
npm run dev
```
The app includes mock authentication and API responses for development.

## 🧪 **Testing**

### Unit Tests
- **Profile Component**: Form validation and user interaction
- **Chat Component**: Message handling and API integration  
- **Lambda Functions**: Chatbot response generation and embedding creation

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Goals
- **Components**: >80% coverage
- **Lambda Functions**: >90% coverage
- **Critical Paths**: 100% coverage

## 🚀 **Deployment**

### AWS Amplify Gen 2 Deployment

1. **Configure AWS CLI:**
   ```bash
   aws configure
   ```

2. **Deploy backend:**
   ```bash
   npx ampx sandbox
   # or for production:
   npx ampx deploy --branch main
   ```

3. **Update frontend configuration:**
   ```bash
   # amplify_outputs.json will be generated
   # Update src/app/amplify-config.ts to use it
   ```

4. **Set up Pinecone:**
   - Create index: `fitness-assistant`
   - Dimension: 1536
   - Metric: cosine

5. **Configure Lambda environment variables:**
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`

### Environment Variables
```bash
# Production deployment
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX=fitness-assistant
```

## 🔒 **Security & Validation**

### Authentication
- **AWS Cognito** - Email/password authentication
- **Protected Routes** - All app pages require authentication
- **Session Management** - Automatic token refresh

### Input Validation
- **Frontend**: Form validation with MUI
- **Backend**: Server-side validation in Lambda functions
- **Database**: Type-safe operations with Amplify Data

### API Security
- **CORS**: Properly configured origins
- **Authentication**: JWT tokens from Cognito
- **Rate Limiting**: Built-in with API Gateway

## 🎯 **Features**

### 1. User Profile Management
- Age, height, weight, fitness goals
- Activity level and dietary restrictions
- Automatic embedding generation for personalization
- Real-time form validation

### 2. Workout Logging
- Exercise type, duration, calories
- Detailed exercise descriptions
- Automatic embedding creation for AI context
- Historical workout tracking

### 3. Meal Logging  
- Food items, calories, meal type
- Nutritional information capture
- Smart categorization (breakfast, lunch, dinner, snack)
- Dietary pattern analysis

### 4. AI Coach Chatbot
- **RAG Pattern**: Retrieves relevant user history
- **Personalized Responses**: Based on profile + past activities
- **Context-Aware**: Understands user's fitness journey
- **Natural Language**: Conversational interface

### 5. RAG Implementation
```
User Query → Embedding → Pinecone Search → DynamoDB Profile → 
Augmented Prompt → OpenAI GPT-4 → Personalized Response
```

## 📱 **Pages & Navigation**

- **Dashboard** (`/`) - Main navigation hub
- **Profile** (`/profile`) - User information management
- **Workouts** (`/workouts`) - Exercise logging and history
- **Meals** (`/meals`) - Nutrition tracking
- **Chat** (`/chat`) - AI coach interaction
- **Auth** - Automatic Cognito login/signup flow

## 📈 **Performance Optimizations**

- **SSR**: Server-side rendering with Next.js
- **Code Splitting**: Automatic route-based splitting
- **Caching**: Optimal API response caching
- **Vector Search**: Efficient similarity search with Pinecone
- **Database**: Optimized DynamoDB queries with GSI

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add AmazingFeature'`)
5. Push to branch (`git push origin feature/AmazingFeature`)
6. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🔗 **References**

- [AWS Amplify Gen 2 Documentation](https://docs.amplify.aws/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)

---

**Built with ❤️ for the Full Stack + RAG Assessment** 

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Pinecone Configuration (for future RAG implementation)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=fitness-assistant
PINECONE_ENVIRONMENT=us-east-1-aws
``` 