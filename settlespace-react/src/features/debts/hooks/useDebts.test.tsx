import React from 'react';
import { act, render } from '@testing-library/react';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { DebtDirection, DebtSummary } from '../../../shared/types';
import { useDebts } from './useDebts';

jest.mock('../../../shared/api/debtsApi', () => ({
  debtsApi: {
    getCurrentUser: jest.fn(),
    getCurrentUserDetails: jest.fn(),
    settle: jest.fn(),
  },
}));

const { debtsApi } = jest.requireMock('../../../shared/api/debtsApi') as {
  debtsApi: {
    getCurrentUser: jest.Mock;
    getCurrentUserDetails: jest.Mock;
    settle: jest.Mock;
  };
};

type DebtsHookResult = ReturnType<typeof useDebts>;

const sampleDebt: DebtSummary = {
  counterpartyPersonId: 'p2',
  currencyCode: 'EUR',
  netAmount: 42.5,
  direction: DebtDirection.YouOweThem,
  transactionCount: 3,
};

function createHarness(expireSession = jest.fn()) {
  let latest: DebtsHookResult;

  const Harness = () => {
    latest = useDebts({ expireSession });
    return null;
  };

  render(<Harness />);

  return {
    expireSession,
    getHook: () => latest,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  debtsApi.getCurrentUser.mockResolvedValue({ data: [] });
  debtsApi.getCurrentUserDetails.mockResolvedValue({ data: [] });
  debtsApi.settle.mockResolvedValue({ data: {} });
});

test('loadDebts populates summaries', async () => {
  debtsApi.getCurrentUser.mockResolvedValueOnce({ data: [sampleDebt] });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().loadDebts();
  });

  expect(harness.getHook().debts).toEqual([sampleDebt]);
});

test('openSettlementDrawer loads details for selected debt', async () => {
  debtsApi.getCurrentUserDetails.mockResolvedValueOnce({
    data: [
      {
        ...sampleDebt,
        paidByCurrentPerson: 65,
        paidByCounterparty: 22.5,
        transactions: [],
      },
    ],
  });

  const harness = createHarness();

  await act(async () => {
    await harness.getHook().openSettlementDrawer(sampleDebt);
  });

  expect(harness.getHook().settlementOpen).toBe(true);
  expect(harness.getHook().selectedDebt?.counterpartyPersonId).toBe('p2');
  expect(harness.getHook().selectedDebtDetail?.paidByCurrentPerson).toBe(65);
  expect(debtsApi.getCurrentUserDetails).toHaveBeenCalledWith('p2');
});

test('submitSettlement calls api and refreshes debts', async () => {
  debtsApi.getCurrentUserDetails
    .mockResolvedValueOnce({
      data: [
        {
          ...sampleDebt,
          paidByCurrentPerson: 65,
          paidByCounterparty: 22.5,
          transactions: [],
        },
      ],
    })
    .mockResolvedValueOnce({
      data: [
        {
          ...sampleDebt,
          netAmount: 22.5,
          paidByCurrentPerson: 65,
          paidByCounterparty: 42.5,
          transactions: [],
        },
      ],
    });
  debtsApi.getCurrentUser.mockResolvedValueOnce({
    data: [{ ...sampleDebt, netAmount: 22.5 }],
  });

  const harness = createHarness();

  await act(async () => {
    await harness.getHook().openSettlementDrawer(sampleDebt);
  });

  await act(async () => {
    await harness.getHook().submitSettlement({
      counterpartyPersonId: 'p2',
      amount: 20,
      currencyCode: 'EUR',
      description: 'Partial settlement',
    });
  });

  expect(debtsApi.settle).toHaveBeenCalledWith({
    counterpartyPersonId: 'p2',
    amount: 20,
    currencyCode: 'EUR',
    description: 'Partial settlement',
  });
  expect(harness.getHook().successMessage).toMatch(/settlement recorded/i);
  expect(harness.getHook().debts[0]?.netAmount).toBe(22.5);
  expect(harness.getHook().settlementOpen).toBe(false);
  expect(harness.getHook().selectedDebt).toBeUndefined();
  expect(harness.getHook().selectedDebtDetail).toBeUndefined();
});

test('unauthorized load triggers session expiration and clears state', async () => {
  debtsApi.getCurrentUser.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().loadDebts();
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  expect(harness.getHook().debts).toEqual([]);
});
