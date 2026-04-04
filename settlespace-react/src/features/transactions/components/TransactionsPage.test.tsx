import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TransactionsPage from './TransactionsPage';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/transactions' }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
}));

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
  transactions: [] as Array<Record<string, unknown>>,
};

jest.mock('../hooks/useTransactions', () => ({
  useTransactions: () => mockHook,
}));

jest.mock('./TransactionSearchBar', () => ({
  __esModule: true,
  default: ({ onSearch, action }: { onSearch: (query: Record<string, unknown>) => void; action?: React.ReactNode }) => (
    <>
      <button onClick={() => onSearch({ freeText: 'test' })}>Search</button>
      {action}
    </>
  ),
}));

jest.mock('./TransactionList', () => ({
  __esModule: true,
  default: ({ onDelete }: { onDelete: (id: string) => void }) => (
    <div>
      <div>Transaction List</div>
      <button onClick={() => onDelete('tx-1')}>Delete Transaction</button>
    </div>
  ),
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
  fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

  expect(mockSetSearchParams).toHaveBeenCalled();
  expect(mockHook.showCreateForm).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/transactions/new');
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

test('renders only the transaction form when showForm is true', () => {
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
  expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /add transaction/i })).not.toBeInTheDocument();
  expect(screen.queryByText('Transaction List')).not.toBeInTheDocument();
  mockHook.showForm = false;
});

test('confirms deletion in a modal before calling handleDelete', () => {
  mockHook.transactions = [{
    id: 'tx-1',
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 18,
    currencyCode: 'EUR',
    transactionDateUtc: '2026-03-29T00:00:00Z',
    description: 'Dinner',
    status: 'Completed',
  }];

  render(
    <TransactionsPage
      persons={[{ id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' }]}
      currentPersonId="p1"
      role="USER"
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /delete transaction/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Delete', 'Cancel']);

  fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
  expect(mockHook.handleDelete).toHaveBeenCalledWith('tx-1');

  mockHook.transactions = [];
});
