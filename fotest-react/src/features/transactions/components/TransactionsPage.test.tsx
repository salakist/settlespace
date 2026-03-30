import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionsPage from './TransactionsPage';

const mockHook = {
  editingTransaction: undefined,
  error: null,
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

test('renders list and loads transactions on mount', () => {
  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] }]}
      currentPersonId="p1"
      expireSession={jest.fn()}
    />,
  );

  expect(mockHook.loadTransactions).toHaveBeenCalled();
  expect(screen.getByText(/transaction list/i)).toBeInTheDocument();
});

test('forwards search and create actions', () => {
  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] }]}
      currentPersonId="p1"
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  fireEvent.click(screen.getByRole('button', { name: /add transaction/i }));

  expect(mockHook.handleSearch).toHaveBeenCalledWith('test');
  expect(mockHook.showCreateForm).toHaveBeenCalled();
});
