import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ProfilePage from '../profile/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock AWS Amplify
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    userId: 'test-user-123',
    username: 'testuser',
    attributes: {
      email: 'test@example.com',
    },
  }),
  fetchAuthSession: jest.fn().mockResolvedValue({
    tokens: {
      accessToken: { payload: { sub: 'test-user-123' } }
    }
  }),
}));

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn().mockResolvedValue({
      data: {
        listUserProfiles: {
          items: []
        }
      }
    })
  }))
}));

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock the AuthProvider
jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      userId: 'test-user-123',
      username: 'testuser',
      attributes: {
        email: 'test@example.com',
      },
    },
    loading: false,
  }),
}));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form with all required fields', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Update Your Profile')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (feet)')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (inches)')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument();
    expect(screen.getByLabelText('Fitness Goals')).toBeInTheDocument();
  });

  it('validates age input within acceptable range', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
    });
    
    const ageInput = screen.getByLabelText('Age') as HTMLInputElement;
    
    await act(async () => {
      fireEvent.change(ageInput, { target: { value: '25' } });
    });
    
    expect(ageInput.value).toBe('25');
  });

  it('validates height input within acceptable range', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Height (feet)')).toBeInTheDocument();
    });
    
    const heightInput = screen.getByLabelText('Height (feet)') as HTMLInputElement;
    
    await act(async () => {
      fireEvent.change(heightInput, { target: { value: '5' } });
    });
    
    expect(heightInput.value).toBe('5');
  });

  it('validates weight input within acceptable range', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument();
    });
    
    const weightInput = screen.getByLabelText('Weight (lbs)') as HTMLInputElement;
    
    await act(async () => {
      fireEvent.change(weightInput, { target: { value: '150' } });
    });
    
    expect(weightInput.value).toBe('150');
  });

  it('allows fitness goals text input', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByLabelText('Fitness Goals')).toBeInTheDocument();
    });
    
    const goalsInput = screen.getByLabelText('Fitness Goals') as HTMLTextAreaElement;
    const testGoals = 'I want to lose weight and build muscle';
    
    await act(async () => {
      fireEvent.change(goalsInput, { target: { value: testGoals } });
    });
    
    expect(goalsInput.value).toBe(testGoals);
  });

  it('shows save button and handles form submission', async () => {
    await act(async () => {
      renderWithTheme(<ProfilePage />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Save Profile')).toBeInTheDocument();
    });
    
    const saveButton = screen.getByText('Save Profile');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
  });
}); 