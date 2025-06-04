// Test script to verify chatbot fix for users with no data
const testChatbot = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/chatbot-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "What should I do for calf growth?",
        userId: "test-user-no-data",
        chatHistory: []
      })
    });

    const data = await response.json();
    
    console.log('=== CHATBOT RESPONSE TEST ===');
    console.log('Has Personalized Data:', data.hasPersonalizedData);
    console.log('Context Data Points:', data.contextDataPoints);
    console.log('Response Message:');
    console.log(data.message);
    console.log('==============================');
    
    // Check for problematic phrases that indicate hallucination
    const problematicPhrases = [
      'your last workout',
      'your recent workout', 
      'on 08/15/2023',
      'calf raises',
      '4 sets of 15 reps',
      '50 lbs'
    ];
    
    const foundProblems = problematicPhrases.filter(phrase => 
      data.message.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (foundProblems.length > 0) {
      console.log('🚨 HALLUCINATION DETECTED!');
      console.log('Found problematic phrases:', foundProblems);
    } else {
      console.log('✅ No hallucination detected - response looks clean!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run test
testChatbot(); 