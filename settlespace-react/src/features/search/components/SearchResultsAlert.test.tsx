import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchResultsAlert from './SearchResultsAlert';

test('renders the unified no-results wording for an entity name', () => {
  render(<SearchResultsAlert entityName="transactions" />);

  expect(screen.getByRole('alert')).toHaveTextContent('No transactions found.');
});
