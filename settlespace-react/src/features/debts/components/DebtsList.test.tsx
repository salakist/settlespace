import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebtSummary } from '../../../shared/types';
import DebtsList from './DebtsList';

const debts: DebtSummary[] = [
  {
    counterpartyPersonId: 'p2',
    currencyCode: 'EUR',
    netAmount: 18.5,
    direction: 'TheyOweYou',
    transactionCount: 2,
    counterpartyDisplayName: 'Alice Walker',
  },
  {
    counterpartyPersonId: 'p3',
    currencyCode: 'USD',
    netAmount: 42,
    direction: 'YouOweThem',
    transactionCount: 4,
    counterpartyDisplayName: 'Bob Stone',
  },
  {
    counterpartyPersonId: 'p4',
    currencyCode: 'GBP',
    netAmount: 0,
    direction: 'Settled',
    transactionCount: 1,
    counterpartyDisplayName: 'Cara Lane',
  },
];

test('shows an empty-state alert when there are no debts', () => {
  render(<DebtsList debts={[]} onSettle={jest.fn()} onViewDetails={jest.fn()} />);

  expect(screen.getByRole('alert')).toHaveTextContent(/no outstanding debts right now/i);
});

test('renders concise debt summaries and exposes actions from a menu', () => {
  const onSettle = jest.fn();
  const onViewDetails = jest.fn();

  render(<DebtsList debts={debts} onSettle={onSettle} onViewDetails={onViewDetails} />);

  expect(screen.getByText('Bob Stone')).toBeInTheDocument();
  expect(screen.getByText(/you owe them/i)).toBeInTheDocument();
  expect(screen.getByText(/they owe you/i)).toBeInTheDocument();
  expect(screen.queryByText(/you owe Bob Stone/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Alice Walker owes you/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/This balance with Cara Lane is settled/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Currency:/i)).not.toBeInTheDocument();
  expect(screen.getByText(/4 transactions/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /open actions for bob stone/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^settle now$/i }));

  fireEvent.click(screen.getByRole('button', { name: /open actions for bob stone/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^details$/i }));

  fireEvent.click(screen.getByRole('button', { name: /open actions for cara lane/i }));
  expect(screen.getByRole('menuitem', { name: /^settled$/i })).toHaveAttribute('aria-disabled', 'true');

  expect(onSettle).toHaveBeenCalledWith(debts[1]);
  expect(onViewDetails).toHaveBeenCalledWith(debts[1]);
});
