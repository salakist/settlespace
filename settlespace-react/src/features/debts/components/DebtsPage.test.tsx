import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DEBT_SEARCH_TEXT } from '../constants';
import { DebtDirection, DebtSummary } from '../types';
import DebtsPage from './DebtsPage';

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams('');

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

jest.mock('./DebtSearchBar', () => {
  const { DEBT_SEARCH_TEXT } = jest.requireActual('../constants') as typeof import('../constants');
  const { DebtDirection } = jest.requireActual('../types') as typeof import('../types');

  return {
    __esModule: true,
    default: ({ onSearch }: { onSearch: (query: { freeText?: string; direction?: string }) => void }) => (
      <div>
        <input aria-label={DEBT_SEARCH_TEXT.ARIA_LABEL} placeholder={DEBT_SEARCH_TEXT.DEFAULT_PLACEHOLDER} readOnly />
        <button onClick={() => onSearch({ freeText: 'Jane Doe', direction: DebtDirection.YouOweThem })}>Search debts</button>
      </div>
    ),
  };
});

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

beforeEach(() => {
  mockSearchParams = new URLSearchParams('');
  mockNavigate.mockReset();
  mockSetSearchParams.mockReset();
  mockHook.debts = [mockSampleDebt];
  mockHook.error = null;
  mockHook.successMessage = null;
  mockHook.loadDebts.mockClear();
  mockHook.openSettlementDrawer.mockClear();
  mockHook.closeSettlementDrawer.mockClear();
  mockHook.clearSuccessMessage.mockClear();
  mockHook.submitSettlement.mockClear();
  mockHook.loading = false;
  mockHook.detailsLoading = false;
  mockHook.settlementSaving = false;
  mockHook.settlementOpen = false;
  mockHook.selectedDebt = undefined;
  mockHook.selectedDebtDetail = undefined;
});

test('renders debt list and loads debts on mount', () => {
  render(
    <DebtsPage
      expireSession={jest.fn()}
    />,
  );

  expect(mockHook.loadDebts).toHaveBeenCalled();
  expect(screen.getByText(/debts list/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(DEBT_SEARCH_TEXT.DEFAULT_PLACEHOLDER)).toBeInTheDocument();
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

  const nextSearchParams = mockSetSearchParams.mock.calls.at(-1)?.[0] as URLSearchParams;

  expect(mockSetSearchParams).toHaveBeenCalled();
  expect(nextSearchParams.toString()).toContain('freeText=Jane+Doe');
  expect(nextSearchParams.toString()).toContain(`direction=${DebtDirection.YouOweThem}`);
  expect(mockHook.openSettlementDrawer).toHaveBeenCalledWith(mockSampleDebt);
  expect(mockNavigate).toHaveBeenCalledWith('/debts/p2/EUR');
  expect(screen.getByText('Load failed')).toBeInTheDocument();
  expect(screen.getByText(/settlement recorded successfully/i)).toBeInTheDocument();
});

test('shows an info alert when all visible debts are settled', () => {
  mockHook.debts = [mockSettledDebt];

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.getByText(/all visible debts are settled/i)).toBeInTheDocument();
});

test('shows an info alert when the active filters exclude all debts', () => {
  mockSearchParams = new URLSearchParams(`direction=${DebtDirection.Settled}`);

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.getByText(/no debts found/i)).toBeInTheDocument();
});

test('does not show the settled summary alert when settled is already the active direction filter', () => {
  mockHook.debts = [mockSettledDebt];
  mockSearchParams = new URLSearchParams(`direction=${DebtDirection.Settled}`);

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.queryByText(/all visible debts are settled/i)).not.toBeInTheDocument();
});

test('shows loading spinner when loading is true', () => {
  mockHook.loading = true;

  render(<DebtsPage expireSession={jest.fn()} />);

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
