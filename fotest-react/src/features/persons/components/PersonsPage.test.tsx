import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PersonsPage from './PersonsPage';

jest.mock('./SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <button onClick={() => onSearch('test')}>Search</button>
  ),
}));

jest.mock('./PersonList', () => ({
  __esModule: true,
  default: () => <div>Person List</div>,
}));

jest.mock('./PersonForm', () => ({
  __esModule: true,
  default: ({ onSave, onCancel }: { onSave: (person: unknown) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSave({ firstName: 'John', lastName: 'Doe' })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const defaultProps = {
  persons: [],
  loading: false,
  error: null,
  showForm: false,
  editingPerson: undefined,
  onAdd: jest.fn(),
  onSearch: jest.fn(),
  onSave: jest.fn(),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

test('renders person list and add button', () => {
  render(<PersonsPage {...defaultProps} />);

  expect(screen.getByText(/person list/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add new person/i })).toBeInTheDocument();
});

test('hides person list and shows spinner when loading', () => {
  render(<PersonsPage {...defaultProps} loading={true} />);

  expect(screen.queryByText(/person list/i)).not.toBeInTheDocument();
});

test('shows error alert when error is set', () => {
  render(<PersonsPage {...defaultProps} error="Failed to load" />);

  expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
});

test('shows form when showForm is true', () => {
  render(<PersonsPage {...defaultProps} showForm={true} />);

  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});

test('disables add button when form is shown', () => {
  render(<PersonsPage {...defaultProps} showForm={true} />);

  expect(screen.getByRole('button', { name: /add new person/i })).toBeDisabled();
});

test('calls onSearch when search is triggered', () => {
  const onSearch = jest.fn();
  render(<PersonsPage {...defaultProps} onSearch={onSearch} />);

  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith('test');
});

test('calls onAdd when add button is clicked', () => {
  const onAdd = jest.fn();
  render(<PersonsPage {...defaultProps} onAdd={onAdd} />);

  fireEvent.click(screen.getByRole('button', { name: /add new person/i }));

  expect(onAdd).toHaveBeenCalled();
});
