'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
  Stack,
} from '@mui/material';
import { Send as SendIcon, Person, SmartToy, Home as HomeIcon } from '@mui/icons-material';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
  isUser: boolean;
  contextUsed?: boolean;
  contextCount?: number;
  agentType?: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLangGraph, setUseLangGraph] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user profile for personalized greeting
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.userId && !userProfile) {
        try {
          console.log('🔍 Fetching profile for user:', user.userId);
          
          // Try to get the user's profile data directly
          const response = await fetch('/api/get-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('📊 Profile response:', data);
            
            if (data.success && data.profile?.name) {
              console.log('✅ Got user profile:', data.profile.name);
              setUserProfile({ 
                name: data.profile.name,
                age: data.profile.age,
                fitnessGoals: data.profile.fitnessGoals,
                activityLevel: data.profile.activityLevel
              });
              return;
            }
          }
          
          // Fallback to username if profile fetch fails
          if (user.username) {
            console.log('🔄 Using username as fallback:', user.username);
            setUserProfile({ name: user.username });
          }
          
        } catch (error) {
          console.log('❌ Profile fetch failed:', error);
          // Fallback to username if available
          if (user.username) {
            setUserProfile({ name: user.username });
          }
        }
      }
    };

    fetchUserProfile();
  }, [user, userProfile]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const userName = userProfile?.name || user?.username || 'there';
      // Make the welcome message more personal if we have a real name
      const isRealName = userProfile?.name && userProfile.name !== user?.username;
      const greeting = isRealName ? `Hi ${userName}!` : `Hi there!`;
      
      setMessages([
        {
          id: 'welcome',
          message: '',
          response: `${greeting} I'm your AI fitness coach with access to your real fitness data. I can provide personalized workout recommendations, nutrition advice, and progress tracking based on your profile, workouts, and meals. ${isRealName ? `Great to see you, ${userName}!` : ''} Ask me anything about your fitness journey!`,
          timestamp: new Date().toISOString(),
          isUser: false,
          agentType: 'enhanced-ai',
        }
      ]);
    }
  }, [messages.length, userProfile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    if (!user) {
      setError('Please log in to use the chatbot');
      return;
    }
    
    const userMessage = currentMessage.trim();
    const userId = user.userId || user.username || 'anonymous';
    
    setCurrentMessage('');
    setLoading(true);
    setError(null);

    // Add user message to chat immediately
    const messageId = `msg-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: messageId,
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true,
    }]);

    try {
      console.log('🚀 Sending message to chatbot...');
      console.log('📋 Request details:', {
        url: '/api/chatbot-enhanced',
        message: userMessage,
        userId: userId,
        currentUrl: window.location.href
      });
      
      // Simple, direct API call
      const response = await fetch('/api/chatbot-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: userId,
          chatHistory: []
        }),
      });

      console.log('📥 Response details:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Success response:', {
        success: data.success,
        hasMessage: !!data.message,
        messagePreview: data.message ? data.message.substring(0, 50) + '...' : 'No message',
        hasPersonalizedData: data.hasPersonalizedData
      });
      
      if (!data.success || !data.message) {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from API');
      }
      
      // Add successful response to chat
      setMessages(prev => [...prev, {
        id: `${messageId}-response`,
        message: userMessage,
        response: data.message,
        timestamp: new Date().toISOString(),
        isUser: false,
        contextUsed: data.hasPersonalizedData || false,
        contextCount: data.contextDataPoints || 0,
        agentType: 'enhanced-ai',
      }]);

      // Extract user name from the response if we don't have it yet
      if (!userProfile?.name && data.message) {
        const nameMatch = data.message.match(/(?:Hello|Hi|Hey)\s+([A-Za-z]+)/i);
        if (nameMatch && nameMatch[1] && nameMatch[1].toLowerCase() !== 'there') {
          const extractedName = nameMatch[1].trim();
          console.log('✅ Extracted user name from response:', extractedName);
          setUserProfile({ name: extractedName });
        }
      }

    } catch (error) {
      console.error('❌ Full chatbot error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Add detailed error message for debugging
      const errorDetails = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessages(prev => [...prev, {
        id: `${messageId}-error`,
        message: userMessage,
        response: `Debug Info: ${errorDetails}\n\nPlease check the console for more details and try again.`,
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Updated API call to accept different endpoints
  const getChatResponse = async (message: string, userId: string, endpoint: string = '/api/chatbot') => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || (!data.response && !data.message)) {
        throw new Error('Empty response from chatbot API');
      }

      return data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw error;
    }
  };

  // Demo simulation of RAG system for assessment
  const simulateRAGResponse = async (message: string, userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      return {
        response: `Based on your recent workout history in our vector database, I can see you've been consistent with cardio sessions. For your next workout, I recommend a strength training session focusing on upper body exercises. Your previous sessions show good endurance - let's build on that with 3 sets of 8-12 reps for muscle building. This recommendation is personalized using your stored workout embeddings and fitness goals.`,
        contextUsed: true,
        context: [
          { type: 'workout', content: 'Previous cardio sessions', score: 0.89 },
          { type: 'profile', content: 'Muscle building goals', score: 0.82 }
        ]
      };
    }
    
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('meal')) {
      return {
        response: `Analyzing your meal logs from our vector database, I notice you're doing well with protein intake but could increase your vegetable consumption. Based on your dietary preferences and past meals, I suggest adding a colorful salad with mixed greens, tomatoes, and quinoa to your lunch routine. This recommendation comes from semantic search of your meal history and nutritional goals.`,
        contextUsed: true,
        context: [
          { type: 'meal', content: 'Previous protein-rich meals', score: 0.91 },
          { type: 'profile', content: 'Health optimization goals', score: 0.85 }
        ]
      };
    }
    
    if (lowerMessage.includes('progress') || lowerMessage.includes('goal')) {
      return {
        response: `Looking at your complete activity profile using our RAG system, you've made excellent progress! Your workout consistency has improved 40% over the past month, and your meal planning shows better nutritional balance. Your vector embeddings indicate strong adherence to your fitness goals. Keep focusing on the strength training progression we discussed, and consider adding one more day of cardio for optimal results.`,
        contextUsed: true,
        context: [
          { type: 'workout', content: 'Consistency tracking data', score: 0.94 },
          { type: 'meal', content: 'Nutritional improvements', score: 0.87 },
          { type: 'profile', content: 'Goal achievement metrics', score: 0.90 }
        ]
      };
    }
    
    return {
      response: `I'm your AI fitness coach powered by RAG (Retrieval-Augmented Generation). I use vector embeddings stored in Pinecone to retrieve relevant context from your personal fitness data, then generate personalized responses using OpenAI's GPT-4. Ask me about your workouts, nutrition, or progress, and I'll provide recommendations based on your actual activity history and goals!`,
      contextUsed: false,
      context: []
    };
  };

  // Debug function to check user data
  const debugUserData = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Debugging user data for:', user.userId);
      const response = await fetch('/api/debug-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.userId || user.username })
      });
      
      const data = await response.json();
      console.log('🐛 Debug results:', data);
      
      // Add debug info to chat
      setMessages(prev => [...prev, {
        id: `debug-${Date.now()}`,
        message: 'Debug user data',
        response: `**Debug Results:**
        
**Searched User ID:** ${data.debug?.searchedUserId || 'Unknown'}

**Profile Found:** ${data.debug?.foundProfile ? 'YES ✅' : 'NO ❌'}
${data.debug?.foundProfile ? `Name: ${data.debug.foundProfile.name}, Age: ${data.debug.foundProfile.age}` : ''}

**Workouts Found:** ${data.debug?.foundWorkouts || 0}
**Meals Found:** ${data.debug?.foundMeals || 0}

**Existing User IDs in DB:** ${data.debug?.existingUserIds?.join(', ') || 'None found'}

**Table Access:** 
- Profile table: ${data.debug?.tableAccess?.profile ? '✅' : '❌'}
- Workouts table: ${data.debug?.tableAccess?.workouts ? '✅' : '❌'}  
- Meals table: ${data.debug?.tableAccess?.meals ? '✅' : '❌'}

This debug info will help identify why the chatbot isn't finding your profile data.`,
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
      
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  // Debug function to check environment variables
  const debugEnvironment = async () => {
    try {
      console.log('🔍 Debugging environment variables...');
      const response = await fetch('/api/debug-env');
      const data = await response.json();
      console.log('🐛 Environment debug results:', data);
      
      // Add environment debug info to chat
      setMessages(prev => [...prev, {
        id: `env-debug-${Date.now()}`,
        message: 'Debug environment variables',
        response: `**Environment Debug Results:**

**AWS Credentials:**
- AMPLIFY_ACCESS_KEY_ID: ${data.environment?.hasAmplifyAccessKey ? '✅' : '❌'} ${data.environment?.amplifyAccessKeyStart || ''}
- AMPLIFY_SECRET_ACCESS_KEY: ${data.environment?.hasAmplifySecretKey ? '✅' : '❌'}
- AWS_ACCESS_KEY_ID: ${data.environment?.hasAwsAccessKey ? '✅' : '❌'} ${data.environment?.awsAccessKeyStart || ''}
- AWS_SECRET_ACCESS_KEY: ${data.environment?.hasAwsSecretKey ? '✅' : '❌'}

**API Keys:**
- OpenAI API Key: ${data.environment?.hasOpenAI ? '✅' : '❌'} ${data.environment?.openAIKeyStart || ''}
- Pinecone API Key: ${data.environment?.hasPinecone ? '✅' : '❌'}
- Pinecone Index: ${data.environment?.pineconeIndexName || 'Not set'}

**Environment:** ${data.environment?.NODE_ENV || 'Unknown'}

This will help identify if the environment variables are being loaded correctly.`,
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
      
    } catch (error) {
      console.error('Environment debug error:', error);
      setMessages(prev => [...prev, {
        id: `env-debug-error-${Date.now()}`,
        message: 'Debug environment variables',
        response: `❌ Failed to debug environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        isUser: false,
      }]);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2, height: '100vh', display: 'flex', flexDirection: 'column', px: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            onClick={() => router.push('/')}
            startIcon={<HomeIcon />}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Back to Dashboard
          </Button>
          
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' } }}>
            AI Fitness Coach
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          {(userProfile?.name || user?.username) && (
            <Chip 
              label={`Personalized for ${userProfile?.name || user?.username}`} 
              color="primary" 
              size="medium" 
              sx={{ fontSize: '0.9rem', height: 32 }}
            />
          )}
          
          <Tooltip title="Toggle between different AI interaction modes">
            <FormControlLabel
              control={
                <Switch
                  checked={useLangGraph}
                  onChange={(e) => setUseLangGraph(e.target.checked)}
                  color="secondary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {useLangGraph ? 'Advanced Mode' : 'Standard Mode'}
                  </Typography>
                  {useLangGraph && (
                    <Chip 
                      label="ENHANCED" 
                      color="secondary" 
                      size="small" 
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  )}
                </Box>
              }
            />
          </Tooltip>
        </Box>
      </Box>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
          minHeight: 0
        }}
      >
        {/* Chat Messages */}
        <Paper 
          elevation={1} 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3, md: 4 }, 
            mb: 2, 
            overflow: 'auto',
            backgroundColor: '#fafafa',
            borderRadius: 3,
            minHeight: '500px'
          }}
        >
          <Stack spacing={2}>
            {messages.map((msg) => (
              <Box key={msg.id}>
                {msg.isUser ? (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        maxWidth: '80%', 
                        backgroundColor: '#2196f3', 
                        color: 'white',
                        borderRadius: '18px 18px 4px 18px',
                        fontSize: '1rem'
                      }}
                    >
                      <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.5 }}>{msg.message}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1, fontSize: '0.8rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: { xs: 2, sm: 3 }, 
                        maxWidth: '85%', 
                        backgroundColor: 'white',
                        borderRadius: '18px 18px 18px 4px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: '0.9rem' }}>
                          🤖 AI Coach
                        </Typography>
                        {msg.agentType && (
                          <Chip 
                            label={
                              msg.agentType === 'langgraph-multi-agent' ? '🧠 Multi-Agent' :
                              msg.agentType === 'workout_agent' ? '💪 Workout Agent' :
                              msg.agentType === 'nutrition_agent' ? '🥗 Nutrition Agent' :
                              msg.agentType === 'progress_agent' ? '📊 Progress Agent' :
                              msg.agentType === 'general_agent' ? '💬 General Agent' :
                              '🔍 RAG'
                            }
                            size="small"
                            color={msg.agentType.includes('langgraph') ? 'secondary' : 'default'}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                        {msg.contextUsed && (
                          <Chip 
                            label={`${msg.contextCount} context items`}
                            size="small"
                            color="info"
                            sx={{ fontSize: '0.6rem', height: 18 }}
                          />
                        )}
                      </Box>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: 1.6 }}>
                        {msg.response}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5, fontSize: '0.8rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
            ))}
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    backgroundColor: 'white',
                    borderRadius: '18px 18px 18px 4px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {useLangGraph ? 'Routing to specialized agent...' : 'Thinking...'}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Message Input */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          {/* Debug info - can be removed in production */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, fontSize: '0.8rem' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Debug Info:</Typography>
              <br />
              User: {user ? `${user.username || 'no username'} (${user.userId || 'no userId'})` : 'No user'}
              <br />
              Profile: {userProfile ? userProfile.name || 'unnamed profile' : 'No profile'}
            </Box>
          )}
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask your coach anything..."
                variant="outlined"
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1rem',
                    borderRadius: 2,
                    minHeight: '56px'
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!currentMessage.trim() || loading}
                sx={{ 
                  minWidth: 100, 
                  height: 56, 
                  borderRadius: 2,
                  fontSize: '1rem'
                }}
              >
                Send
              </Button>
            </Box>
          </form>
        </Paper>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={useLangGraph ? "Plan my workout (Workout Agent)" : "Suggest a workout"}
          onClick={() => setCurrentMessage("Based on my recent workouts, what should I do next?")}
          clickable
          size="small"
          color={useLangGraph ? "secondary" : "default"}
        />
        <Chip
          label={useLangGraph ? "Nutrition advice (Nutrition Agent)" : "Nutrition advice"}
          onClick={() => setCurrentMessage("Give me personalized nutrition advice based on my goals")}
          clickable
          size="small"
          color={useLangGraph ? "secondary" : "default"}
        />
        <Chip
          label={useLangGraph ? "Progress check (Progress Agent)" : "Progress check"}
          onClick={() => setCurrentMessage("How am I progressing toward my fitness goals?")}
          clickable
          size="small"
          color={useLangGraph ? "secondary" : "default"}
        />
        <Chip
          label="Meal suggestions"
          onClick={() => setCurrentMessage("What meals would you recommend based on my dietary preferences?")}
          clickable
          size="small"
        />
        <Chip
          label="🐛 Debug User Data"
          onClick={debugUserData}
          clickable
          size="small"
          color="warning"
        />
        <Chip
          label="🔧 Debug Environment"
          onClick={debugEnvironment}
          clickable
          size="small"
          color="error"
        />
      </Box>
    </Container>
  );
} 