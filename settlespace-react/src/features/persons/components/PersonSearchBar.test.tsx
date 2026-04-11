import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonSearchBar from './PersonSearchBar';

test('submits a plain-text query through the shared search wrapper', async () => {
  const onSearch = jest.fn();

  render(<PersonSearchBar onSearch={onSearch} />);

  await userEvent.type(screen.getByRole('combobox', { name: /search/i }), 'john');
  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({ freeText: 'john' });
});

test('shows the filter button once structured person parameters are available', () => {
  render(<PersonSearchBar onSearch={jest.fn()} />);

  expect(screen.getByRole('button', { name: /show filters/i })).toBeInTheDocument();
});

test('renders the transaction-style persons placeholder and action content', () => {
  render(
    <PersonSearchBar onSearch={jest.fn()} action={<button>Create Person</button>} />,
  );

  expect(screen.getByPlaceholderText(/search or filter people/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create person/i })).toBeInTheDocument();
});

test('renders a custom placeholder when provided', () => {
  render(<PersonSearchBar onSearch={jest.fn()} placeholder="Search transactions or people" />);

  expect(screen.getByPlaceholderText(/search transactions or people/i)).toBeInTheDocument();
});
