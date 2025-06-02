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
import { workoutStorage, WorkoutLog } from '../../utils/localData';

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
      const workoutData = workoutStorage.getAll(user!.userId);
      setWorkouts(workoutData);
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
      
      const result = await response.json();
      console.log('Workout embedding created:', result);
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
      
      // Save to local storage
      const savedWorkout = workoutStorage.save(newWorkout);
      
      // Update the workouts list
      setWorkouts(prev => [savedWorkout, ...prev]);

      // Create embedding for the workout (runs in background)
      await createEmbedding(savedWorkout);

      setMessage({ type: 'success', text: 'Workout logged successfully!' });
      
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
    } catch (error) {
      console.error('Error saving workout:', error);
      setMessage({ type: 'error', text: 'Failed to log workout' });
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
          Loading workouts...
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
                label="Duration (minutes)"
                type="number"
                value={newWorkout.duration || ''}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 1, max: 480 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calories Burned"
                type="number"
                value={newWorkout.calories || ''}
                onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || undefined)}
                inputProps={{ min: 0, max: 2000 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
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
                label="Workout Notes"
                value={newWorkout.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="How did the workout feel? Any exercises you focused on?"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              size="large"
            >
              {saving ? <CircularProgress size={24} /> : 'Log Workout'}
            </Button>
            
            <Button
              variant="outlined"
              href="/"
              sx={{ ml: 2 }}
              size="large"
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Workout History */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Workout History
        </Typography>
        
        {workouts.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No workouts logged yet. Start by logging your first workout above!
          </Typography>
        ) : (
          <List>
            {workouts.map((workout, index) => (
              <React.Fragment key={workout.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={workout.type} color="primary" size="small" />
                        <Typography variant="body1">
                          {formatDate(workout.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatDuration(workout.duration)} | 
                          Calories: {workout.calories || 'Not specified'}
                        </Typography>
                        {workout.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Notes: {workout.notes}
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
    </Container>
  );
} 