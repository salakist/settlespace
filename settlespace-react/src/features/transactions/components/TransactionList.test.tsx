import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionList from './TransactionList';

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
          payerDisplayName: 'John Doe',
          payeeDisplayName: 'Jane Smith',
          createdByDisplayName: 'Alex Taylor',
          status: 'Completed',
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
  expect(screen.getByText(/John Doe paid Jane Smith/i)).toBeInTheDocument();
  expect(screen.getByText('29/03/2026')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /open actions for dinner/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^edit$/i }));

  fireEvent.click(screen.getByRole('button', { name: /open actions for dinner/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^delete$/i }));

  expect(onEdit).toHaveBeenCalled();
  expect(onDelete).toHaveBeenCalledWith('t1');
});
