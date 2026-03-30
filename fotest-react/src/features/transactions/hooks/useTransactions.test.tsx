import React from 'react';
import { act, render } from '@testing-library/react';
import { useTransactions } from './useTransactions';

jest.mock('../../../shared/api/transactionApi', () => ({
  transactionApi: {
    getCurrentUser: jest.fn(),
    searchCurrentUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { transactionApi } = jest.requireMock('../../../shared/api/transactionApi') as {
  transactionApi: {
    getCurrentUser: jest.Mock;
    searchCurrentUser: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type TransactionsHookResult = ReturnType<typeof useTransactions>;
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';
const TX_DATE = '2026-03-29T00:00:00Z';

function createHarness(expireSession = jest.fn()) {
  let latest: TransactionsHookResult;

  const Harness = () => {
    latest = useTransactions({ expireSession });
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
  transactionApi.getCurrentUser.mockResolvedValue({ data: [] });
  transactionApi.searchCurrentUser.mockResolvedValue({ data: [] });
  transactionApi.create.mockResolvedValue({});
  transactionApi.update.mockResolvedValue({});
  transactionApi.delete.mockResolvedValue({});
});

test('loadTransactions populates list', async () => {
  transactionApi.getCurrentUser.mockResolvedValueOnce({
    data: [
      {
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 20,
        currencyCode: 'EUR',
        transactionDateUtc: TX_DATE,
        description: 'Dinner',
        status: 'Completed',
      },
    ],
  });

  const harness = createHarness();
  await act(async () => {
    await harness.getHook().loadTransactions();
  });

  expect(harness.getHook().transactions).toHaveLength(1);
});

test('handleSave calls create for new transaction and update for edited one', async () => {
  const harness = createHarness();
  const payload = {
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 10,
    currencyCode: 'EUR',
    transactionDateUtc: TX_DATE,
    description: 'Lunch',
    status: 'Completed' as const,
  };

  await act(async () => {
    await harness.getHook().handleSave(payload);
  });

  expect(transactionApi.create).toHaveBeenCalled();

  act(() => {
    harness.getHook().handleEdit({
      id: 'tx-1',
      ...payload,
    });
  });

  await act(async () => {
    await harness.getHook().handleSave(payload);
  });

  expect(transactionApi.update).toHaveBeenCalledWith('tx-1', payload);
});

test('handleDelete respects confirm dialog and deletes when confirmed', async () => {
  const harness = createHarness();
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

  await act(async () => {
    await harness.getHook().handleDelete('tx-1');
  });
  expect(transactionApi.delete).not.toHaveBeenCalled();

  confirmSpy.mockReturnValue(true);
  await act(async () => {
    await harness.getHook().handleDelete('tx-1');
  });

  expect(transactionApi.delete).toHaveBeenCalledWith('tx-1');
  confirmSpy.mockRestore();
});

test('handleSearch with empty query falls back to loadTransactions', async () => {
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch('');
  });

  expect(transactionApi.getCurrentUser).toHaveBeenCalled();
});

test('unauthorized load triggers session expiration and clears state', async () => {
  transactionApi.getCurrentUser.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().loadTransactions();
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  expect(harness.getHook().transactions).toEqual([]);
});

test('showCreateForm and handleCancel toggle form state', () => {
  const harness = createHarness();

  act(() => {
    harness.getHook().showCreateForm();
  });
  expect(harness.getHook().showForm).toBe(true);

  act(() => {
    harness.getHook().handleCancel();
  });
  expect(harness.getHook().showForm).toBe(false);
});

test('handleSearch unauthorized triggers expireSession', async () => {
  transactionApi.searchCurrentUser.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch('lunch');
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
});

test('handleSave failure sets error message', async () => {
  transactionApi.create.mockRejectedValueOnce(new Error('boom'));
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSave({
      payerPersonId: 'p1',
      payeePersonId: 'p2',
      amount: 10,
      currencyCode: 'EUR',
      transactionDateUtc: TX_DATE,
      description: 'Lunch',
      status: 'Completed',
    });
  });

  expect(harness.getHook().error).toBe('Failed to save transaction');
});

test('handleDelete failure sets error message', async () => {
  transactionApi.delete.mockRejectedValueOnce(new Error('boom'));
  const harness = createHarness();
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  await act(async () => {
    await harness.getHook().handleDelete('tx-1');
  });

  expect(harness.getHook().error).toBe('Failed to delete transaction');
  confirmSpy.mockRestore();
});
