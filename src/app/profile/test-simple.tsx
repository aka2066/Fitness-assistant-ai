'use client';

import React, { useState } from 'react';
import { Paper, Typography, TextField, Button, Alert, Box } from '@mui/material';
import { useAuth } from '../providers/AuthProvider';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

export default function SimpleProfileTest() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicSave = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('🧪 Testing basic profile save...');
      console.log('User:', user);
      console.log('Data:', { name, age, userId: user?.userId });

      const createQuery = `
        mutation CreateUserProfile($input: CreateUserProfileInput!) {
          createUserProfile(input: $input) {
            id
            userId
            name
            age
            createdAt
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
        setMessage(`✅ SUCCESS! Created profile: ${JSON.stringify(result.data.createUserProfile)}`);
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
    <Paper sx={{ p: 3, m: 2, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>
        🧪 Simple Profile Save Test
      </Typography>
      
      <Typography variant="body2" paragraph>
        User: {user.username} (ID: {user.userId})
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
        />
        
        <TextField
          label="Age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="25"
        />
        
        <Button 
          variant="contained" 
          onClick={testBasicSave}
          disabled={loading || !name || !age}
        >
          {loading ? 'Saving...' : 'Test Save to DynamoDB'}
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