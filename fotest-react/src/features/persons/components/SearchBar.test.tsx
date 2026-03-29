import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SearchBar from './SearchBar';

test('submits search query', () => {
  const onSearch = jest.fn();
  render(<SearchBar onSearch={onSearch} />);

  fireEvent.change(screen.getByPlaceholderText(/Search by first or last name/i), { target: { value: 'john' } });
  fireEvent.submit(screen.getByRole('button', { name: /Search/i }));

  expect(onSearch).toHaveBeenCalledWith('john');
});
