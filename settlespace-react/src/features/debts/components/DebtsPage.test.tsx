import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebtSummary } from '../../../shared/types';
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

const sampleDebt: DebtSummary = {
  counterpartyPersonId: 'p2',
  currencyCode: 'EUR',
  netAmount: 42.5,
  direction: 'YouOweThem',
  transactionCount: 3,
};

const mockHook = {
  debts: [sampleDebt],
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
      <button onClick={() => onSettle(sampleDebt)}>Settle now</button>
      <button onClick={() => onViewDetails(sampleDebt)}>Details</button>
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
      persons={[{ id: 'p2', firstName: 'Jane', lastName: 'Doe', addresses: [], role: 'USER' }]}
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
      persons={[{ id: 'p2', firstName: 'Jane', lastName: 'Doe', addresses: [], role: 'USER' }]}
      expireSession={jest.fn()}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: /search debts/i }));
  fireEvent.click(screen.getByRole('button', { name: /^settle now$/i }));
  fireEvent.click(screen.getByRole('button', { name: /^details$/i }));

  expect(mockSetSearchParams).toHaveBeenCalled();
  expect(mockHook.openSettlementDrawer).toHaveBeenCalledWith(sampleDebt);
  expect(mockNavigate).toHaveBeenCalledWith('/debts/p2/EUR');
  expect(screen.getByText('Load failed')).toBeInTheDocument();
  expect(screen.getByText(/settlement recorded successfully/i)).toBeInTheDocument();

  mockHook.error = null;
  mockHook.successMessage = null;
});

test('shows loading spinner when loading is true', () => {
  mockHook.loading = true;

  render(<DebtsPage persons={[]} expireSession={jest.fn()} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  mockHook.loading = false;
});
