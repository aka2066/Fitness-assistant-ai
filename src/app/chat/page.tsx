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
import { Send as SendIcon, Person, SmartToy } from '@mui/icons-material';
import { useAuth } from '../providers/AuthProvider';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLangGraph, setUseLangGraph] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          message: '',
          response: useLangGraph 
            ? "Hi! I'm your AI fitness coach powered by LangGraph multi-agent system. I have specialized agents for workouts, nutrition, and progress tracking, all with access to your profile and activity history. What would you like to know?"
            : "Hi! I'm your AI fitness coach with access to your profile and activity history. I can provide personalized workout recommendations, nutrition advice, and insights based on your actual data. What would you like to know?",
          timestamp: new Date().toISOString(),
          isUser: false,
          agentType: useLangGraph ? 'langgraph-multi-agent' : 'rag-basic',
        }
      ]);
    }
  }, [messages.length, useLangGraph]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim() || !user) return;
    
    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setLoading(true);
    setError(null);

    // Add user message to chat
    const messageId = `msg-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: messageId,
      message: userMessage,
      response: '',
      timestamp: new Date().toISOString(),
      isUser: true,
    }]);

    try {
      // Choose API endpoint based on toggle
      const endpoint = useLangGraph ? '/api/chatbot-simple' : '/api/chatbot';
      const response = await getChatResponse(userMessage, user.userId || user.username, endpoint);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        id: `${messageId}-response`,
        message: userMessage,
        response: response.response,
        timestamp: new Date().toISOString(),
        isUser: false,
        contextUsed: response.contextUsed || response.dataFound?.profile,
        contextCount: response.context?.length || (response.dataFound ? Object.values(response.dataFound).filter(Boolean).length : 0),
        agentType: response.agentType || (useLangGraph ? 'multi-agent' : 'rag-basic'),
      }]);

    } catch (error) {
      console.error('Error getting chat response:', error);
      setError('Sorry, I encountered an error. Please try again.');
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: `${messageId}-error`,
        message: userMessage,
        response: 'Sorry, I encountered an error processing your request. Please try again.',
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h3" component="h1">
          AI Fitness Coach
        </Typography>
        {user && (
          <Chip 
            label={`Personalized for ${user.username}`} 
            color="primary" 
            size="small" 
          />
        )}
        <Tooltip title={useLangGraph ? "Multi-agent system with specialized workout, nutrition, and progress agents" : "Single RAG system with vector search"}>
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
                  {useLangGraph ? 'LangGraph Multi-Agent' : 'Basic RAG'}
                </Typography>
                {useLangGraph && (
                  <Chip 
                    label="ADVANCED" 
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
      
      <Paper 
        elevation={2} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Chat Messages */}
        <Paper 
          elevation={1} 
          sx={{ 
            flexGrow: 1, 
            p: 2, 
            mb: 2, 
            overflow: 'auto',
            backgroundColor: '#fafafa',
            borderRadius: 2
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
                        p: 2, 
                        maxWidth: '70%', 
                        backgroundColor: '#2196f3', 
                        color: 'white',
                        borderRadius: '18px 18px 4px 18px'
                      }}
                    >
                      <Typography variant="body1">{msg.message}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2, 
                        maxWidth: '80%', 
                        backgroundColor: 'white',
                        borderRadius: '18px 18px 18px 4px',
                        border: '1px solid #e0e0e0'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
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
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.response}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
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
        <Paper elevation={1} sx={{ p: 2 }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask your coach anything..."
                variant="outlined"
                disabled={loading}
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
                sx={{ minWidth: 80, height: 56 }}
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
      </Box>
    </Container>
  );
} 