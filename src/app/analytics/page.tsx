'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  FitnessCenter,
  Restaurant,
  Timeline,
  EmojiEvents,
  Home as HomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

interface AnalyticsData {
  workouts: any[];
  meals: any[];
  profile: any;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({ workouts: [], meals: [], profile: null });
  const [loading, setLoading] = useState(true);

  // Fetch user data for analytics
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      try {
        // Use the same API that the chatbot uses to get comprehensive user data
        const response = await fetch('/api/debug-user-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.userId || user.username })
        });
        
        const data = await response.json();
        console.log('📊 Analytics data received:', data);
        
        if (data.success && data.debug) {
          // Fetch the actual workout and meal arrays using GraphQL
          const [workoutsData, mealsData] = await Promise.all([
            fetchWorkouts(),
            fetchMeals()
          ]);
          
          setAnalyticsData({
            workouts: workoutsData,
            meals: mealsData,
            profile: data.debug.foundProfile
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchWorkouts = async () => {
      try {
        const { generateClient } = await import('aws-amplify/api');
        const client = generateClient();
        
        const listQuery = `
          query ListWorkoutLogs($filter: ModelWorkoutLogFilterInput) {
            listWorkoutLogs(filter: $filter) {
              items {
                id
                userId
                type
                duration
                calories
                notes
                exercises
                date
                createdAt
                updatedAt
              }
            }
          }
        `;
        
        const result: any = await client.graphql({
          query: listQuery,
          variables: {
            filter: {
              userId: { eq: user!.userId }
            }
          }
        });

        return result.data?.listWorkoutLogs?.items || [];
      } catch (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }
    };

    const fetchMeals = async () => {
      try {
        const { generateClient } = await import('aws-amplify/api');
        const client = generateClient();
        
        const listQuery = `
          query ListMealLogs($filter: ModelMealLogFilterInput) {
            listMealLogs(filter: $filter) {
              items {
                id
                userId
                type
                calories
                notes
                foods
                date
                createdAt
                updatedAt
              }
            }
          }
        `;
        
        const result: any = await client.graphql({
          query: listQuery,
          variables: {
            filter: {
              userId: { eq: user!.userId }
            }
          }
        });

        return result.data?.listMealLogs?.items || [];
      } catch (error) {
        console.error('Error fetching meals:', error);
        return [];
      }
    };

    fetchAnalyticsData();
  }, [user]);

  // Calculate analytics metrics
  const calculateMetrics = () => {
    const totalWorkouts = analyticsData.workouts.length;
    const totalMeals = analyticsData.meals.length;
    
    const totalCaloriesBurned = analyticsData.workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);
    const totalCaloriesConsumed = analyticsData.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    
    const avgWorkoutDuration = totalWorkouts > 0 
      ? analyticsData.workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / totalWorkouts 
      : 0;
    
    const avgCaloriesPerMeal = totalMeals > 0 
      ? totalCaloriesConsumed / totalMeals 
      : 0;

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentWorkouts = analyticsData.workouts.filter(w => 
      new Date(w.createdAt || w.date) > oneWeekAgo
    ).length;
    
    const recentMeals = analyticsData.meals.filter(m => 
      new Date(m.createdAt || m.date) > oneWeekAgo
    ).length;

    return {
      totalWorkouts,
      totalMeals,
      totalCaloriesBurned,
      totalCaloriesConsumed,
      avgWorkoutDuration: Math.round(avgWorkoutDuration),
      avgCaloriesPerMeal: Math.round(avgCaloriesPerMeal),
      recentWorkouts,
      recentMeals,
      netCalories: totalCaloriesConsumed - totalCaloriesBurned
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h4">Loading Analytics...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            📊 Progress Analytics
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {analyticsData.profile?.name ? `${analyticsData.profile.name}'s` : 'Your'} Fitness Journey Insights
          </Typography>
        </Box>
        <Button
          onClick={() => router.push('/')}
          startIcon={<HomeIcon />}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
      </Box>

      {/* Quick Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{metrics.totalWorkouts}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Workouts</Typography>
                </Box>
                <FitnessCenter sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{metrics.totalMeals}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Meals Logged</Typography>
                </Box>
                <Restaurant sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{metrics.totalCaloriesBurned.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Calories Burned</Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{metrics.totalCaloriesConsumed.toLocaleString()}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Calories Consumed</Typography>
                </Box>
                <Restaurant sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Analytics */}
      <Grid container spacing={4}>
        {/* Workout Analytics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FitnessCenter color="primary" />
              Workout Insights
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>Average Workout Duration</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((metrics.avgWorkoutDuration / 60) * 100, 100)} 
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="h6" color="primary">{metrics.avgWorkoutDuration} min</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>Recent Activity (Last 7 Days)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${metrics.recentWorkouts} Workouts`} 
                  color={metrics.recentWorkouts >= 3 ? "success" : "warning"}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {metrics.recentWorkouts >= 3 ? 'Great consistency!' : 'Try to be more active'}
                </Typography>
              </Box>
            </Box>

            {analyticsData.profile?.fitnessGoals && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Goal:</strong> {analyticsData.profile.fitnessGoals}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Nutrition Analytics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Restaurant color="success" />
              Nutrition Insights
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>Average Calories Per Meal</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((metrics.avgCaloriesPerMeal / 800) * 100, 100)} 
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color="success"
                />
                <Typography variant="h6" color="success.main">{metrics.avgCaloriesPerMeal} cal</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>Net Calorie Balance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${metrics.netCalories > 0 ? '+' : ''}${metrics.netCalories.toLocaleString()} cal`}
                  color={metrics.netCalories < 0 ? "success" : "warning"}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {metrics.netCalories < 0 ? 'Calorie deficit (good for weight loss)' : 'Calorie surplus'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>Meal Logging (Last 7 Days)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${metrics.recentMeals} Meals`} 
                  color={metrics.recentMeals >= 14 ? "success" : "warning"}
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  {metrics.recentMeals >= 14 ? 'Excellent tracking!' : 'Log more meals for better insights'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Achievement Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents color="warning" />
              Achievements & Milestones
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {metrics.totalWorkouts >= 10 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">🏆 Workout Warrior</Typography>
                      <Typography variant="body2">Completed 10+ workouts</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {metrics.totalCaloriesBurned >= 1000 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">🔥 Calorie Crusher</Typography>
                      <Typography variant="body2">Burned 1000+ calories</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {metrics.recentWorkouts >= 5 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">⚡ Consistency King</Typography>
                      <Typography variant="body2">5+ workouts this week</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 