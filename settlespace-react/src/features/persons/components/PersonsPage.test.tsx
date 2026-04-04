import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PersonsPage from './PersonsPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/persons' }),
  useParams: () => ({}),
}));

jest.mock('./SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch, action }: { onSearch: (query: string) => void; action?: React.ReactNode }) => (
    <>
      <button onClick={() => onSearch('test')}>Search</button>
      {action}
    </>
  ),
}));

jest.mock('./PersonList', () => ({
  __esModule: true,
  default: ({ onDelete }: { onDelete: (id: string) => void }) => (
    <div>
      <div>Person List</div>
      <button onClick={() => onDelete('p1')}>Delete Person</button>
    </div>
  ),
}));

jest.mock('./PersonForm', () => ({
  __esModule: true,
  default: ({ onSave, onCancel }: { onSave: (person: unknown) => Promise<void>; onCancel: () => void }) => (
    <div>
      <button onClick={() => void onSave({ firstName: 'John', lastName: 'Doe', addresses: [] })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const defaultProps = {
  persons: [],
  loading: false,
  saveLoading: false,
  error: null,
  showForm: false,
  editingPerson: undefined,
  canCreate: true,
  canEdit: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canEditRole: true,
  defaultCreateRole: 'USER' as const,
  onAdd: jest.fn(),
  onSearch: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

test('renders person list and create button', () => {
  render(<PersonsPage {...defaultProps} />);

  expect(screen.getByText(/person list/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /create person/i })).toBeInTheDocument();
});

test('hides person list and shows spinner when loading', () => {
  render(<PersonsPage {...defaultProps} loading={true} />);

  expect(screen.queryByText(/person list/i)).not.toBeInTheDocument();
});

test('shows error alert when error is set', () => {
  render(<PersonsPage {...defaultProps} error="Failed to load" />);

  expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
});

test('shows only the form when showForm is true', () => {
  render(<PersonsPage {...defaultProps} showForm={true} />);

  expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /add new person/i })).not.toBeInTheDocument();
});

test('hides person list when form is shown', () => {
  render(<PersonsPage {...defaultProps} showForm={true} />);

  expect(screen.queryByText(/person list/i)).not.toBeInTheDocument();
});


test('calls onSearch when search is triggered', () => {
  const onSearch = jest.fn();
  render(<PersonsPage {...defaultProps} onSearch={onSearch} />);

  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith('test');
});

test('calls onAdd when create button is clicked', () => {
  const onAdd = jest.fn();
  render(<PersonsPage {...defaultProps} onAdd={onAdd} />);

  fireEvent.click(screen.getByRole('button', { name: /create person/i }));

  expect(onAdd).toHaveBeenCalled();
});

test('confirms deletion in a modal before calling onDelete', () => {
  const onDelete = jest.fn();
  render(
    <PersonsPage
      {...defaultProps}
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' }]}
      onDelete={onDelete}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /delete person/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Delete', 'Cancel']);

  fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
  expect(onDelete).toHaveBeenCalledWith('p1');
});
