import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TransactionForm from './TransactionForm';

const persons = [
  { id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [] },
  { id: 'p2', firstName: 'Jane', lastName: 'Smith', addresses: [] },
  { id: 'p3', firstName: 'Alex', lastName: 'Taylor', addresses: [] },
];
const TX_DATE = '2026-03-29T00:00:00Z';
const STATUS_COMPLETED = 'Completed' as const;

test('submits valid transaction data', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  render(
    <TransactionForm
      transaction={{
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 10.5,
        currencyCode: 'EUR',
        transactionDateUtc: TX_DATE,
        description: 'Lunch',
        status: STATUS_COMPLETED,
      }}
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={onSave}
      onCancel={onCancel}
    />,
  );

  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10.5' } });
  fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'eur' } });
  fireEvent.change(screen.getByLabelText(/transaction date/i), { target: { value: '2026-03-29' } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Lunch' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 10.5,
    currencyCode: 'EUR',
    description: 'Lunch',
  }));
});

test('shows validation error when payer and payee are equal', () => {
  render(
    <TransactionForm
      transaction={{
        payerPersonId: 'p1',
        payeePersonId: 'p1',
        amount: 10.5,
        currencyCode: 'EUR',
        transactionDateUtc: TX_DATE,
        description: 'Lunch',
        status: STATUS_COMPLETED,
      }}
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText(/must be different/i)).toBeInTheDocument();
});

test('shows validation error when amount is invalid', () => {
  const onSave = jest.fn();
  render(
    <TransactionForm
      transaction={{
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 0,
        currencyCode: 'EUR',
        transactionDateUtc: TX_DATE,
        description: 'Lunch',
        status: STATUS_COMPLETED,
      }}
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={onSave}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText(/greater than zero/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test('shows validation error when currency code is invalid', () => {
  const onSave = jest.fn();
  render(
    <TransactionForm
      transaction={{
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 10.5,
        currencyCode: 'EURO',
        transactionDateUtc: TX_DATE,
        description: 'Lunch',
        status: STATUS_COMPLETED,
      }}
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={onSave}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText(/3-letter uppercase/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test('cancel button triggers onCancel callback', () => {
  const onCancel = jest.fn();
  render(
    <TransactionForm
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={jest.fn()}
      onCancel={onCancel}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(onCancel).toHaveBeenCalled();
});

test('disables save when creating and current user is not payer or payee', () => {
  render(
    <TransactionForm
      persons={persons}
      currentPersonId="p1"
      role="USER"
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.mouseDown(screen.getByLabelText(/payer/i));
  fireEvent.click(screen.getByRole('option', { name: /jane smith/i }));
  fireEvent.mouseDown(screen.getByLabelText(/payee/i));
  fireEvent.click(screen.getByRole('option', { name: /alex taylor/i }));

  expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  expect(screen.getByText(/must be either the payer or the payee/i)).toBeInTheDocument();
});
