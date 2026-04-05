import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebtDirection, DebtSummary } from '../../../shared/types';
import DebtsPage from './DebtsPage';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(''), mockSetSearchParams],
}));

jest.mock('../../persons/components/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch, placeholder }: { onSearch: (query: string) => void; placeholder?: string }) => (
    <div>
      <input aria-label="Debt search" placeholder={placeholder} readOnly />
      <button onClick={() => onSearch('Jane Doe')}>Search debts</button>
    </div>
  ),
}));

const mockSampleDebt: DebtSummary = {
  counterpartyPersonId: 'p2',
  counterpartyDisplayName: 'Jane Doe',
  currencyCode: 'EUR',
  netAmount: 42.5,
  direction: DebtDirection.YouOweThem,
  transactionCount: 3,
};

const mockSettledDebt: DebtSummary = {
  counterpartyPersonId: 'p3',
  counterpartyDisplayName: 'Sam Settled',
  currencyCode: 'USD',
  netAmount: 0,
  direction: DebtDirection.Settled,
  transactionCount: 2,
};

const mockHook = {
  debts: [mockSampleDebt],
  error: null as string | null,
  successMessage: null as string | null,
  loadDebts: jest.fn(),
  loading: false,
  detailsLoading: false,
  settlementSaving: false,
  settlementOpen: false,
  selectedDebt: undefined,
  selectedDebtDetail: undefined,
  openSettlementDrawer: jest.fn(),
  closeSettlementDrawer: jest.fn(),
  clearSuccessMessage: jest.fn(),
  submitSettlement: jest.fn(),
};

jest.mock('../hooks/useDebts', () => ({
  useDebts: () => mockHook,
}));

jest.mock('./DebtsList', () => ({
  __esModule: true,
  default: ({ onSettle, onViewDetails }: { onSettle: (debt: DebtSummary) => void; onViewDetails: (debt: DebtSummary) => void }) => (
    <div>
      <div>Debts List</div>
      <button onClick={() => onSettle(mockSampleDebt)}>Settle now</button>
      <button onClick={() => onViewDetails(mockSampleDebt)}>Details</button>
    </div>
  ),
}));

jest.mock('./DebtSettlementDrawer', () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div>Settlement Drawer</div> : null),
}));

test('renders debt list and loads debts on mount', () => {
  render(
    <DebtsPage
      expireSession={jest.fn()}
    />,
  );

  expect(mockHook.loadDebts).toHaveBeenCalled();
  expect(screen.getByText(/debts list/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/first or last name/i)).toBeInTheDocument();
});

test('forwards settlement, filtering, and details actions', () => {
  mockHook.error = 'Load failed';
  mockHook.successMessage = 'Settlement recorded successfully.';

  render(
    <DebtsPage
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search debts/i }));
  fireEvent.click(screen.getByRole('button', { name: /^settle now$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^details$/i }));

  expect(mockSetSearchParams).toHaveBeenCalled();
  expect(mockHook.openSettlementDrawer).toHaveBeenCalledWith(mockSampleDebt);
  expect(mockNavigate).toHaveBeenCalledWith('/debts/p2/EUR');
  expect(screen.getByText('Load failed')).toBeInTheDocument();
  expect(screen.getByText(/settlement recorded successfully/i)).toBeInTheDocument();

  mockHook.error = null;
  mockHook.successMessage = null;
});

test('shows an info alert when all visible debts are settled', () => {
  mockHook.debts = [mockSettledDebt];

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.getByText(/all visible debts are settled/i)).toBeInTheDocument();

  mockHook.debts = [mockSampleDebt];
});

test('shows loading spinner when loading is true', () => {
  mockHook.loading = true;

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  mockHook.loading = false;
});
