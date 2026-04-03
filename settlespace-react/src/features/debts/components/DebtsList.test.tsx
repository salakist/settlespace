import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebtSummary } from '../../../shared/types';
import DebtsList from './DebtsList';

const persons = [
  { id: 'p2', firstName: 'Alice', lastName: 'Walker', addresses: [], role: 'USER' as const },
  { id: 'p3', firstName: 'Bob', lastName: 'Stone', addresses: [], role: 'USER' as const },
  { id: 'p4', firstName: 'Cara', lastName: 'Lane', addresses: [], role: 'USER' as const },
];

const debts: DebtSummary[] = [
  {
    counterpartyPersonId: 'p2',
    currencyCode: 'EUR',
    netAmount: 18.5,
    direction: 'TheyOweYou',
    transactionCount: 2,
  },
  {
    counterpartyPersonId: 'p3',
    currencyCode: 'USD',
    netAmount: 42,
    direction: 'YouOweThem',
    transactionCount: 4,
  },
  {
    counterpartyPersonId: 'p4',
    currencyCode: 'GBP',
    netAmount: 0,
    direction: 'Settled',
    transactionCount: 1,
  },
];

test('shows an empty-state alert when there are no debts', () => {
  render(<DebtsList debts={[]} persons={persons} onSettle={jest.fn()} onViewDetails={jest.fn()} />);

  expect(screen.getByRole('alert')).toHaveTextContent(/no outstanding debts right now/i);
});

test('renders debt summaries, settlement actions, and details navigation', () => {
  const onSettle = jest.fn();
  const onViewDetails = jest.fn();

  render(<DebtsList debts={debts} persons={persons} onSettle={onSettle} onViewDetails={onViewDetails} />);

  expect(screen.getByText('Bob Stone')).toBeInTheDocument();
  expect(screen.getByText(/you owe Bob Stone/i)).toBeInTheDocument();
  expect(screen.getByText(/Alice Walker owes you/i)).toBeInTheDocument();
  expect(screen.getByText(/This balance with Cara Lane is settled/i)).toBeInTheDocument();

  expect(screen.getAllByText(/Currency:/i)).toHaveLength(3);
  expect(screen.getAllByText(/Transactions:/i)).toHaveLength(3);

  fireEvent.click(screen.getAllByRole('button', { name: /^settle now$/i })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /^settle now$/i })[1]);
  fireEvent.click(screen.getAllByRole('button', { name: /^details$/i })[0]);

  expect(onSettle).toHaveBeenNthCalledWith(1, debts[1]);
  expect(onSettle).toHaveBeenNthCalledWith(2, debts[0]);
  expect(onViewDetails).toHaveBeenCalledWith(debts[1]);
  expect(screen.getByRole('button', { name: /^settled$/i })).toBeDisabled();
});
