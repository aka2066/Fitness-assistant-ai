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
} from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { client } from '../amplify-config';

interface UserProfile {
  id?: string;
  userId: string;
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  fitnessGoals?: string;
  activityLevel?: string;
  dietaryRestrictions?: string;
}

const activityLevels = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
  'Extremely Active',
];

const fitnessGoalsOptions = [
  'Lose Weight',
  'Maintain Weight',
  'Gain Weight',
  'Build Muscle',
  'Improve Endurance',
  'General Fitness',
  'Rehabilitation',
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    userId: user?.userId || '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.userId) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { userId: { eq: user?.userId } },
      });
      
      if (profiles && profiles.length > 0) {
        setProfile(profiles[0] as UserProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const createEmbedding = async (profile: UserProfile) => {
    try {
      // Create a text summary of the profile for embedding
      const profileSummary = `
        User profile: ${profile.age} years old, ${profile.height}cm tall, ${profile.weight}kg.
        Fitness goals: ${profile.fitnessGoals || 'Not specified'}.
        Activity level: ${profile.activityLevel || 'Not specified'}.
        Dietary restrictions: ${profile.dietaryRestrictions || 'None'}.
      `.trim();

      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId,
          type: 'profile',
          content: profileSummary,
          metadata: {
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            fitnessGoals: profile.fitnessGoals,
            activityLevel: profile.activityLevel,
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

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const profileData = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };

      if (profile.id) {
        // Update existing profile
        await client.models.UserProfile.update(profileData);
      } else {
        // Create new profile
        profileData.createdAt = new Date().toISOString();
        await client.models.UserProfile.create(profileData);
      }

      // Create embedding for the profile
      await createEmbedding(profile);

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading profile...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Profile
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your personal information to receive personalized fitness and nutrition recommendations.
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 1, max: 120 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Height (cm)"
              type="number"
              value={profile.height || ''}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || undefined)}
              inputProps={{ min: 50, max: 300, step: 0.1 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Weight (kg)"
              type="number"
              value={profile.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
              inputProps={{ min: 1, max: 500, step: 0.1 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Activity Level"
              value={profile.activityLevel || ''}
              onChange={(e) => handleInputChange('activityLevel', e.target.value)}
            >
              {activityLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Primary Fitness Goal"
              value={profile.fitnessGoals || ''}
              onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
            >
              {fitnessGoalsOptions.map((goal) => (
                <MenuItem key={goal} value={goal}>
                  {goal}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Dietary Restrictions"
              value={profile.dietaryRestrictions || ''}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g., Vegetarian, Gluten-free, Nut allergies..."
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            size="large"
          >
            {saving ? <CircularProgress size={24} /> : 'Save Profile'}
          </Button>
          
          <Button
            variant="outlined"
            href="/"
            size="large"
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 