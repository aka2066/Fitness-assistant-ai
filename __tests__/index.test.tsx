import { render, screen, act, waitFor } from '@testing-library/react'
import Page from '../src/app/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the AuthProvider
jest.mock('../src/app/providers/AuthProvider', () => ({
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

describe('Home Page', () => {
  it('renders the main heading', async () => {
    await act(async () => {
      render(<Page />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Your AI-Powered Fitness Assistant')).toBeInTheDocument();
    });
  });

  it('renders navigation cards', async () => {
    await act(async () => {
      render(<Page />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Workouts')).toBeInTheDocument();
      expect(screen.getByText('Meals')).toBeInTheDocument();
      expect(screen.getByText('AI Chat')).toBeInTheDocument();
    });
  });
}); 

