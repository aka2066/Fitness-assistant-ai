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
import { client } from '../amplify-config';

interface WorkoutLog {
  id?: string;
  userId: string;
  type: string;
  duration?: number; // in minutes
  calories?: number;
  notes?: string;
  exercises?: string; // JSON string
  date: string;
}

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

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newWorkout, setNewWorkout] = useState<WorkoutLog>({
    userId: user?.userId || '',
    type: '',
    duration: undefined,
    calories: undefined,
    notes: '',
    exercises: '',
    date: new Date().toISOString().split('T')[0], // Today's date
  });

  useEffect(() => {
    if (user?.userId) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const { data: workoutData } = await client.models.WorkoutLog.list({
        filter: { userId: { eq: user?.userId } },
      });
      
      if (workoutData) {
        setWorkouts(workoutData as WorkoutLog[]);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setMessage({ type: 'error', text: 'Failed to load workouts' });
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
        throw new Error('Failed to create embedding');
      }
    } catch (error) {
      console.error('Error creating embedding:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create workout log
      const { data: workoutData } = await client.models.WorkoutLog.create({
        userId: user?.userId || user?.username || '',
        date: new Date().toISOString().split('T')[0],
        type: newWorkout.type,
        exercises: JSON.stringify(newWorkout.exercises),
        duration: newWorkout.duration,
        notes: newWorkout.notes,
      });

      if (workoutData) {
        // Generate embedding content for RAG
        const embeddingContent = generateWorkoutEmbeddingContent(newWorkout);
        
        // Send to embeddings function for vector storage
        await generateAndStoreEmbedding({
          userId: user?.userId || user?.username || '',
          type: 'workout',
          content: embeddingContent,
          metadata: {
            date: new Date().toISOString().split('T')[0],
            duration: newWorkout.duration,
            type: newWorkout.type,
            exerciseCount: newWorkout.exercises.length,
            workoutId: workoutData.id,
          }
        });

        setMessage({ type: 'success', text: 'Workout logged successfully!' });
        setNewWorkout({
          userId: user?.userId || '',
          type: '',
          duration: undefined,
          calories: undefined,
          notes: '',
          exercises: '',
          date: new Date().toISOString().split('T')[0],
        });
        
        fetchWorkouts();
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      setMessage({ type: 'error', text: 'Failed to log workout' });
    } finally {
      setLoading(false);
    }
  };

  // Generate embedding content for workouts
  const generateWorkoutEmbeddingContent = (workout: WorkoutLog): string => {
    const exercisesList = JSON.parse(workout.exercises || '[]').map((ex: any) => 
      `${ex.name}: ${ex.sets} sets x ${ex.reps} reps @ ${ex.weight}lbs`
    ).join(', ');
    
    return `${workout.type} workout for ${workout.duration} minutes. Exercises: ${exercisesList}. ${workout.notes ? `Notes: ${workout.notes}` : ''}`;
  };

  // Send data to embeddings function
  const generateAndStoreEmbedding = async (data: {
    userId: string;
    type: string;
    content: string;
    metadata: Record<string, any>;
  }) => {
    try {
      const embeddingsEndpoint = process.env.NEXT_PUBLIC_EMBEDDINGS_API_URL || 
        'https://jhf4qmbb7ff5ll5ctyujclivrm.appsync-api.us-east-1.amazonaws.com/embeddings';
      
      await fetch(embeddingsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('Embedding generated and stored successfully');
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Don't fail the main operation if embedding fails
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading workouts...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Workout Tracker
      </Typography>
      
      <Grid container spacing={4}>
        {/* Workout Logging Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
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
                <Grid item xs={12}>
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
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    type="number"
                    value={newWorkout.duration || ''}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
                    inputProps={{ min: 1, max: 600 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Calories Burned"
                    type="number"
                    value={newWorkout.calories || ''}
                    onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || undefined)}
                    inputProps={{ min: 0, max: 5000 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={newWorkout.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={newWorkout.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="How did the workout feel? Any specific exercises?"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{ minWidth: 120 }}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Log Workout'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      href="/"
                    >
                      Back to Dashboard
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Workout History */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Recent Workouts
            </Typography>
            
            {workouts.length === 0 ? (
              <Typography color="text.secondary">
                No workouts logged yet. Start by adding your first workout!
              </Typography>
            ) : (
              <List>
                {workouts.slice(0, 10).map((workout, index) => (
                  <React.Fragment key={workout.id || index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={workout.type} size="small" />
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(workout.date)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            {workout.duration && (
                              <Typography variant="caption" display="block">
                                Duration: {workout.duration} minutes
                              </Typography>
                            )}
                            {workout.calories && (
                              <Typography variant="caption" display="block">
                                Calories: {workout.calories}
                              </Typography>
                            )}
                            {workout.notes && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {workout.notes}
                              </Typography>
                            )}
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
        </Grid>
      </Grid>
    </Container>
  );
} 