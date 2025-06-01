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

const mealTypes = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Pre-workout',
  'Post-workout',
  'Other',
];

export default function LogMealPage() {
  const { user } = useAuth();
  const [meal, setMeal] = useState({
    type: '',
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
      const mealData = {
        userId: user?.userId || '',
        type: meal.type,
        calories: parseInt(meal.calories),
        notes: meal.notes,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const { data } = await client.models.MealLog.create(mealData);

      // Create embedding for meal
      const embeddingContent = `Meal: ${meal.type} with ${meal.calories} calories. Notes: ${meal.notes}`;
      
      await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data?.id || `meal_${Date.now()}`,
          userId: user?.userId,
          type: 'meal',
          content: embeddingContent,
          metadata: {
            type: meal.type,
            calories: parseInt(meal.calories),
            date: new Date().toISOString(),
            notes: meal.notes,
          },
        }),
      });

      setMessage('Meal logged successfully!');
      setIsSuccess(true);
      setMeal({ type: '', calories: '', notes: '' });
    } catch (error) {
      console.error('Error logging meal:', error);
      setMessage('Error logging meal. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setMeal(prev => ({ ...prev, [field]: e.target.value }));
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
            Log Meal
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Log Your Meal
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Track your nutrition to get personalized meal recommendations.
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
                  <InputLabel>Meal Type</InputLabel>
                  <Select
                    value={meal.type}
                    onChange={handleInputChange('type')}
                    label="Meal Type"
                  >
                    {mealTypes.map((type) => (
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
                  label="Calories"
                  type="number"
                  value={meal.calories}
                  onChange={handleInputChange('calories')}
                  InputProps={{ inputProps: { min: 0, max: 5000 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Meal Details"
                  multiline
                  rows={4}
                  value={meal.notes}
                  onChange={handleInputChange('notes')}
                  placeholder="Describe what you ate, ingredients, portion sizes, etc."
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
                disabled={loading || !meal.type}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Logging...' : 'Log Meal'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
} 