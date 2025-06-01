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
import { client } from '../amplify-config';

interface MealLog {
  id?: string;
  userId: string;
  type: string;
  calories?: number;
  notes?: string;
  foods?: string;
  date: string;
}

const mealTypes = [
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Snack',
];

export default function MealsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newMeal, setNewMeal] = useState<MealLog>({
    userId: user?.userId || '',
    type: '',
    calories: undefined,
    notes: '',
    foods: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user?.userId) {
      loadMeals();
    }
  }, [user]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const { data: mealData } = await client.models.MealLog.list({
        filter: { userId: { eq: user?.userId } },
      });
      
      if (mealData) {
        setMeals(mealData as MealLog[]);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMeal.type) {
      setMessage({ type: 'error', text: 'Please select a meal type' });
      return;
    }

    try {
      setSaving(true);
      
      const mealData = {
        ...newMeal,
        createdAt: new Date().toISOString(),
        date: new Date(newMeal.date).toISOString(),
      };

      const { data: savedMeal } = await client.models.MealLog.create(mealData);
      
      if (savedMeal) {
        setMeals(prev => [savedMeal as MealLog, ...prev]);
      }

      setNewMeal({
        userId: user?.userId || '',
        type: '',
        calories: undefined,
        notes: '',
        foods: '',
        date: new Date().toISOString().split('T')[0],
      });

      setMessage({ type: 'success', text: 'Meal logged successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving meal:', error);
      setMessage({ type: 'error', text: 'Failed to save meal' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Log Meal'}
            </Button>
            
            <Button variant="outlined" href="/">
              Back to Dashboard
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Meals
        </Typography>
        
        {meals.length === 0 ? (
          <Typography color="text.secondary">
            No meals logged yet. Start by adding your first meal!
          </Typography>
        ) : (
          <List>
            {meals.slice(0, 10).map((meal, index) => (
              <React.Fragment key={meal.id || index}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={meal.type} size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(meal.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {meal.calories && (
                          <Typography variant="caption" display="block">
                            Calories: {meal.calories}
                          </Typography>
                        )}
                        {meal.notes && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {meal.notes}
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