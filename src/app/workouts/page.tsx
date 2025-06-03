'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  MenuItem,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const workoutTypes = [
  'Cardio',
  'Strength Training',
  'Yoga',
  'Pilates',
  'Running',
  'Cycling',
  'Swimming',
  'HIIT',
  'Sports',
  'Other',
];

interface WorkoutLog {
  id?: string;
  userId: string;
  type: string;
  duration?: number;
  calories?: number;
  notes?: string;
  exercises?: string;
  date: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newWorkout, setNewWorkout] = useState<WorkoutLog>({
    userId: '',
    type: '',
    duration: undefined,
    calories: undefined,
    notes: '',
    exercises: '',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  useEffect(() => {
    if (user?.userId) {
      setNewWorkout(prev => ({ ...prev, userId: user.userId }));
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      
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
              owner
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

      const workoutData = result.data?.listWorkoutLogs?.items || [];
      // Sort by date (newest first)
      workoutData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setWorkouts(workoutData);
      
    } catch (error) {
      console.error('Error loading workouts:', error);
      setMessage({ type: 'error', text: 'Failed to load workouts from database' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof WorkoutLog, value: any) => {
    setNewWorkout(prev => ({ ...prev, [field]: value }));
  };

  const createEmbedding = async (workout: WorkoutLog) => {
    try {
      // Create a text summary of the workout for embedding
      const workoutSummary = `
        Workout: ${workout.type} for ${workout.duration} minutes, ${workout.calories} calories burned.
        Notes: ${workout.notes || 'No additional notes'}.
        Date: ${workout.date}.
      `.trim();

      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: workout.userId,
          type: 'workout',
          content: workoutSummary,
          metadata: {
            workoutType: workout.type,
            duration: workout.duration,
            calories: workout.calories,
            date: workout.date,
          },
        }),
      });

      if (!response.ok) {
        console.warn('Failed to create embedding, but workout was saved');
      } else {
        const result = await response.json();
        console.log('Workout embedding created:', result);
      }
    } catch (error) {
      console.error('Error creating embedding:', error);
      // Don't fail the whole save if embedding fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWorkout.type) {
      setMessage({ type: 'error', text: 'Please select a workout type' });
      return;
    }

    try {
      setSaving(true);
      
      // Save to DynamoDB via GraphQL
      const createQuery = `
        mutation CreateWorkoutLog($input: CreateWorkoutLogInput!) {
          createWorkoutLog(input: $input) {
            id
            userId
            type
            duration
            calories
            notes
            exercises
            date
            owner
            createdAt
            updatedAt
          }
        }
      `;

      const workoutData = {
        userId: user!.userId,
        type: newWorkout.type,
        duration: newWorkout.duration,
        calories: newWorkout.calories,
        notes: newWorkout.notes || '',
        exercises: newWorkout.exercises || '',
        date: new Date(newWorkout.date).toISOString(),
        owner: user!.userId, // Required for authorization
      };

      const result: any = await client.graphql({
        query: createQuery,
        variables: {
          input: workoutData
        }
      });

      const savedWorkout = result.data?.createWorkoutLog;
      
      if (savedWorkout) {
        // Update the workouts list
        setWorkouts(prev => [savedWorkout, ...prev]);

        // Create embedding for the workout (runs in background)
        await createEmbedding(savedWorkout);

        setMessage({ type: 'success', text: 'Workout saved to database successfully!' });
        
        // Reset form
        setNewWorkout({
          userId: user?.userId || '',
          type: '',
          duration: undefined,
          calories: undefined,
          notes: '',
          exercises: '',
          date: new Date().toISOString().split('T')[0],
        });

        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('No data returned from database');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      setMessage({ type: 'error', text: `Failed to save workout: ${error}` });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading workouts from database...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Workout Tracker
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Log New Workout
        </Typography>
        
        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Workout Type"
                value={newWorkout.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                {workoutTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newWorkout.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={newWorkout.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
                InputProps={{ inputProps: { min: 1, max: 600 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calories Burned"
                type="number"
                value={newWorkout.calories || ''}
                onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || undefined)}
                InputProps={{ inputProps: { min: 0, max: 5000 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Exercises"
                value={newWorkout.exercises || ''}
                onChange={(e) => handleInputChange('exercises', e.target.value)}
                placeholder="e.g., Push-ups, Squats, Bench Press..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newWorkout.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional details about your workout..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !newWorkout.type}
                  size="large"
                >
                  {saving ? <CircularProgress size={24} /> : 'Save to Database'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Recent Workouts */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Workouts ({workouts.length})
        </Typography>
        
        {workouts.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No workouts logged yet. Start by adding your first workout above!
          </Typography>
        ) : (
          <List>
            {workouts.map((workout, index) => (
              <React.Fragment key={workout.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={workout.type} color="primary" size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(workout.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Duration: {formatDuration(workout.duration)} | 
                          Calories: {workout.calories || 'Not tracked'}
                        </Typography>
                        {workout.exercises && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Exercises: {workout.exercises}
                          </Typography>
                        )}
                        {workout.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                            Notes: {workout.notes}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Saved to DynamoDB: {workout.createdAt ? new Date(workout.createdAt).toLocaleString() : 'Unknown'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < workouts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
} 