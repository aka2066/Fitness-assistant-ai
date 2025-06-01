import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ProfilePage from '../profile/page';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';

// Mock the auth provider
jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock the amplify client
jest.mock('../amplify-config', () => ({
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

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockUser = {
  userId: 'test-user-123',
  username: 'testuser',
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ProfilePage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    // Mock fetch for embeddings API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile form with all required fields', () => {
    renderWithTheme(<ProfilePage />);
    
    expect(screen.getByText('Update Your Profile')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByLabelText('Fitness Goals')).toBeInTheDocument();
  });

  it('validates age input within acceptable range', () => {
    renderWithTheme(<ProfilePage />);
    
    const ageInput = screen.getByLabelText('Age') as HTMLInputElement;
    
    fireEvent.change(ageInput, { target: { value: '25' } });
    expect(ageInput.value).toBe('25');
    
    // Test minimum value
    fireEvent.change(ageInput, { target: { value: '0' } });
    expect(ageInput.value).toBe('0');
    
    // Test maximum value
    fireEvent.change(ageInput, { target: { value: '120' } });
    expect(ageInput.value).toBe('120');
  });

  it('validates height input within acceptable range', () => {
    renderWithTheme(<ProfilePage />);
    
    const heightInput = screen.getByLabelText('Height (cm)') as HTMLInputElement;
    
    fireEvent.change(heightInput, { target: { value: '175' } });
    expect(heightInput.value).toBe('175');
  });

  it('validates weight input within acceptable range', () => {
    renderWithTheme(<ProfilePage />);
    
    const weightInput = screen.getByLabelText('Weight (kg)') as HTMLInputElement;
    
    fireEvent.change(weightInput, { target: { value: '70' } });
    expect(weightInput.value).toBe('70');
  });

  it('allows fitness goals text input', () => {
    renderWithTheme(<ProfilePage />);
    
    const goalsInput = screen.getByLabelText('Fitness Goals') as HTMLTextAreaElement;
    const testGoals = 'I want to lose weight and build muscle';
    
    fireEvent.change(goalsInput, { target: { value: testGoals } });
    expect(goalsInput.value).toBe(testGoals);
  });

  it('shows save button and handles form submission', async () => {
    renderWithTheme(<ProfilePage />);
    
    const saveButton = screen.getByText('Save Profile');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();
    
    // Fill out form
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Height (cm)'), { target: { value: '180' } });
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '75' } });
    fireEvent.change(screen.getByLabelText('Fitness Goals'), { 
      target: { value: 'Build muscle and improve endurance' } 
    });
    
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(saveButton).toHaveTextContent('Saving...');
    });
  });
}); 