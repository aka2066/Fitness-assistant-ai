'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Paper,
} from '@mui/material';
import {
  FitnessCenter,
  Restaurant,
  Chat,
  Person,
  Analytics
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';
import Navigation from '../components/Navigation';
import NewUserRedirect from '../components/NewUserRedirect';

const QuickActionCard = ({
  title,
  description,
  icon,
  href,
  gradient,
  color = 'primary'
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}) => (
  <Card 
    sx={{ 
      height: '100%', 
      transition: 'all 0.3s ease',
      '&:hover': { 
        transform: 'translateY(-8px)', 
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)' 
      },
      background: gradient,
      color: 'white',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255,255,255,0.1)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
      },
      '&:hover::before': {
        opacity: 1,
      }
    }}
  >
    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2, opacity: 0.9 }}>
          {icon}
        </Box>
        <Typography variant="h5" component="h3" fontWeight="600">
          {title}
        </Typography>
      </Box>
      <Typography 
        variant="body1" 
        sx={{ 
          opacity: 0.9, 
          mb: 'auto', 
          lineHeight: 1.6,
          fontSize: '1rem' 
        }}
      >
        {description}
      </Typography>
      <Button
        component={Link}
        href={href}
        variant="contained"
        sx={{
          mt: 2,
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          fontWeight: 600,
          borderRadius: 2,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.3)',
          }
        }}
        size="large"
      >
        Get Started
      </Button>
    </CardContent>
  </Card>
);

const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <Paper 
    elevation={2}
    sx={{ 
      p: 4, 
      textAlign: 'center', 
      height: '100%',
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
      }
    }}
  >
    <Typography variant="h3" sx={{ mb: 2, fontSize: '3rem' }}>{icon}</Typography>
    <Typography variant="h6" gutterBottom fontWeight="600" color="primary.main">
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
      {description}
    </Typography>
  </Paper>
);

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [userName, setUserName] = useState('');

  // Fetch user name for personalized greeting
  useEffect(() => {
    const fetchUserName = async () => {
      if (user && user.userId) {
        try {
          const response = await fetch('/api/get-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.profile?.name) {
              setUserName(data.profile.name);
            }
          }
        } catch (error) {
          console.log('Could not fetch user name:', error);
        }
      }
    };

    fetchUserName();
  }, [user]);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography variant="h4" color="primary">Loading your fitness journey...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <NewUserRedirect />
      <Navigation />

      {/* Hero Section */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              fontWeight="700"
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                mb: 2 
              }}
            >
              {userName ? `Welcome back, ${userName}! 👋` : 'Your AI-Powered Fitness Assistant'}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                opacity: 0.9, 
                maxWidth: '600px', 
                mx: 'auto', 
                lineHeight: 1.6,
                fontSize: { xs: '1.1rem', sm: '1.3rem' }
              }}
            >
              Track your workouts and meals while getting personalized recommendations based on your fitness journey.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mb: 8 }}>
        {/* Quick Actions Grid */}
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom 
          textAlign="center" 
          sx={{ mb: 5, fontWeight: 600, color: 'text.primary' }}
        >
          Get Started
        </Typography>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} sm={6} lg={4}>
            <QuickActionCard
              title="Workouts"
              description="Log your exercises, duration, and intensity. Our AI learns from your patterns to suggest optimal routines."
              icon={<FitnessCenter sx={{ fontSize: 40 }} />}
              href="/workouts"
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={4}>
            <QuickActionCard
              title="Meals"
              description="Record your nutrition intake and get personalized meal suggestions based on your goals."
              icon={<Restaurant sx={{ fontSize: 40 }} />}
              href="/meals"
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={4}>
            <QuickActionCard
              title="AI Chat"
              description="Get instant, personalized advice from your AI fitness coach based on your activity history."
              icon={<Chat sx={{ fontSize: 40 }} />}
              href="/chat"
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              color="secondary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={4}>
            <QuickActionCard
              title="Profile"
              description="Set your fitness goals, preferences, and track your progress over time."
              icon={<Person sx={{ fontSize: 40 }} />}
              href="/profile"
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} lg={4}>
            <QuickActionCard
              title="Progress Analytics"
              description="View detailed insights about your fitness journey and achievements."
              icon={<Analytics sx={{ fontSize: 40 }} />}
              href="/analytics"
              gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
              color="primary"
            />
          </Grid>
        </Grid>

        {/* Features Overview */}
        <Typography 
          variant="h3" 
          component="h2" 
          gutterBottom 
          textAlign="center"
          sx={{ mb: 5, fontWeight: 600, color: 'text.primary' }}
        >
          Why Choose Our AI Fitness Coach?
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon="🧠"
              title="AI-Powered Insights"
              description="Our advanced AI analyzes your workout patterns and provides personalized recommendations based on your unique fitness journey."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon="📊"
              title="Smart Tracking"
              description="Comprehensive logging for workouts and meals with intelligent progress tracking and detailed analytics."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon="🎯"
              title="Goal-Oriented"
              description="Set and achieve your fitness goals with data-driven guidance, motivation, and personalized coaching."
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
} 