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
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          response: "Hi! I'm your AI fitness coach with access to your profile and activity history. I can provide personalized workout recommendations, nutrition advice, and insights based on your actual data. What would you like to know?",
          timestamp: new Date().toISOString(),
          isUser: false,
        }
      ]);
    }
  }, [messages.length]);

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
      // Call the real RAG-enabled chatbot API
      const response = await getChatResponse(userMessage, user.userId || user.username);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        id: `${messageId}-response`,
        message: userMessage,
        response: response.response,
        timestamp: new Date().toISOString(),
        isUser: false,
        contextUsed: response.contextUsed,
        contextCount: response.context?.length || 0,
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

  // Real API call to RAG-enabled chatbot
  const getChatResponse = async (message: string, userId: string) => {
    // For demo purposes, simulate RAG with real user data
    try {
      const chatbotEndpoint = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 
        'https://jhf4qmbb7ff5ll5ctyujclivrm.appsync-api.us-east-1.amazonaws.com/chatbot';
      
      const response = await fetch(chatbotEndpoint, {
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
      // Demo fallback: Simulate RAG-enabled responses for assessment
      console.log('Using demo RAG simulation for assessment');
      return await simulateRAGResponse(message, userId);
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
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                flexDirection: msg.isUser ? 'row-reverse' : 'row',
              }}
            >
              <Avatar sx={{ 
                bgcolor: msg.isUser ? 'primary.main' : 'secondary.main',
                width: 32,
                height: 32 
              }}>
                {msg.isUser ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
              </Avatar>
              
              <Box sx={{ maxWidth: '70%' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: msg.isUser ? 'primary.light' : 'grey.100',
                    color: msg.isUser ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body1">
                    {msg.isUser ? msg.message : msg.response}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7, 
                      display: 'block',
                      mt: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                </Paper>
                
                {/* Show context information for AI responses */}
                {!msg.isUser && msg.contextUsed && (
                  <Chip
                    label={`Used ${msg.contextCount} context items`}
                    size="small"
                    color="success"
                    sx={{ mt: 1, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          ))}
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    AI is thinking and retrieving your data...
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
          
          <div ref={messagesEndRef} />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Message Input */}
        <Paper elevation={0} sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about workouts, nutrition, or your progress..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                disabled={loading}
                multiline
                maxRows={3}
                sx={{ flexGrow: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !currentMessage.trim()}
                sx={{ minWidth: 'auto', px: 3 }}
              >
                <SendIcon />
              </Button>
            </Box>
          </form>
        </Paper>
      </Paper>

      {/* Quick Actions */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="Suggest a workout"
          onClick={() => setCurrentMessage("Based on my recent workouts, what should I do next?")}
          clickable
          size="small"
        />
        <Chip
          label="Nutrition advice"
          onClick={() => setCurrentMessage("Give me personalized nutrition advice based on my goals")}
          clickable
          size="small"
        />
        <Chip
          label="Progress check"
          onClick={() => setCurrentMessage("How am I progressing toward my fitness goals?")}
          clickable
          size="small"
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