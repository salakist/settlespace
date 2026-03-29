import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form when unauthenticated', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});
