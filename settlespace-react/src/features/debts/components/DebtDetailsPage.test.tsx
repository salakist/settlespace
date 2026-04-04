import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DebtDetailsPage from './DebtDetailsPage';

const mockNavigate = jest.fn();
const mockHook = {
  clearSuccessMessage: jest.fn(),
  closeSettlementDrawer: jest.fn(),
  detailsLoading: false,
  error: null as string | null,
  loadDebtDetails: jest.fn(),
  openSettlementDrawer: jest.fn(),
  selectedDebt: undefined,
  selectedDebtDetail: undefined,
  settlementOpen: false,
  settlementSaving: false,
  submitSettlement: jest.fn(),
  successMessage: null as string | null,
};

jest.mock('react-router-dom', () => ({
  Navigate: () => null,
  useNavigate: () => mockNavigate,
  useParams: () => ({ counterpartyPersonId: 'p2', currencyCode: 'EUR' }),
}));

jest.mock('../hooks/useDebts', () => ({
  useDebts: () => mockHook,
}));

jest.mock('./DebtSettlementDrawer', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div>Settlement Drawer</div> : null),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockHook.loadDebtDetails.mockResolvedValue({
    counterpartyPersonId: 'p2',
    currencyCode: 'EUR',
    netAmount: 42.5,
    direction: 'YouOweThem',
    transactionCount: 2,
    paidByCurrentPerson: 65,
    paidByCounterparty: 22.5,
    transactions: [
      {
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 20,
        currencyCode: 'EUR',
        transactionDateUtc: '2026-04-01T12:00:00Z',
        description: 'Dinner',
        category: 'Food',
        status: 'Completed',
      },
      {
        id: 'tx-2',
        payerPersonId: 'p2',
        payeePersonId: 'p1',
        amount: 12.5,
        currencyCode: 'EUR',
        transactionDateUtc: '2026-03-28T18:30:00Z',
        description: 'Taxi',
        category: 'Travel',
        status: 'Completed',
      },
    ],
  });
});

test('loads and renders debt details with underlying transactions', async () => {
  render(
    <DebtDetailsPage
      persons={[
        { id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' },
        { id: 'p2', firstName: 'Jane', lastName: 'Doe', addresses: [], role: 'USER' },
      ]}
      expireSession={jest.fn()}
    />,
  );

  await waitFor(() => expect(mockHook.loadDebtDetails).toHaveBeenCalledWith('p2', 'EUR'));
  expect(await screen.findByText(/Dinner/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
  expect(await screen.findByText(/Taxi/i)).toBeInTheDocument();
  expect(screen.getByText(/completed transactions:/i)).toBeInTheDocument();
});

test('supports opening settlement from the details page', async () => {
  render(
    <DebtDetailsPage
      persons={[
        { id: 'p1', firstName: 'John', lastName: 'Doe', addresses: [], role: 'USER' },
        { id: 'p2', firstName: 'Jane', lastName: 'Doe', addresses: [], role: 'USER' },
      ]}
      expireSession={jest.fn()}
    />,
  );

  await screen.findByText(/Dinner/i);

  fireEvent.click(screen.getByRole('button', { name: /^settle now$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^back$/i }));

  expect(mockHook.openSettlementDrawer).toHaveBeenCalledWith(expect.objectContaining({
    counterpartyPersonId: 'p2',
    currencyCode: 'EUR',
    netAmount: 42.5,
  }));
  expect(mockNavigate).toHaveBeenCalledWith('/debts');
});
