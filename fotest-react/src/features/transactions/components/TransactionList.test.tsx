import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionList from './TransactionList';

const persons = [
  { id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] },
  { id: 'p2', firstName: 'Jane', lastName: 'Smith', addresses: [] },
];

test('renders empty state when there are no transactions', () => {
  render(
    <TransactionList
      transactions={[]}
      persons={persons}
      canManage={() => true}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />, 
  );

  expect(screen.getByText(/no transactions found/i)).toBeInTheDocument();
});

test('renders transactions and calls edit/delete callbacks', () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  render(
    <TransactionList
      transactions={[
        {
          id: 't1',
          payerPersonId: 'p1',
          payeePersonId: 'p2',
          amount: 20,
          currencyCode: 'EUR',
          transactionDateUtc: '2026-03-29T00:00:00Z',
          description: 'Dinner',
          status: 'Completed',
        },
      ]}
      persons={persons}
      canManage={() => true}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /edit/i }));
  fireEvent.click(screen.getByRole('button', { name: /delete/i }));

  expect(onEdit).toHaveBeenCalled();
  expect(onDelete).toHaveBeenCalledWith('t1');
});
