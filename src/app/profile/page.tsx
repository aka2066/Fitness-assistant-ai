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
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

interface UserProfile {
  id?: string;
  userId: string;
  name?: string;
  age?: number;
  heightFeet?: number;
  heightInches?: number;
  weight?: number; // in pounds
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
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading profile for user:', user?.userId);
      
      const listQuery = `
        query ListUserProfiles($filter: ModelUserProfileFilterInput) {
          listUserProfiles(filter: $filter) {
            items {
              id
              userId
              name
              age
              heightFeet
              heightInches
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
      
      const result: any = await client.graphql({
        query: listQuery,
        variables: {
          filter: {
            userId: {
              eq: user!.userId
            }
          }
        }
      });
      
      console.log('📋 Load result:', result);
      
      const profiles = result.data?.listUserProfiles?.items || [];
      
      if (profiles && profiles.length > 0) {
        const existingProfile = profiles[0];
        setProfile({
          id: existingProfile.id,
          userId: existingProfile.userId,
          name: existingProfile.name,
          age: existingProfile.age || undefined,
          heightFeet: existingProfile.heightFeet || undefined,
          heightInches: existingProfile.heightInches || undefined,
          weight: existingProfile.weight || undefined,
          fitnessGoals: existingProfile.fitnessGoals || undefined,
          activityLevel: existingProfile.activityLevel || undefined,
          dietaryRestrictions: existingProfile.dietaryRestrictions || undefined,
          createdAt: existingProfile.createdAt || undefined,
          updatedAt: existingProfile.updatedAt || undefined,
        });
        setIsNewUser(false);
        console.log('✅ Loaded existing profile:', existingProfile);
      } else {
        setProfile({
          userId: user!.userId,
        });
        setIsNewUser(true);
        console.log('📝 No existing profile, creating new one');
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('🔄 Starting profile save...');
      console.log('👤 User:', user);
      console.log('📝 Profile:', profile);
      
      const profileData = {
        userId: profile.userId,
        name: profile.name,
        age: profile.age,
        heightFeet: profile.heightFeet,
        heightInches: profile.heightInches,
        weight: profile.weight,
        fitnessGoals: profile.fitnessGoals,
        activityLevel: profile.activityLevel,
        dietaryRestrictions: profile.dietaryRestrictions,
      };

      console.log('🚀 Saving data:', profileData);

      let result: any;
      
      if (profile.id) {
        console.log('✏️ Updating existing profile...');
        const updateQuery = `
          mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
            updateUserProfile(input: $input) {
              id
              userId
              name
              age
              heightFeet
              heightInches
              weight
              fitnessGoals
              activityLevel
              dietaryRestrictions
              createdAt
              updatedAt
            }
          }
        `;
        
        result = await client.graphql({
          query: updateQuery,
          variables: {
            input: {
              id: profile.id,
              ...profileData,
            }
          }
        });
        console.log('✅ Update result:', result);
      } else {
        console.log('🆕 Creating new profile...');
        const createQuery = `
          mutation CreateUserProfile($input: CreateUserProfileInput!) {
            createUserProfile(input: $input) {
              id
              userId
              name
              age
              heightFeet
              heightInches
              weight
              fitnessGoals
              activityLevel
              dietaryRestrictions
              createdAt
              updatedAt
            }
          }
        `;
        
        result = await client.graphql({
          query: createQuery,
          variables: {
            input: profileData
          }
        });
        console.log('✅ Create result:', result);
      }

      if (result.data) {
        const savedProfile = profile.id ? result.data.updateUserProfile : result.data.createUserProfile;
        setProfile({
          id: savedProfile.id,
          userId: savedProfile.userId,
          name: savedProfile.name,
          age: savedProfile.age,
          heightFeet: savedProfile.heightFeet,
          heightInches: savedProfile.heightInches,
          weight: savedProfile.weight,
          fitnessGoals: savedProfile.fitnessGoals,
          activityLevel: savedProfile.activityLevel,
          dietaryRestrictions: savedProfile.dietaryRestrictions,
          createdAt: savedProfile.createdAt,
          updatedAt: savedProfile.updatedAt,
        });
        setMessage({ type: 'success', text: 'Profile saved to DynamoDB!' });
        console.log('🎉 Profile saved successfully:', savedProfile);
        
        // If this was a new user, redirect to dashboard after a delay
        if (isNewUser) {
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
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
          {isNewUser ? 'Welcome! Complete Your Profile' : 'Update Your Profile'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {isNewUser 
            ? 'Let\'s get to know you better to provide personalized fitness recommendations!'
            : 'Update your information to get better personalized recommendations.'
          }
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              value={profile.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              required={isNewUser}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 13, max: 120 }}
              required={isNewUser}
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Height (feet)"
              type="number"
              value={profile.heightFeet || ''}
              onChange={(e) => handleInputChange('heightFeet', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 3, max: 8 }}
              placeholder="5"
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Height (inches)"
              type="number"
              value={profile.heightInches || ''}
              onChange={(e) => handleInputChange('heightInches', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 0, max: 11 }}
              placeholder="11"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Weight (lbs)"
              type="number"
              value={profile.weight || ''}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || undefined)}
              inputProps={{ min: 50, max: 800 }}
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
              label="Dietary Restrictions or Allergies"
              value={profile.dietaryRestrictions || ''}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g., Vegetarian, Gluten-free, Nut allergies, etc."
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (isNewUser && (!profile.name || !profile.age))}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {saving ? <CircularProgress size={24} /> : (isNewUser ? 'Complete Profile' : 'Save Changes')}
          </Button>

          {!isNewUser && (
            <Button
              variant="outlined"
              href="/"
              size="large"
            >
              Back to Dashboard
            </Button>
          )}
        </Box>

        {isNewUser && (
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            * Name and age are required to continue
          </Typography>
        )}
      </Paper>
    </Container>
  );
} 