import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonSearchBar from './PersonSearchBar';

test('submits a plain-text query through the shared search wrapper', async () => {
  const onSearch = jest.fn();

  render(<PersonSearchBar onSearch={onSearch} />);

  userEvent.type(screen.getByRole('combobox', { name: /search/i }), 'john');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith('john');
});

test('renders the existing persons placeholder and action content', () => {
  render(
    <PersonSearchBar onSearch={jest.fn()} action={<button>Create Person</button>} />,
  );

  expect(screen.getByPlaceholderText(/search by first or last name/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create person/i })).toBeInTheDocument();
});
