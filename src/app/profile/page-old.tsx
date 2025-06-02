'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Box,
} from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { client } from '../amplify-config';

// Define the UserProfile interface to match the DynamoDB schema
interface UserProfile {
  id?: string;
  userId: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
  activityLevel?: string;
  dietaryRestrictions?: string;
  createdAt?: string;
  updatedAt?: string;
}

const activityLevels = [
  'Sedentary (little or no exercise)',
  'Lightly active (light exercise 1-3 days/week)',
  'Moderately active (moderate exercise 3-5 days/week)',
  'Very active (hard exercise 6-7 days/week)',
  'Extremely active (very hard exercise, physical job)',
];

const fitnessGoalsOptions = [
  'Lose weight',
  'Gain muscle',
  'Improve endurance',
  'Maintain current fitness',
  'Increase strength',
  'Improve flexibility',
  'General health and wellness',
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
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
      
      // Use raw GraphQL query to load profile
      const listQuery = `
        query ListUserProfiles($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter) {
            items {
              id
              userId
              age
              height
              weight
              fitnessGoals
              activityLevel
              dietaryRestrictions
              createdAt
              updatedAt
            }
          }
        }
      `;
      
      const result = await client.graphql({
        query: listQuery,
        variables: {
          filter: {
            userId: {
              eq: user!.userId
            }
          }
        }
      });
      
      console.log('📋 Load profile result:', result);
      
      const profiles = result.data?.listUserProfiles?.items || [];
      
      if (profiles && profiles.length > 0) {
        // Use the first profile found
        const existingProfile = profiles[0];
        setProfile({
          id: existingProfile.id,
          userId: existingProfile.userId,
          age: existingProfile.age || undefined,
          height: existingProfile.height || undefined,
          weight: existingProfile.weight || undefined,
          fitnessGoals: existingProfile.fitnessGoals || undefined,
          activityLevel: existingProfile.activityLevel || undefined,
          dietaryRestrictions: existingProfile.dietaryRestrictions || undefined,
          createdAt: existingProfile.createdAt || undefined,
          updatedAt: existingProfile.updatedAt || undefined,
        });
      } else {
        // Create new profile template
        setProfile({
          userId: user!.userId,
        });
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
          id: profile.id || `profile_${Date.now()}`,
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
      
      const result = await response.json();
      console.log('Embedding created:', result);
    } catch (error) {
      console.error('Error creating embedding:', error);
      // Don't fail the whole save if embedding fails
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('🔄 Starting profile save process...');
      console.log('👤 Current user:', user);
      console.log('📝 Profile data to save:', profile);
      
      // Prepare the profile data for saving (without owner field for now)
      const profileData = {
        userId: profile.userId,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        fitnessGoals: profile.fitnessGoals,
        activityLevel: profile.activityLevel,
        dietaryRestrictions: profile.dietaryRestrictions,
      };

      console.log('🚀 Prepared data for GraphQL:', profileData);

      let savedProfile;
      
      if (profile.id) {
        console.log('✏️ Updating existing profile with ID:', profile.id);
        // Update existing profile
        const result = await client.models.UserProfile.update({
          id: profile.id,
          ...profileData,
        });
        savedProfile = result.data;
        console.log('✅ Update result:', savedProfile);
        console.log('⚠️  Update errors:', result.errors);
      } else {
        console.log('🆕 Creating new profile...');
        // Create new profile
        const result = await client.models.UserProfile.create(profileData);
        savedProfile = result.data;
        console.log('✅ Create result:', savedProfile);
        console.log('⚠️  Create errors:', result.errors);
      }

      if (savedProfile) {
        console.log('🎉 Profile saved successfully:', savedProfile);
        setProfile({
          id: savedProfile.id,
          userId: savedProfile.userId,
          age: savedProfile.age || undefined,
          height: savedProfile.height || undefined,
          weight: savedProfile.weight || undefined,
          fitnessGoals: savedProfile.fitnessGoals || undefined,
          activityLevel: savedProfile.activityLevel || undefined,
          dietaryRestrictions: savedProfile.dietaryRestrictions || undefined,
          createdAt: savedProfile.createdAt || undefined,
          updatedAt: savedProfile.updatedAt || undefined,
        });

        // Create embedding for the profile (runs in background)
        console.log('🧠 Creating embedding...');
        await createEmbedding(savedProfile);
        console.log('✅ Embedding created');
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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