import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'sk-proj8hVgyhiQFcBoaJU9nhxnD4lbHcNCAHM5IBg6rrkxsmd3QUds9KifKRPnN3u5V1d2KfSr0bf2BNT3BlbkFJmWAsU9EW0zpXWZCo5W8Up1ZtSiP5aXj307B9QnUOUrQR6JdX_MusgNH5LXLpMJ16Pzh_V7XYA',
});

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();
    
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // For development, we'll provide a mock response with fitness advice
    // In production, this would implement the full RAG pipeline
    console.log('Chat request:', { message, userId });

    // Mock fitness coach responses based on common queries
    let response = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      response = `Great question about workouts! Based on general fitness principles, I recommend:

• Start with 3-4 workout sessions per week
• Include both cardio (20-30 minutes) and strength training
• Focus on compound movements like squats, deadlifts, and push-ups
• Always warm up before and cool down after workouts
• Listen to your body and rest when needed

For personalized recommendations, make sure to log your workouts so I can analyze your patterns and suggest improvements!`;
    } else if (lowerMessage.includes('meal') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      response = `Nutrition is crucial for your fitness goals! Here are some general guidelines:

• Eat protein with every meal (aim for 0.8-1g per kg body weight)
• Include plenty of vegetables and fruits
• Stay hydrated (8-10 glasses of water daily)
• Time your meals around workouts (protein + carbs post-workout)
• Avoid processed foods when possible

Log your meals regularly so I can provide more specific advice based on your eating patterns and goals!`;
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
      response = `Setting clear fitness goals is the first step to success! Here's how to create an effective plan:

• Define specific, measurable goals (e.g., "lose 10 pounds in 3 months")
• Start gradually and build consistency
• Combine cardio and strength training
• Track your progress regularly
• Be patient and celebrate small wins

Update your profile with your specific goals so I can provide more targeted advice for your fitness journey!`;
    } else {
      response = `Thanks for your question! As your AI fitness coach, I'm here to help with:

• Workout recommendations and planning
• Nutrition advice and meal suggestions
• Goal setting and progress tracking
• Exercise form and safety tips

To give you the most personalized advice, make sure to:
1. Complete your profile with your fitness goals
2. Log your workouts and meals regularly
3. Ask specific questions about your fitness journey

What specific aspect of fitness would you like help with today?`;
    }

    return NextResponse.json({
      response,
      context: 0, // Mock context count
    });
    
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 