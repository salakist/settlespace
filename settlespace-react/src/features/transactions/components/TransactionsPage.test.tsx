import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { APP_ROUTES } from '../../../app/constants';
import { PersonRole, Transaction, TransactionStatus } from '../../../shared/types';
import TransactionsPage from './TransactionsPage';
import {
  DEFAULT_TRANSACTION_TEST_PERSONS,
  TRANSACTION_PAGE_TEST_TEXT,
  TRANSACTION_TEST_VALUES,
  TRANSACTION_TEST_TEXT,
} from '../testConstants';

const DEFAULT_PERSONS = [DEFAULT_TRANSACTION_TEST_PERSONS[0]];
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const { APP_ROUTES } = jest.requireActual('../../../app/constants') as typeof import('../../../app/constants');

  return {
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: APP_ROUTES.TRANSACTIONS }),
    useParams: () => ({}),
  };
});

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

const defaultProps = {
  transactions: [] as Transaction[],
  persons: DEFAULT_PERSONS,
  loading: false,
  error: null as string | null,
  personsLoading: false,
  personsError: null as string | null,
  showForm: false,
  editingTransaction: undefined,
  currentPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
  role: PersonRole.User,
  initialQuery: {},
  listPath: APP_ROUTES.TRANSACTIONS,
  canUpdate: jest.fn(() => true),
  canDelete: jest.fn(() => true),
  canConfirm: jest.fn(() => false),
  canRefuse: jest.fn(() => false),
  onSearch: jest.fn(),
  onSave: jest.fn().mockResolvedValue(undefined),
  onCancel: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onConfirm: jest.fn(),
  onRefuse: jest.fn(),
  onAdd: jest.fn(),
};

beforeEach(() => {
  mockNavigate.mockClear();
});

test('renders transaction list', () => {
  render(<TransactionsPage {...defaultProps} />);

  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).toBeInTheDocument();
});

test('calls onSearch when search is triggered', () => {
  const onSearch = jest.fn();
  render(<TransactionsPage {...defaultProps} onSearch={onSearch} />);

  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(onSearch).toHaveBeenCalledWith({ freeText: 'test' });
});

test('calls onAdd and navigates to create route when Create Transaction is clicked', () => {
  const onAdd = jest.fn();
  render(<TransactionsPage {...defaultProps} onAdd={onAdd} />);

  fireEvent.click(screen.getByRole('button', { name: /create transaction/i }));

  expect(onAdd).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith(APP_ROUTES.TRANSACTION_CREATE);
});

test('shows loading spinner when loading is true and no transactions', () => {
  render(<TransactionsPage {...defaultProps} loading={true} persons={[]} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).not.toBeInTheDocument();
});

test('shows progress bar with list when re-searching with existing transactions', () => {
  render(
    <TransactionsPage
      {...defaultProps}
      loading={true}
      transactions={[{ id: 'tx-1' }] as unknown as Transaction[]}
      persons={[]}
    />,
  );

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).toBeInTheDocument();
});

test('shows error alert when error is set', () => {
  render(<TransactionsPage {...defaultProps} error={TRANSACTION_PAGE_TEST_TEXT.GENERIC_ERROR} />);

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.GENERIC_ERROR)).toBeInTheDocument();
});

test('renders only the transaction form when showForm is true', () => {
  render(<TransactionsPage {...defaultProps} showForm={true} />);

  expect(screen.getByText(TRANSACTION_PAGE_TEST_TEXT.FORM_TITLE)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /create transaction/i })).not.toBeInTheDocument();
  expect(screen.queryByText(TRANSACTION_PAGE_TEST_TEXT.LIST_TITLE)).not.toBeInTheDocument();
});

test('saves the form and navigates to listPath', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  render(
    <TransactionsPage
      {...defaultProps}
      showForm={true}
      onSave={onSave}
      listPath="/transactions?status=Completed"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /save transaction/i }));

  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(mockNavigate).toHaveBeenCalledWith('/transactions?status=Completed');
});

test('cancels the form and navigates to listPath', () => {
  const onCancel = jest.fn();
  render(
    <TransactionsPage
      {...defaultProps}
      showForm={true}
      onCancel={onCancel}
      listPath="/transactions?status=Completed"
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /cancel transaction/i }));

  expect(onCancel).toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('/transactions?status=Completed');
});

test('confirms deletion in a modal before calling onDelete', () => {
  const onDelete = jest.fn();
  render(
    <TransactionsPage
      {...defaultProps}
      transactions={[{
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 18,
        currencyCode: 'EUR',
        transactionDateUtc: '2026-03-29T00:00:00Z',
        description: TRANSACTION_TEST_TEXT.DINNER,
        status: TransactionStatus.Completed,
      }] as Transaction[]}
      onDelete={onDelete}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /delete transaction/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Delete', 'Cancel']);

  fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));
  expect(onDelete).toHaveBeenCalledWith('tx-1');
});
