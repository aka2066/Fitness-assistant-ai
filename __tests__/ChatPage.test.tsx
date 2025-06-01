import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '../src/app/chat/page';
import { useAuth } from '../src/app/providers/AuthProvider';

// Mock the authentication hook
jest.mock('../src/app/providers/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      response: 'This is a test AI response to your query about fitness.' 
    }),
  })
) as jest.Mock;

describe('ChatPage Component', () => {
  beforeEach(() => {
    // Mock the auth hook to return a user
    (useAuth as jest.Mock).mockReturnValue({
      user: { userId: 'test-user-id', username: 'testuser' },
      loading: false,
    });

    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders the chat interface correctly', () => {
    render(<ChatPage />);
    
    // Check if main elements are rendered
    expect(screen.getByText('AI Fitness Coach')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
  });

  it('displays welcome message when no chat history exists', () => {
    render(<ChatPage />);
    
    expect(screen.getByText('Welcome! Ask me about your fitness goals.')).toBeInTheDocument();
    expect(screen.getByText(/Try: "What should I eat after my workout?"/i)).toBeInTheDocument();
  });

  it('sends user message and displays AI response', async () => {
    render(<ChatPage />);
    
    // Type a message
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'What exercises are best for building core strength?' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendButton);
    
    // Check if API was called with correct parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chatbot',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'What exercises are best for building core strength?',
            userId: 'test-user-id',
          }),
        })
      );
    });
    
    // Check if user message is displayed
    await waitFor(() => {
      expect(screen.getByText('What exercises are best for building core strength?')).toBeInTheDocument();
    });
    
    // Check if AI response is displayed
    await waitFor(() => {
      expect(screen.getByText('This is a test AI response to your query about fitness.')).toBeInTheDocument();
    });
  });
});
