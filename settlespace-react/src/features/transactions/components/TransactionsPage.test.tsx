import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { APP_ROUTES } from '../../../app/constants';
import { PersonRole, TransactionStatus } from '../../../shared/types';
import TransactionsPage from './TransactionsPage';
import {
  DEFAULT_TRANSACTION_TEST_PERSONS,
  TRANSACTION_PAGE_TEST_TEXT,
  TRANSACTION_TEST_VALUES,
} from '../testConstants';

const DEFAULT_PERSONS = [DEFAULT_TRANSACTION_TEST_PERSONS[0]];
const mockNavigate = jest.fn();
const renderTransactionsPage = (persons = DEFAULT_PERSONS) => render(
  <TransactionsPage
    persons={persons}
    currentPersonId={TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID}
    role={PersonRole.User}
    expireSession={jest.fn()}
  />,
);
const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => {
  const { APP_ROUTES } = jest.requireActual('../../../app/constants') as typeof import('../../../app/constants');

  return {
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: APP_ROUTES.TRANSACTIONS }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
  };
});

const mockHook = {
  editingTransaction: undefined,
  error: null as string | null,
  handleCancel: jest.fn(),
  handleDelete: jest.fn(),
  handleEdit: jest.fn(),
  handleSave: jest.fn(),
  handleSearch: jest.fn(),
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

jest.mock('./TransactionList', () => {
  const { TRANSACTION_PAGE_TEST_TEXT } = jest.requireActual('../testConstants') as typeof import('../testConstants');

  return {
    __esModule: true,
    default: ({ onDelete }: { onDelete: (id: string) => void }) => (
      <div>
        <div>{TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE}</div>
        <button onClick={() => onDelete('tx-1')}>Delete Transaction</button>
      </div>
    ),
  };
});

jest.mock('./TransactionForm', () => {
  const { TRANSACTION_PAGE_TEST_TEXT, TRANSACTION_TEST_TEXT, TRANSACTION_TEST_VALUES } = jest.requireActual('../testConstants') as typeof import('../testConstants');
  const { TransactionStatus } = jest.requireActual('../../../shared/types') as typeof import('../../../shared/types');

  return {
    __esModule: true,
    default: ({ onSave, onCancel }: { onSave: (transaction: unknown) => Promise<void>; onCancel: () => void }) => (
      <div>
        <div>{TRANSACTION_PAGE_TEST_TEXT.FORM_TITLE}</div>
        <button
          onClick={() => void onSave({
            payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
            payeePersonId: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
            amount: 18,
            currencyCode: 'EUR',
            transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
            description: TRANSACTION_TEST_TEXT.DINNER,
            status: TransactionStatus.Completed,
          })}
        >
          Save Transaction
        </button>
        <button onClick={onCancel}>Cancel Transaction</button>
      </div>
    ),
  };
});

test('renders list and loads transactions on mount', () => {
  renderTransactionsPage();

  expect(mockHook.handleSearch).toHaveBeenCalledWith({});
  expect(screen.getByText(/transaction list/i)).toBeInTheDocument();
});

test('forwards search and create actions', () => {
  renderTransactionsPage();

  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

  expect(mockSetSearchParams).toHaveBeenCalled();
  expect(mockHook.showCreateForm).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.TRANSACTION_CREATE);
});

test('shows loading spinner when loading is true', () => {
  mockHook.loading = true;

  renderTransactionsPage([]);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).not.toBeInTheDocument();
  mockHook.loading = false;
});

test('shows progress bar with list when re-searching with existing data', () => {
  mockHook.loading = true;
  mockHook.transactions = [{ id: 'tx-1' }];

  renderTransactionsPage([]);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).toBeInTheDocument();
  mockHook.loading = false;
  mockHook.transactions = [];
});

test('shows error alert when error is set', () => {
  mockHook.error = TRANSACTION_PAGE_TEST_TEXT.GENERIC_ERROR;

  renderTransactionsPage([]);

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  mockHook.error = null;
});

test('renders only the transaction form when showForm is true', () => {
  mockHook.showForm = true;

  renderTransactionsPage();

  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.FORM_TITLE)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /add transaction/i })).not.toBeInTheDocument();
  expect(screen.queryByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).not.toBeInTheDocument();
  mockHook.showForm = false;
});

test('saves the form and returns to the list route', async () => {
  mockHook.showForm = true;

  renderTransactionsPage();

  fireEvent.click(screen.getByRole('button', { name: /save transaction/i }));

  await waitFor(() => expect(mockHook.handleSave).toHaveBeenCalled());
  expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.TRANSACTIONS);
  mockHook.showForm = false;
});

test('cancels the form and returns to the list route', () => {
  mockHook.showForm = true;

  renderTransactionsPage();

  fireEvent.click(screen.getByRole('button', { name: /cancel transaction/i }));

  expect(mockHook.handleCancel).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.TRANSACTIONS);
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
    status: TransactionStatus.Completed,
  }];

  renderTransactionsPage();

  fireEvent.click(screen.getByRole('button', { name: /delete transaction/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Delete', 'Cancel']);

  fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
  expect(mockHook.handleDelete).toHaveBeenCalledWith('tx-1');

  mockHook.transactions = [];
});
