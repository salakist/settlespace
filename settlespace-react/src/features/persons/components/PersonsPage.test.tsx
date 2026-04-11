import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PersonRole } from '../../../shared/types';
import PersonsPage from './PersonsPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/persons' }),
  useParams: () => ({}),
}));

jest.mock('./PersonSearchBar', () => ({
  __esModule: true,
  default: ({ onSearch, action }: { onSearch: (query: { freeText?: string }) => void; action?: React.ReactNode }) => (
    <>
      <button onClick={() => onSearch({ freeText: 'test' })}>Search</button>
      {action}
    </>
  ),
}));

jest.mock('./PersonList', () => ({
  __esModule: true,
  default: ({
    onDelete,
    onEdit,
    onViewTransactions,
    onViewDebts,
  }: {
    onDelete: (id: string) => void;
    onEdit: (person: { id?: string; firstName: string; lastName: string; addresses: [] }) => void;
    onViewTransactions: (person: { id?: string; firstName: string; lastName: string; addresses: [] }) => void;
    onViewDebts: (person: { id?: string; firstName: string; lastName: string; addresses: [] }) => void;
  }) => (
    <div>
      <div>Person List</div>
      <button onClick={() => onDelete('p1')}>Delete Person</button>
      <button onClick={() => onEdit({ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] })}>Edit Person</button>
      <button onClick={() => onViewTransactions({ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] })}>
        View Transactions
      </button>
      <button onClick={() => onViewTransactions({ firstName: 'No', lastName: 'Id', addresses: [] })}>
        View Transactions Without Id
      </button>
      <button onClick={() => onViewDebts({ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] })}>
        View Debts
      </button>
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
  defaultCreateRole: PersonRole.User,
  onAdd: jest.fn(),
  onSearch: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
};

beforeEach(() => {
  mockNavigate.mockClear();
});

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

  expect(onSearch).toHaveBeenCalledWith({ freeText: 'test' });
});

test('calls onAdd when create button is clicked', () => {
  const onAdd = jest.fn();
  render(<PersonsPage {...defaultProps} onAdd={onAdd} />);

  fireEvent.click(screen.getByRole('button', { name: /create person/i }));

  expect(onAdd).toHaveBeenCalled();
});

test('navigates to transactions with the involved person filter', () => {
  render(<PersonsPage {...defaultProps} />);

  fireEvent.click(screen.getByRole('button', { name: /^view transactions$/i }));

  expect(mockNavigate).toHaveBeenCalledWith('/transactions?involved=p1');
});

test('falls back to freeText when viewing transactions for a person without an id', () => {
  render(<PersonsPage {...defaultProps} />);

  fireEvent.click(screen.getByRole('button', { name: /view transactions without id/i }));

  expect(mockNavigate).toHaveBeenCalledWith('/transactions?freeText=No+Id');
});

test('calls onEdit and navigates to the edit route', () => {
  const onEdit = jest.fn();
  render(<PersonsPage {...defaultProps} onEdit={onEdit} />);

  fireEvent.click(screen.getByRole('button', { name: /edit person/i }));

  expect(onEdit).toHaveBeenCalledWith({ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] });
  expect(mockNavigate).toHaveBeenCalledWith('/persons/p1/edit');
});

test('navigates to debts using the person name search query', () => {
  render(<PersonsPage {...defaultProps} />);

  fireEvent.click(screen.getByRole('button', { name: /view debts/i }));

  expect(mockNavigate).toHaveBeenCalledWith('/debts?search=John%20Doe');
});

test('saving the form returns to the persons list', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(<PersonsPage {...defaultProps} showForm={true} onSave={onSave} />);

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => expect(onSave).toHaveBeenCalled());
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/persons'));
});

test('cancelling the form returns to the persons list', () => {
  const onCancel = jest.fn();
  render(<PersonsPage {...defaultProps} showForm={true} onCancel={onCancel} />);

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

  expect(onCancel).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/persons');
});

test('confirms deletion in a modal before calling onDelete', () => {
  const onDelete = jest.fn();
  render(
    <PersonsPage
      {...defaultProps}
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: PersonRole.User }]}
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
