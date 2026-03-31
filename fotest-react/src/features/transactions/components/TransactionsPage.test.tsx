import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionsPage from './TransactionsPage';

const mockHook = {
  editingTransaction: undefined,
  error: null as string | null,
  handleCancel: jest.fn(),
  handleDelete: jest.fn(),
  handleEdit: jest.fn(),
  handleSave: jest.fn(),
  handleSearch: jest.fn(),
  loadTransactions: jest.fn(),
  loading: false,
  showCreateForm: jest.fn(),
  showForm: false,
  transactions: [],
};

jest.mock('../hooks/useTransactions', () => ({
  useTransactions: () => mockHook,
}));

jest.mock('../../persons/components/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <button onClick={() => onSearch('test')}>Search</button>
  ),
}));

jest.mock('./TransactionList', () => ({
  __esModule: true,
  default: () => <div>Transaction List</div>,
}));

jest.mock('./TransactionForm', () => ({
  __esModule: true,
  default: () => <div>Transaction Form</div>,
}));

test('renders list and loads transactions on mount', () => {
  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' }]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  expect(mockHook.loadTransactions).toHaveBeenCalled();
  expect(screen.getByText(/transaction list/i)).toBeInTheDocument();
});

test('forwards search and create actions', () => {
  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' }]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

  expect(mockHook.handleSearch).toHaveBeenCalledWith('test');
  expect(mockHook.showCreateForm).toHaveBeenCalled();
});

test('shows loading spinner when loading is true', () => {
  mockHook.loading = true;

  render(
    <TransactionsPage
      persons={[]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  mockHook.loading = false;
});

test('shows error alert when error is set', () => {
  mockHook.error = 'Something went wrong';

  render(
    <TransactionsPage
      persons={[]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  mockHook.error = null;
});

test('renders transaction form when showForm is true', () => {
  mockHook.showForm = true;

  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' }]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  expect(screen.getByText('Transaction Form')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add transaction/i })).toBeDisabled();
  mockHook.showForm = false;
});
