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

// Simple test component
function SimpleProfileTest() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicSave = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('🧪 Testing profile save with full data...');
      console.log('User:', user);
      console.log('Data:', { name, age: parseInt(age), userId: user?.userId });

      const createQuery = `
        mutation CreateUserProfile($input: CreateUserProfileInput!) {
          createUserProfile(input: $input) {
            id
            userId
            name
            age
            createdAt
            updatedAt
          }
        }
      `;
      
      const result: any = await client.graphql({
        query: createQuery,
        variables: {
          input: {
            userId: user?.userId,
            name: name,
            age: parseInt(age)
          }
        }
      });

      console.log('✅ Result:', result);
      
      if (result.data?.createUserProfile) {
        setMessage(`✅ SUCCESS! Created profile in DynamoDB: ${JSON.stringify(result.data.createUserProfile)}`);
      } else {
        setMessage(`❌ No data returned: ${JSON.stringify(result)}`);
      }

    } catch (error: any) {
      console.error('❌ Error:', error);
      setMessage(`❌ ERROR: ${error.message || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Typography>Please sign in first</Typography>;
  }

  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: '#e3f2fd', border: '2px solid #2196f3' }}>
      <Typography variant="h6" gutterBottom>
        🧪 DEBUG: Simple Profile Save Test
      </Typography>
      
      <Typography variant="body2" paragraph>
        User: {user.username} (ID: {user.userId})
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          size="small"
        />
        
        <TextField
          label="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
          size="small"
        />
        
        <Button 
          variant="contained" 
          onClick={testBasicSave}
          disabled={loading || !name || !age}
          size="small"
        >
          {loading ? 'Saving...' : 'Test Save'}
        </Button>
      </Box>

      {message && (
        <Alert severity={message.includes('SUCCESS') ? 'success' : 'error'}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{message}</pre>
        </Alert>
      )}
    </Paper>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    userId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

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
          createdAt: existingProfile.createdAt || undefined,
          updatedAt: existingProfile.updatedAt || undefined,
        });
        setIsNewUser(false);
      } else {
        setProfile({
          userId: user!.userId,
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
      };

      let result: any;
      
      if (profile.id) {
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
      } else {
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
      }

      if (result.data) {
        const savedProfile = profile.id ? result.data.updateUserProfile : result.data.createUserProfile;
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
          createdAt: savedProfile.createdAt,
          updatedAt: savedProfile.updatedAt,
        });
        setMessage({ type: 'success', text: 'Profile saved successfully!' });
        
        // If this was a new user, redirect to dashboard after a delay
        if (isNewUser) {
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setMessage({ type: 'error', text: `Failed to save profile: ${error}` });
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
      <SimpleProfileTest />
      
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