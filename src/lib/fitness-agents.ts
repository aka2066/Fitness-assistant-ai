import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

// Define the state that flows between agents
interface FitnessState {
  messages: BaseMessage[];
  userProfile?: any;
  workoutData?: any[];
  mealData?: any[];
  currentIntent?: 'workout' | 'nutrition' | 'progress' | 'general';
  recommendations?: string[];
  next?: string;
  userId?: string;
}

// Initialize OpenAI chat model
const llm = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Agent for handling user profile and data retrieval
async function dataAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  
  try {
    // Extract userId from the message content or state
    const userId = state.userId || extractUserIdFromMessage(lastMessage);
    
    console.log('🔍 Data agent fetching data for user:', userId);
    
    // Fetch user profile from DynamoDB
    const profileResult: any = await client.graphql({
      query: `
        query ListUserProfiles($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter) {
            items {
              id userId name age heightFeet heightInches weight
              fitnessGoals activityLevel dietaryRestrictions
            }
          }
        }
      `,
      variables: {
        filter: { userId: { eq: userId } }
      }
    });

    // Fetch recent workouts
    const workoutResult: any = await client.graphql({
      query: `
        query ListWorkoutLogs($filter: ModelWorkoutLogFilterInput) {
          listWorkoutLogs(filter: $filter, limit: 10) {
            items {
              id userId date exercise sets reps weight duration notes
            }
          }
        }
      `,
      variables: {
        filter: { userId: { eq: userId } }
      }
    });

    // Fetch recent meals
    const mealResult: any = await client.graphql({
      query: `
        query ListMealLogs($filter: ModelMealLogFilterInput) {
          listMealLogs(filter: $filter, limit: 10) {
            items {
              id userId date meal food calories protein carbs fat notes
            }
          }
        }
      `,
      variables: {
        filter: { userId: { eq: userId } }
      }
    });

    const profile = profileResult.data?.listUserProfiles?.items?.[0];
    const workouts = workoutResult.data?.listWorkoutLogs?.items || [];
    const meals = mealResult.data?.listMealLogs?.items || [];

    console.log('📊 Data agent results:', {
      profile: profile ? `Found profile for ${profile.name}` : 'No profile found',
      workouts: `Found ${workouts.length} workouts`,
      meals: `Found ${meals.length} meals`
    });

    return {
      userProfile: profile,
      workoutData: workouts,
      mealData: meals,
      next: "coordinator"
    };
  } catch (error) {
    console.error("❌ Data agent error:", error);
    // Return empty data but continue to coordinator
    return { 
      userProfile: null,
      workoutData: [],
      mealData: [],
      next: "coordinator" 
    };
  }
}

// Coordinator agent that routes to specialized agents
async function coordinatorAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const messageText = lastMessage.content.toString().toLowerCase();
  
  // Determine intent based on message content
  let intent: 'workout' | 'nutrition' | 'progress' | 'general' = 'general';
  
  if (messageText.includes('workout') || messageText.includes('exercise') || messageText.includes('training')) {
    intent = 'workout';
  } else if (messageText.includes('nutrition') || messageText.includes('meal') || messageText.includes('diet') || messageText.includes('food')) {
    intent = 'nutrition';
  } else if (messageText.includes('progress') || messageText.includes('goal') || messageText.includes('achievement')) {
    intent = 'progress';
  }
  
  return {
    currentIntent: intent,
    next: intent === 'workout' ? 'workout_agent' : 
          intent === 'nutrition' ? 'nutrition_agent' :
          intent === 'progress' ? 'progress_agent' : 'general_agent'
  };
}

// Specialized workout planning agent
async function workoutAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const profile = state.userProfile;
  const workouts = state.workoutData || [];
  const lastMessage = state.messages[state.messages.length - 1];
  
  const context = `
User Profile: ${profile ? `${profile.name}, Age: ${profile.age}, Goals: ${profile.fitnessGoals}, Activity Level: ${profile.activityLevel}` : 'No profile data'}

Recent Workouts:
${workouts.slice(0, 5).map(w => `- ${w.exercise}: ${w.sets}x${w.reps} @ ${w.weight}lbs (${w.date})`).join('\n')}

User Question: ${lastMessage.content}

As a specialized workout coach, provide a detailed, personalized workout recommendation. Consider their recent activities, goals, and progression.
  `;

  const response = await llm.invoke([
    { role: "system", content: "You are a specialized workout and exercise planning agent. Focus exclusively on workout routines, exercise form, progression, and training strategies." },
    { role: "user", content: context }
  ]);

  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    next: END
  };
}

// Specialized nutrition planning agent
async function nutritionAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const profile = state.userProfile;
  const meals = state.mealData || [];
  const lastMessage = state.messages[state.messages.length - 1];
  
  const context = `
User Profile: ${profile ? `${profile.name}, Weight: ${profile.weight}lbs, Goals: ${profile.fitnessGoals}, Dietary Restrictions: ${profile.dietaryRestrictions}` : 'No profile data'}

Recent Meals:
${meals.slice(0, 5).map(m => `- ${m.food}: ${m.calories} cal, ${m.protein}g protein (${m.meal}, ${m.date})`).join('\n')}

User Question: ${lastMessage.content}

As a specialized nutrition coach, provide detailed dietary recommendations. Consider their recent eating patterns, goals, and restrictions.
  `;

  const response = await llm.invoke([
    { role: "system", content: "You are a specialized nutrition and meal planning agent. Focus exclusively on diet, nutrition, meal planning, and dietary strategies." },
    { role: "user", content: context }
  ]);

  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    next: END
  };
}

// Progress tracking and analytics agent
async function progressAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const profile = state.userProfile;
  const workouts = state.workoutData || [];
  const meals = state.mealData || [];
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Calculate basic analytics
  const workoutCount = workouts.length;
  const avgCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0) / Math.max(meals.length, 1);
  const recentWeight = workouts
    .filter(w => w.weight)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.weight;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Goals: ${profile.fitnessGoals}` : 'No profile data'}

Progress Analytics:
- Total Workouts Logged: ${workoutCount}
- Average Daily Calories: ${Math.round(avgCalories)}
- Most Recent Lifting Weight: ${recentWeight || 'N/A'}lbs
- Profile Weight: ${profile?.weight || 'N/A'}lbs

Recent Activity Summary:
Workouts: ${workouts.slice(0, 3).map(w => `${w.exercise} on ${w.date}`).join(', ')}
Meals: ${meals.slice(0, 3).map(m => `${m.food} (${m.calories} cal)`).join(', ')}

User Question: ${lastMessage.content}

As a progress tracking specialist, analyze their data and provide insights about their fitness journey, improvements, and areas for growth.
  `;

  const response = await llm.invoke([
    { role: "system", content: "You are a specialized progress tracking and analytics agent. Focus on analyzing fitness data, tracking improvements, identifying patterns, and providing motivational insights." },
    { role: "user", content: context }
  ]);

  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    next: END
  };
}

// General fitness agent for other queries
async function generalAgent(state: FitnessState): Promise<Partial<FitnessState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const profile = state.userProfile;
  
  const context = `
User Profile: ${profile ? `${profile.name}, Age: ${profile.age}, Goals: ${profile.fitnessGoals}` : 'No profile data'}
User Question: ${lastMessage.content}

Provide helpful general fitness advice and guidance.
  `;

  const response = await llm.invoke([
    { role: "system", content: "You are a general fitness coach. Provide helpful advice on fitness, health, and wellness topics." },
    { role: "user", content: context }
  ]);

  return {
    messages: [...state.messages, new AIMessage(response.content.toString())],
    next: END
  };
}

// Create the LangGraph workflow
export function createFitnessGraph() {
  const workflow = new StateGraph<FitnessState>({
    channels: {
      messages: { reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y) },
      userProfile: { reducer: (x: any, y: any) => y ?? x },
      workoutData: { reducer: (x: any[], y: any[]) => y ?? x },
      mealData: { reducer: (x: any[], y: any[]) => y ?? x },
      currentIntent: { reducer: (x: string, y: string) => y ?? x },
      recommendations: { reducer: (x: string[], y: string[]) => y ?? x },
      next: { reducer: (x: string, y: string) => y ?? x },
    }
  });

  // Add nodes
  workflow.addNode("data_agent", dataAgent);
  workflow.addNode("coordinator", coordinatorAgent);
  workflow.addNode("workout_agent", workoutAgent);
  workflow.addNode("nutrition_agent", nutritionAgent);
  workflow.addNode("progress_agent", progressAgent);
  workflow.addNode("general_agent", generalAgent);

  // Add edges
  workflow.addEdge(START, "data_agent");
  workflow.addEdge("data_agent", "coordinator");
  
  // Conditional routing from coordinator
  workflow.addConditionalEdges(
    "coordinator",
    (state: FitnessState) => state.next || "general_agent",
    {
      "workout_agent": "workout_agent",
      "nutrition_agent": "nutrition_agent", 
      "progress_agent": "progress_agent",
      "general_agent": "general_agent"
    }
  );

  return workflow.compile();
}

// Utility function to extract user ID from message content
function extractUserIdFromMessage(message: BaseMessage): string {
  const content = message.content.toString();
  // Look for pattern like "[USER_ID: someId]" in the message
  const match = content.match(/\[USER_ID:\s*([^\]]+)\]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Fallback - this shouldn't happen in production
  console.warn('⚠️ Could not extract user ID from message, using fallback');
  return "default-user-id";
}

// Main function to process user messages with LangGraph
export async function processWithFitnessAgents(message: string, userId: string): Promise<string> {
  console.log('🚀 Processing with LangGraph agents:', { message, userId });
  
  const graph = createFitnessGraph();
  
  // Create initial state with user message AND userId
  const initialState: FitnessState = {
    messages: [new HumanMessage(`[USER_ID: ${userId}] ${message}`)],
    userId: userId, // Explicitly pass userId in state
  };

  try {
    // Run the graph
    const result = await graph.invoke(initialState);
    
    // Return the final AI response
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content.toString();
  } catch (error) {
    console.error("❌ LangGraph processing error:", error);
    return "I encountered an error processing your request. Please try again.";
  }
} 