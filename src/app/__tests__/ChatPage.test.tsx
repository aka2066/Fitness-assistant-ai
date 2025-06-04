import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ChatPage from '../chat/page';

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

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      message: 'Mock AI response from chatbot',
      hasPersonalizedData: false,
      contextDataPoints: 0,
    }),
  })
) as jest.Mock;

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

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface with welcome message', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument();
    
    // Wait for the welcome message to appear
    await waitFor(() => {
      expect(screen.getByText(/Hi! I'm your AI fitness coach powered by OpenAI/)).toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText('Ask your coach anything...')).toBeInTheDocument();
  });

  it('allows user to type message in input field', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...') as HTMLTextAreaElement;
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'What workout should I do today?' } });
    });
    
    expect(messageInput.value).toBe('What workout should I do today?');
  });

  it('disables send button when input is empty', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    const sendButton = screen.getByText('Send');
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByText('Send');
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Hello' } });
    });
    
    expect(sendButton).not.toBeDisabled();
  });

  it('sends message and displays response', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByText('Send');
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'What should I eat today?' } });
    });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });
    
    // Wait for the API response
    await waitFor(() => {
      expect(screen.getByText('Mock AI response from chatbot')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles API error gracefully', async () => {
    // Mock fetch to simulate an error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByText('Send');
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
    });
    
    await act(async () => {
      fireEvent.click(sendButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error processing your request/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows quick action chips', async () => {
    await act(async () => {
      renderWithTheme(<ChatPage />);
    });
    
    expect(screen.getByText('Suggest a workout')).toBeInTheDocument();
    expect(screen.getByText('Nutrition advice')).toBeInTheDocument();
    expect(screen.getByText('Progress check')).toBeInTheDocument();
    expect(screen.getByText('Meal suggestions')).toBeInTheDocument();
  });
}); 