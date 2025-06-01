import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from '../src/app/profile/page';
import { useAuth } from '../src/app/providers/AuthProvider';
import { client } from '../src/app/amplify-config';

// Mock the authentication hook
jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the Amplify client
jest.mock('../src/app/amplify-config', () => ({
  client: {
    models: {
      UserProfile: {
        list: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
  },
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('ProfilePage Component', () => {
  beforeEach(() => {
    // Mock the auth hook to return a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { userId: 'test-user-id', username: 'testuser' },
      loading: false,
    });

    // Mock the list function to return an empty array
    (client.models.UserProfile.list as jest.Mock).mockResolvedValue({
      data: [],
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the profile form correctly', () => {
    render(<ProfilePage />);
    
    // Check if the main elements are rendered
    expect(screen.getByText('Update Your Profile')).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Height/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fitness Goals/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Profile/i })).toBeInTheDocument();
  });

  it('allows input of profile data', async () => {
    render(<ProfilePage />);
    
    // Enter profile data
    fireEvent.change(screen.getByLabelText(/Age/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Height/i), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText(/Weight/i), { target: { value: '70' } });
    fireEvent.change(screen.getByLabelText(/Fitness Goals/i), { 
      target: { value: 'Build muscle and improve endurance' } 
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

    // Check if the create function was called with correct data
    await waitFor(() => {
      expect(client.models.UserProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
          age: 30,
          height: 175,
          weight: 70,
          fitnessGoals: 'Build muscle and improve endurance',
        })
      );
    });

    // Check if embedding API was called
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );
  });
});
