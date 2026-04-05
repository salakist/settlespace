import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DebtDirection } from '../types';
import DebtSettlementDrawer from './DebtSettlementDrawer';

const baseDetails = {
  counterpartyPersonId: 'p2',
  counterpartyDisplayName: 'Jane Doe',
  currencyCode: 'EUR',
  netAmount: 42.5,
  direction: DebtDirection.YouOweThem,
  transactionCount: 3,
  paidByCurrentPerson: 65,
  paidByCounterparty: 22.5,
  transactions: [],
};

test('shows payment wording and supports manual percent input for debts you owe', () => {
  render(
    <DebtSettlementDrawer
      open
      debt={baseDetails}
      details={baseDetails}
      loading={false}
      saving={false}
      onClose={jest.fn()}
      onSubmit={jest.fn().mockResolvedValue(undefined)}
    />,
  );

  const slider = screen.getByRole('slider', { name: /settlement amount percentage/i });
  const percentInput = screen.getByLabelText(/percent \(%\)/i);

  fireEvent.change(percentInput, {
    target: { value: '37' },
  });

  expect(slider).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(/you are paying/i);
  expect(screen.getByRole('alert')).toHaveTextContent(/37%/i);
  expect(screen.getByText(/paid by you:/i)).toBeInTheDocument();
  expect(screen.getByText(/paid by jane doe:/i)).toBeInTheDocument();
  expect(percentInput).toHaveValue(37);
  expect(screen.getByLabelText(/amount \(eur\)/i)).toHaveDisplayValue('15.73');
});

test('adapts wording, keeps affirmative action first, and submits settlement for debts they owe you', async () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);

  render(
    <DebtSettlementDrawer
      open
      debt={{ ...baseDetails, netAmount: 20, direction: DebtDirection.TheyOweYou }}
      details={{
        ...baseDetails,
        netAmount: 20,
        direction: DebtDirection.TheyOweYou,
        paidByCounterparty: 45,
      }}
      loading={false}
      saving={false}
      onClose={jest.fn()}
      onSubmit={onSubmit}
    />,
  );

  fireEvent.change(screen.getByLabelText(/amount \(eur\)/i), {
    target: { value: '10' },
  });

  expect(screen.getByRole('alert')).toHaveTextContent(/you are recording/i);
  expect(screen.getByRole('alert')).toHaveTextContent(/50%/i);
  expect(screen.getAllByRole('button').slice(-2).map((button) => button.textContent)).toEqual([
    'Record received payment',
    'Close',
  ]);

  fireEvent.click(screen.getByRole('button', { name: /record received payment/i }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({
    counterpartyPersonId: 'p2',
    amount: 10,
    currencyCode: 'EUR',
    description: undefined,
  }));
});
