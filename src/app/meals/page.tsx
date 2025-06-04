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

const mealTypes = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Pre-workout',
  'Post-workout',
  'Other',
];

interface MealLog {
  id?: string;
  userId: string;
  type: string;
  calories?: number;
  notes?: string;
  foods?: string;
  date: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

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
    date: new Date().toISOString().split('T')[0], // Today's date
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

      const mealData = result.data?.listMealLogs?.items || [];
      // Sort by date (newest first)
      mealData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMeals(mealData);
      
    } catch (error) {
      console.error('Error loading meals:', error);
      setMessage({ type: 'error', text: 'Failed to load meals from database' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MealLog, value: any) => {
    setNewMeal(prev => ({ ...prev, [field]: value }));
  };

  const createEmbedding = async (meal: MealLog) => {
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: meal.userId,
          type: 'meal',
          data: {
            id: meal.id,
            food: meal.foods || meal.type,
            calories: meal.calories,
            protein: 0, // Not tracked yet
            carbs: 0, // Not tracked yet
            fat: 0, // Not tracked yet
            notes: meal.notes,
            date: meal.date
          },
          operation: 'upsert'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.warn('Failed to create embedding:', error);
      } else {
        const result = await response.json();
        console.log('✅ Meal embedding created:', result.message);
      }
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
      
      // Save to DynamoDB via GraphQL
      const createQuery = `
        mutation CreateMealLog($input: CreateMealLogInput!) {
          createMealLog(input: $input) {
            id
            userId
            type
            calories
            notes
            foods
            date
            owner
            createdAt
            updatedAt
          }
        }
      `;

      const mealData = {
        userId: user!.userId,
        type: newMeal.type,
        calories: newMeal.calories,
        notes: newMeal.notes || '',
        foods: newMeal.foods || '',
        date: new Date(newMeal.date).toISOString(),
        owner: user!.userId, // Required for authorization
      };

      const result: any = await client.graphql({
        query: createQuery,
        variables: {
          input: mealData
        }
      });

      const savedMeal = result.data?.createMealLog;
      
      if (savedMeal) {
        // Update the meals list
        setMeals(prev => [savedMeal, ...prev]);

        // Create embedding for the meal (runs in background)
        await createEmbedding(savedMeal);

        setMessage({ type: 'success', text: 'Meal saved to database successfully!' });
        
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
      } else {
        throw new Error('No data returned from database');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      setMessage({ type: 'error', text: `Failed to save meal: ${error}` });
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
          Loading meals from database...
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Meal Type"
                value={newMeal.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                required
              >
                {mealTypes.map((type) => (
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
                value={newMeal.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calories"
                type="number"
                value={newMeal.calories || ''}
                onChange={(e) => handleInputChange('calories', parseInt(e.target.value) || undefined)}
                InputProps={{ inputProps: { min: 0, max: 5000 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Foods"
                value={newMeal.foods || ''}
                onChange={(e) => handleInputChange('foods', e.target.value)}
                placeholder="e.g., Grilled chicken, brown rice, vegetables..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newMeal.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="How did the meal taste? Any special preparation?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !newMeal.type}
                  size="large"
                >
                  {saving ? <CircularProgress size={24} /> : 'Save to Database'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Recent Meals */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Meals ({meals.length})
        </Typography>
        
        {meals.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No meals logged yet. Start by adding your first meal above!
          </Typography>
        ) : (
          <List>
            {meals.map((meal, index) => (
              <React.Fragment key={meal.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={meal.type} color="secondary" size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(meal.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Calories: {meal.calories || 'Not tracked'}
                        </Typography>
                        {meal.foods && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            Foods: {meal.foods}
                          </Typography>
                        )}
                        {meal.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                            Notes: {meal.notes}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          Saved to DynamoDB: {meal.createdAt ? new Date(meal.createdAt).toLocaleString() : 'Unknown'}
                        </Typography>
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