import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';

test('describes the main FoTest capabilities', () => {
  render(<HomePage displayName="Simon" />);

  expect(screen.getByText(/single place to manage the people you work with/i)).toBeInTheDocument();
  expect(screen.getByText(/people directory/i)).toBeInTheDocument();
  expect(screen.getByText(/transaction tracking/i)).toBeInTheDocument();
  expect(screen.getByText(/debt follow-up/i)).toBeInTheDocument();
});