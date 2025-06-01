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
  AppBar,
  Toolbar,
  Alert
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
import { getCurrentUser } from 'aws-amplify/auth';

const QuickActionCard = ({
  title,
  description,
  icon,
  href,
  color = 'primary'
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}) => (
  <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ mr: 2, color: `${color}.main` }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        {description}
      </Typography>
      <Button
        component={Link}
        href={href}
        variant="contained"
        color={color}
        size="small"
      >
        Get Started
      </Button>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [authDebug, setAuthDebug] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setAuthDebug(`Auth working: ${currentUser.username || currentUser.userId}`);
      } catch (error) {
        setAuthDebug(`Auth not configured: ${error}`);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4">Loading...</Typography>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Fitness Assistant
          </Typography>
          <Typography variant="body2">
            Welcome, {user?.username || 'User'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Debug info */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Auth Status: {authDebug}
        </Alert>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Your AI-Powered Fitness Coach
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Track your workouts and meals while getting personalized recommendations
            based on your fitness journey.
          </Typography>
        </Box>

        {/* Quick Actions Grid */}
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="Track Workouts"
              description="Log your exercises, duration, and intensity. Our AI learns from your patterns to suggest optimal routines."
              icon={<FitnessCenter fontSize="large" />}
              href="/workouts"
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="Log Meals"
              description="Record your nutrition intake and get personalized meal suggestions based on your goals."
              icon={<Restaurant fontSize="large" />}
              href="/meals"
              color="success"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="AI Coach Chat"
              description="Get instant, personalized advice from your AI fitness coach based on your activity history."
              icon={<Chat fontSize="large" />}
              href="/chat"
              color="secondary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="Profile Setup"
              description="Set your fitness goals, preferences, and track your progress over time."
              icon={<Person fontSize="large" />}
              href="/profile"
              color="warning"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <QuickActionCard
              title="Progress Analytics"
              description="View detailed insights about your fitness journey and achievements."
              icon={<Analytics fontSize="large" />}
              href="/analytics"
              color="primary"
            />
          </Grid>
        </Grid>

        {/* Features Overview */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom textAlign="center">
            Why Choose Our AI Fitness Coach?
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>🧠 AI-Powered Insights</Typography>
                <Typography variant="body2" color="text.secondary">
                  Our advanced AI analyzes your workout patterns and provides personalized recommendations.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>📊 Smart Tracking</Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive logging for workouts and meals with intelligent progress tracking.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>🎯 Goal-Oriented</Typography>
                <Typography variant="body2" color="text.secondary">
                  Set and achieve your fitness goals with data-driven guidance and motivation.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
} 