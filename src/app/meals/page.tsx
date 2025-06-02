'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { mealStorage, MealLog } from '../../utils/localData';

const mealTypes = [
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Snack',
];

export default function MealsPage() {
  const { user, loading: authLoading } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newMeal, setNewMeal] = useState<MealLog>({
    userId: '',
    type: '',
    calories: undefined,
    notes: '',
    foods: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user?.userId) {
      setNewMeal(prev => ({ ...prev, userId: user.userId }));
      loadMeals();
    }
  }, [user]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const mealData = mealStorage.getAll(user!.userId);
      setMeals(mealData);
    } catch (error) {
      console.error('Error loading meals:', error);
      setMessage({ type: 'error', text: 'Failed to load meals' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MealLog, value: any) => {
    setNewMeal(prev => ({ ...prev, [field]: value }));
  };

  const createEmbedding = async (meal: MealLog) => {
    try {
      // Create a text summary of the meal for embedding
      const mealSummary = `
        Meal: ${meal.type} with ${meal.calories} calories.
        Foods: ${meal.foods || meal.notes || 'Not specified'}.
        Date: ${meal.date}.
      `.trim();

      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: meal.userId,
          type: 'meal',
          content: mealSummary,
          metadata: {
            mealType: meal.type,
            calories: meal.calories,
            date: meal.date,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create embedding');
      }
      
      const result = await response.json();
      console.log('Meal embedding created:', result);
    } catch (error) {
      console.error('Error creating embedding:', error);
      // Don't fail the whole save if embedding fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMeal.type) {
      setMessage({ type: 'error', text: 'Please select a meal type' });
      return;
    }

    try {
      setSaving(true);
      
      // Save to local storage
      const savedMeal = mealStorage.save(newMeal);
      
      // Update the meals list
      setMeals(prev => [savedMeal, ...prev]);

      // Create embedding for the meal (runs in background)
      await createEmbedding(savedMeal);

      setMessage({ type: 'success', text: 'Meal logged successfully!' });
      
      // Reset form
      setNewMeal({
        userId: user?.userId || '',
        type: '',
        calories: undefined,
        notes: '',
        foods: '',
        date: new Date().toISOString().split('T')[0],
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving meal:', error);
      setMessage({ type: 'error', text: 'Failed to save meal' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (authLoading || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading meals...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Meal Tracker
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Log New Meal
        </Typography>
        
        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            select
            label="Meal Type"
            value={newMeal.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            required
            sx={{ mb: 2 }}
          >
            {mealTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            label="Calories"
            type="number"
            value={newMeal.calories || ''}
            onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || undefined)}
            inputProps={{ min: 0, max: 5000 }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={newMeal.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Foods & Notes"
            value={newMeal.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="What did you eat? How did it make you feel?"
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              size="large"
            >
              {saving ? <CircularProgress size={24} /> : 'Log Meal'}
            </Button>
            
            <Button
              variant="outlined"
              href="/"
              size="large"
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Meal History */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Meal History
        </Typography>
        
        {meals.length === 0 ? (
          <Typography variant="body1" color="text.secondary">
            No meals logged yet. Start by logging your first meal above!
          </Typography>
        ) : (
          <List>
            {meals.map((meal, index) => (
              <React.Fragment key={meal.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={meal.type} color="secondary" size="small" />
                        <Typography variant="body1">
                          {formatDate(meal.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Calories: {meal.calories || 'Not specified'}
                        </Typography>
                        {meal.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Notes: {meal.notes}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < meals.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
} 