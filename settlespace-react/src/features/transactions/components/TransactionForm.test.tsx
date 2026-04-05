import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PersonRole, TransactionStatus } from '../../../shared/types';
import TransactionForm from './TransactionForm';
import {
  DEFAULT_TRANSACTION_TEST_PERSONS,
  TRANSACTION_TEST_TEXT,
  TRANSACTION_TEST_VALUES,
} from '../testConstants';

test('submits valid transaction data', () => {
  const onSave = jest.fn();
  const onCancel = jest.fn();

  render(
    <TransactionForm
      transaction={{
        payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
        payeePersonId: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
        amount: 10.5,
        currencyCode: 'EUR',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: TRANSACTION_TEST_TEXT.LUNCH,
        status: TransactionStatus.Completed,
      }}
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId={TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID}
      role={PersonRole.User}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );

  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '10.5' } });
  fireEvent.change(screen.getByLabelText(/currency/i), { target: { value: 'eur' } });
  fireEvent.change(screen.getByLabelText(/transaction date/i), { target: { value: '29/03/2026' } });
  fireEvent.change(screen.getByLabelText(/description/i), { target: { value: TRANSACTION_TEST_TEXT.LUNCH } });
  fireEvent.click(screen.getByRole('button', { name: /update/i }));

  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
    payeePersonId: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
    amount: 10.5,
    currencyCode: 'EUR',
    description: TRANSACTION_TEST_TEXT.LUNCH,
  }));
});

test('shows validation error when payer and payee are equal', () => {
  render(
    <TransactionForm
      transaction={{
        payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
        payeePersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
        amount: 10.5,
        currencyCode: 'EUR',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: TRANSACTION_TEST_TEXT.LUNCH,
        status: TransactionStatus.Completed,
      }}
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId="p1"
      role={PersonRole.User}
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /update/i }));

  expect(screen.getByText(/must be different/i)).toBeInTheDocument();
});

test('shows validation error when amount is invalid', () => {
  const onSave = jest.fn();
  render(
    <TransactionForm
      transaction={{
        payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
        payeePersonId: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
        amount: 0,
        currencyCode: 'EUR',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: TRANSACTION_TEST_TEXT.LUNCH,
        status: TransactionStatus.Completed,
      }}
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId="p1"
      role={PersonRole.User}
      onSave={onSave}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: /update/i }));

  expect(screen.getByText(/greater than zero/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test('shows validation error when currency code is invalid', () => {
  const onSave = jest.fn();
  render(
    <TransactionForm
      transaction={{
        payerPersonId: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
        payeePersonId: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
        amount: 10.5,
        currencyCode: 'EURO',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: TRANSACTION_TEST_TEXT.LUNCH,
        status: TransactionStatus.Completed,
      }}
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId="p1"
      role={PersonRole.User}
      onSave={onSave}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /update/i }));

  expect(screen.getByText(/3-letter uppercase/i)).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test('cancel button triggers onCancel callback', () => {
  const onCancel = jest.fn();
  render(
    <TransactionForm
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId="p1"
      role={PersonRole.User}
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
      persons={DEFAULT_TRANSACTION_TEST_PERSONS}
      currentPersonId="p1"
      role={PersonRole.User}
      onSave={jest.fn()}
      onCancel={jest.fn()}
    />,
  );

  fireEvent.mouseDown(screen.getByLabelText(/payer/i));
  fireEvent.click(screen.getByRole('option', { name: /jane smith/i }));
  fireEvent.mouseDown(screen.getByLabelText(/payee/i));
  fireEvent.click(screen.getByRole('option', { name: new RegExp(TRANSACTION_TEST_TEXT.ALICE_JOHNSON, 'i') }));

  expect(screen.getByRole('button', { name: /create/i })).toBeDisabled();
  expect(screen.getByText(/must be either the payer or the payee/i)).toBeInTheDocument();
});
