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
import { useRouter } from 'next/navigation';

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
  owner?: string; // Required for authorization
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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  // Load profile when user is available
  useEffect(() => {
    if (user?.userId) {
      loadProfile();
    }
  }, [user?.userId]); // Only depend on userId

  const loadProfile = async () => {
    try {
      setLoading(true);
      
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
            userId: {
              eq: user!.userId
            }
          }
        }
      });
      
      const profiles = result.data?.listUserProfiles?.items || [];
      
      if (profiles && profiles.length > 0) {
        const existingProfile = profiles[0];
        setProfile({
          id: existingProfile.id,
          userId: existingProfile.userId,
          name: existingProfile.name || '',
          age: existingProfile.age || undefined,
          heightFeet: existingProfile.heightFeet || undefined,
          heightInches: existingProfile.heightInches || undefined,
          weight: existingProfile.weight || undefined,
          fitnessGoals: existingProfile.fitnessGoals || undefined,
          activityLevel: existingProfile.activityLevel || undefined,
          dietaryRestrictions: existingProfile.dietaryRestrictions || undefined,
          owner: existingProfile.owner,
          createdAt: existingProfile.createdAt || undefined,
          updatedAt: existingProfile.updatedAt || undefined,
        });
        setIsNewUser(false);
      } else {
        setProfile({
          userId: user!.userId,
          owner: user!.userId, // Set owner for new profiles
        });
        setIsNewUser(true);
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
      console.log('📋 Current user:', user);
      console.log('📋 Current profile:', profile);
      
      // Save all available fields
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
        owner: user!.userId, // Always set owner for authorization
      };

      console.log('📋 Profile data to save:', profileData);

      let result: any;
      
      if (profile.id) {
        console.log('🔄 Updating existing profile with ID:', profile.id);
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
              owner
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
        console.log('🔄 Creating new profile...');
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
              owner
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
        console.log('✅ Profile saved successfully:', savedProfile);
        
        setProfile({
          id: savedProfile.id,
          userId: savedProfile.userId,
          name: savedProfile.name || '',
          age: savedProfile.age,
          heightFeet: savedProfile.heightFeet,
          heightInches: savedProfile.heightInches,
          weight: savedProfile.weight,
          fitnessGoals: savedProfile.fitnessGoals,
          activityLevel: savedProfile.activityLevel,
          dietaryRestrictions: savedProfile.dietaryRestrictions,
          owner: savedProfile.owner,
          createdAt: savedProfile.createdAt,
          updatedAt: savedProfile.updatedAt,
        });
        setMessage({ type: 'success', text: 'Profile saved successfully! Your information will now appear in the navigation bar.' });
        
        // Emit event to trigger navigation refresh
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        // Redirect to dashboard after showing success message
        setTimeout(() => {
          router.push('/');
        }, 2000);
        
        // Clear message after 5 seconds (in case redirect fails)
        setTimeout(() => setMessage(null), 5000);
      }

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Unknown error occurred';
      
      if (error && typeof error === 'object') {
        if ('errors' in error && Array.isArray((error as any).errors)) {
          // GraphQL errors
          errorMessage = (error as any).errors.map((e: any) => e.message).join(', ');
        } else if ('message' in error) {
          // Standard error
          errorMessage = (error as any).message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
      }
      
      console.error('❌ Detailed error:', errorMessage);
      setMessage({ type: 'error', text: `Failed to save profile: ${errorMessage}` });
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
          Update Your Profile
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
              helperText="This will appear in your welcome message"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value) || undefined)}
              placeholder="25"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Height (feet)"
              type="number"
              value={profile.heightFeet || ''}
              onChange={(e) => handleInputChange('heightFeet', parseInt(e.target.value) || undefined)}
              placeholder="5"
              inputProps={{ min: 3, max: 8 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Height (inches)"
              type="number"
              value={profile.heightInches || ''}
              onChange={(e) => handleInputChange('heightInches', parseInt(e.target.value) || undefined)}
              placeholder="11"
              inputProps={{ min: 0, max: 11 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Weight (lbs)"
              type="number"
              value={profile.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || undefined)}
              placeholder="150"
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
              multiline
              rows={3}
              label="Fitness Goals"
              value={profile.fitnessGoals || ''}
              onChange={(e) => handleInputChange('fitnessGoals', e.target.value)}
              placeholder="e.g., lose weight, build muscle, improve endurance..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Dietary Restrictions or Allergies"
              value={profile.dietaryRestrictions || ''}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
              placeholder="e.g., Vegetarian, no nuts, lactose intolerant..."
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                {saving ? <CircularProgress size={24} /> : 'Save Profile'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {profile.id && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Profile ID: {profile.id} | Last updated: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Never'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
} 