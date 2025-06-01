'use client';

import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';
import { client } from '../amplify-config';

const workoutTypes = [
  'Cardio',
  'Strength Training',
  'Yoga',
  'Pilates',
  'Running',
  'Cycling',
  'Swimming',
  'Walking',
  'HIIT',
  'CrossFit',
  'Other',
];

export default function LogWorkoutPage() {
  const { user } = useAuth();
  const [workout, setWorkout] = useState({
    type: '',
    duration: '',
    calories: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Save to DynamoDB
      const workoutData = {
        userId: user?.userId || '',
        type: workout.type,
        duration: parseInt(workout.duration),
        calories: parseInt(workout.calories),
        notes: workout.notes,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const { data } = await client.models.WorkoutLog.create(workoutData);

      // Create embedding for workout
      const embeddingContent = `Workout: ${workout.type} for ${workout.duration} minutes, burned ${workout.calories} calories. Notes: ${workout.notes}`;
      
      await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.id || `workout_${Date.now()}`,
          userId: user?.userId,
          type: 'workout',
          content: embeddingContent,
          metadata: {
            type: workout.type,
            duration: parseInt(workout.duration),
            calories: parseInt(workout.calories),
            date: new Date().toISOString(),
            notes: workout.notes,
          },
        }),
      });

      setMessage('Workout logged successfully!');
      setIsSuccess(true);
      setWorkout({ type: '', duration: '', calories: '', notes: '' });
    } catch (error) {
      console.error('Error logging workout:', error);
      setMessage('Error logging workout. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setWorkout(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Link href="/" passHref>
            <IconButton edge="start" color="inherit" aria-label="back">
              <ArrowBack />
            </IconButton>
          </Link>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Log Workout
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Log Your Workout
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Track your exercise session to get personalized recommendations.
          </Typography>

          {message && (
            <Alert severity={isSuccess ? 'success' : 'error'} sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Workout Type</InputLabel>
                  <Select
                    value={workout.type}
                    onChange={handleInputChange('type')}
                    label="Workout Type"
                  >
                    {workoutTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Duration (minutes)"
                  type="number"
                  value={workout.duration}
                  onChange={handleInputChange('duration')}
                  InputProps={{ inputProps: { min: 1, max: 600 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Calories Burned"
                  type="number"
                  value={workout.calories}
                  onChange={handleInputChange('calories')}
                  InputProps={{ inputProps: { min: 0, max: 5000 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={workout.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Any additional details about your workout..."
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Link href="/" passHref>
                <Button variant="outlined">Cancel</Button>
              </Link>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !workout.type || !workout.duration}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Logging...' : 'Log Workout'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
} 