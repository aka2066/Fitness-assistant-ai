import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Mock Amplify configuration
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

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

export const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

export const mockUser = {
  userId: 'test-user-123',
  username: 'testuser',
  attributes: {
    email: 'test@example.com',
  },
};

export { theme }; 