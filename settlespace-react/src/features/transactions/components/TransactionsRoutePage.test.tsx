import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PersonRole, TransactionStatus } from '../../../shared/types';
import TransactionsRoutePage from './TransactionsRoutePage';

const mockHandleSearch = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams('status=Completed'), mockSetSearchParams],
}));

jest.mock('../hooks/useTransactions', () => ({
  useTransactions: () => ({
    editingTransaction: undefined,
    error: null,
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleSearch: mockHandleSearch,
    loading: false,
    showCreateForm: jest.fn(),
    showForm: false,
    transactions: [],
  }),
}));

jest.mock('../../persons/hooks/usePersonDirectory', () => ({
  usePersonDirectory: () => ({
    error: null,
    loading: false,
    persons: [],
  }),
}));

jest.mock('./TransactionsPage', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (query: Record<string, unknown>) => void }) => (
    <button onClick={() => onSearch({ freeText: 'hello' })}>Search</button>
  ),
}));

beforeEach(() => {
  mockHandleSearch.mockClear();
  mockSetSearchParams.mockClear();
});

test('calls handleSearch with query parsed from initial URL params on mount', async () => {
  render(
    <TransactionsRoutePage
      currentPersonId="p1"
      role={PersonRole.User}
      expireSession={jest.fn()}
    />,
  );

  await waitFor(() =>
    expect(mockHandleSearch).toHaveBeenCalledWith(
      expect.objectContaining({ status: [TransactionStatus.Completed] }),
    ),
  );
});

test('calls setSearchParams with serialized query when onSearch fires', () => {
  render(
    <TransactionsRoutePage
      currentPersonId="p1"
      role={PersonRole.User}
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search/i }));

  expect(mockSetSearchParams).toHaveBeenCalledWith(expect.any(URLSearchParams));
  const calledWith = mockSetSearchParams.mock.calls.find(
    (call: unknown[]) => (call[0] as URLSearchParams).get('freeText') !== null,
  )?.[0] as URLSearchParams | undefined;
  expect(calledWith?.get('freeText')).toBe('hello');
});
