import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ChatPage from '../chat/page';
import theme from '../theme';
import { useAuth } from '../providers/AuthProvider';

// Mock the auth provider
jest.mock('../providers/AuthProvider', () => ({
  useAuth: jest.fn(),
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

describe('ChatPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    // Mock fetch for chatbot API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          response: 'This is a mock response from the AI coach.',
          context: 3
        }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat interface with welcome message', () => {
    renderWithTheme(<ChatPage />);
    
    expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument();
    expect(screen.getByText('Welcome! Ask me about your fitness goals.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask your coach anything...')).toBeInTheDocument();
  });

  it('allows user to type message in input field', () => {
    renderWithTheme(<ChatPage />);
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...') as HTMLTextAreaElement;
    const testMessage = 'What should I eat after my workout?';
    
    fireEvent.change(messageInput, { target: { value: testMessage } });
    expect(messageInput.value).toBe(testMessage);
  });

  it('disables send button when input is empty', () => {
    renderWithTheme(<ChatPage />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when input has text', () => {
    renderWithTheme(<ChatPage />);
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('sends message and displays response', async () => {
    renderWithTheme(<ChatPage />);
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    const testMessage = 'What should I eat after my workout?';
    
    fireEvent.change(messageInput, { target: { value: testMessage } });
    fireEvent.click(sendButton);
    
    // Check that input is cleared
    expect(messageInput).toHaveValue('');
    
    // Wait for response to appear
    await waitFor(() => {
      expect(screen.getByText(testMessage)).toBeInTheDocument();
      expect(screen.getByText('This is a mock response from the AI coach.')).toBeInTheDocument();
    });
    
    // Verify API was called
    expect(global.fetch).toHaveBeenCalledWith('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testMessage,
        userId: mockUser.userId,
      }),
    });
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'API Error' }),
      })
    ) as jest.Mock;

    renderWithTheme(<ChatPage />);
    
    const messageInput = screen.getByPlaceholderText('Ask your coach anything...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(messageInput, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });
}); 