import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TransactionStatus } from '../../../shared/types';
import TransactionList from './TransactionList';

const TEST_TRANSACTION_TEXT = {
  PAYER_NAME: 'John Doe',
  PAYEE_NAME: 'Jane Smith',
  MANAGER_NAME: 'Alex Taylor',
} as const;

test('renders empty state when there are no transactions', () => {
  render(
    <TransactionList
      transactions={[]}
      canManage={() => true}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );

  expect(screen.getByRole('alert')).toHaveTextContent(/no transactions found/i);
});

test('renders transactions, highlights managed rows, and calls edit/delete callbacks from a single menu', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(
    <TransactionList
      transactions={[
        {
          id: 't1',
          payerPersonId: 'p1',
          payeePersonId: 'p2',
          createdByPersonId: 'p3',
          amount: 20,
          currencyCode: 'EUR',
          transactionDateUtc: '2026-03-29T00:00:00Z',
          description: 'Dinner',
          payerDisplayName: TEST_TRANSACTION_TEXT.PAYER_NAME,
          payeeDisplayName: TEST_TRANSACTION_TEXT.PAYEE_NAME,
          createdByDisplayName: TEST_TRANSACTION_TEXT.MANAGER_NAME,
          status: TransactionStatus.Completed,
        },
      ]}
      currentPersonId="p3"
      canManage={() => true}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );

  expect(screen.getByText(/completed/i)).toBeInTheDocument();
  expect(screen.getByText(/managed/i)).toBeInTheDocument();
  expect(screen.getByText(new RegExp(`${TEST_TRANSACTION_TEXT.PAYER_NAME} paid ${TEST_TRANSACTION_TEXT.PAYEE_NAME}`, 'i'))).toBeInTheDocument();
  expect(screen.queryByText(new RegExp(`managed by ${TEST_TRANSACTION_TEXT.MANAGER_NAME}`, 'i'))).not.toBeInTheDocument();
  expect(screen.getByText('29/03/2026')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /open actions for dinner/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^edit$/i }));

  fireEvent.click(screen.getByRole('button', { name: /open actions for dinner/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^delete$/i }));

  expect(onEdit).toHaveBeenCalled();
  expect(onDelete).toHaveBeenCalledWith('t1');
});

test('shows who manages a transaction for other involved people when the creator is not payer or payee', () => {
  render(
    <TransactionList
      transactions={[
        {
          id: 't2',
          payerPersonId: 'p1',
          payeePersonId: 'p2',
          createdByPersonId: 'p3',
          amount: 42,
          currencyCode: 'EUR',
          transactionDateUtc: '2026-03-30T00:00:00Z',
          description: 'Taxi',
          payerDisplayName: TEST_TRANSACTION_TEXT.PAYER_NAME,
          payeeDisplayName: TEST_TRANSACTION_TEXT.PAYEE_NAME,
          createdByDisplayName: TEST_TRANSACTION_TEXT.MANAGER_NAME,
          status: TransactionStatus.Pending,
        },
      ]}
      currentPersonId="p1"
      canManage={() => false}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );

  expect(screen.getByText(new RegExp(`${TEST_TRANSACTION_TEXT.PAYER_NAME} paid ${TEST_TRANSACTION_TEXT.PAYEE_NAME}`, 'i'))).toBeInTheDocument();
  expect(screen.getByText(new RegExp(`managed by ${TEST_TRANSACTION_TEXT.MANAGER_NAME}`, 'i'))).toBeInTheDocument();
});

test('does not show the managed-by line when the creator is already the payer or payee', () => {
  render(
    <TransactionList
      transactions={[
        {
          id: 't3',
          payerPersonId: 'p1',
          payeePersonId: 'p2',
          createdByPersonId: 'p2',
          amount: 18,
          currencyCode: 'EUR',
          transactionDateUtc: '2026-03-31T00:00:00Z',
          description: 'Coffee',
          payerDisplayName: TEST_TRANSACTION_TEXT.PAYER_NAME,
          payeeDisplayName: TEST_TRANSACTION_TEXT.PAYEE_NAME,
          createdByDisplayName: TEST_TRANSACTION_TEXT.PAYEE_NAME,
          status: TransactionStatus.Completed,
        },
      ]}
      currentPersonId="p1"
      canManage={() => false}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />,
  );

  expect(screen.queryByText(new RegExp(`managed by ${TEST_TRANSACTION_TEXT.PAYEE_NAME}`, 'i'))).not.toBeInTheDocument();
});
