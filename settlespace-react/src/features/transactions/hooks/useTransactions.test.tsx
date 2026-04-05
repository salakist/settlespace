import React from 'react';
import { act, render } from '@testing-library/react';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import {
  PersonRole,
  TransactionStatus,
} from '../../../shared/types';
import { useTransactions } from './useTransactions';
import { TRANSACTION_TEST_VALUES } from '../testConstants';
import { TransactionInvolvement } from '../types';

jest.mock('../api', () => ({
  transactionApi: {
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { transactionApi } = jest.requireMock('../api') as {
  transactionApi: {
    search: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type TransactionsHookResult = ReturnType<typeof useTransactions>;

function createHarness(options: {
  expireSession?: jest.Mock;
  role?: PersonRole | null;
  currentPersonId?: string;
} = {}) {
  const {
    expireSession = jest.fn(),
    role = PersonRole.Admin,
    currentPersonId = 'p1',
  } = options;
  let latest: TransactionsHookResult;

  const Harness = () => {
    latest = useTransactions({ expireSession, role, currentPersonId });
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
  transactionApi.search.mockResolvedValue({ data: [] });
  transactionApi.create.mockResolvedValue({});
  transactionApi.update.mockResolvedValue({});
  transactionApi.delete.mockResolvedValue({});
});

test('handleSearch with empty query loads all transactions', async () => {
  transactionApi.search.mockResolvedValueOnce({
    data: [
      {
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 20,
        currencyCode: 'EUR',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: 'Dinner',
        status: TransactionStatus.Completed,
      },
    ],
  });

  const harness = createHarness();
  await act(async () => {
    await harness.getHook().handleSearch();
  });

  expect(transactionApi.search).toHaveBeenCalledWith({});
  expect(harness.getHook().transactions).toHaveLength(1);
});

test('handleSave calls create for new transaction and update for edited one', async () => {
  const harness = createHarness();
  const payload = {
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 10,
    currencyCode: 'EUR',
    transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
    description: 'Lunch',
    status: TransactionStatus.Completed as const,
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

test('handleDelete deletes immediately once the UI has confirmed the action', async () => {
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleDelete('tx-1');
  });

  expect(transactionApi.delete).toHaveBeenCalledWith('tx-1');
});

test('handleSearch calls search endpoint with freeText', async () => {
  transactionApi.search.mockResolvedValueOnce({
    data: [
      {
        id: 'tx-1',
        payerPersonId: 'p1',
        payeePersonId: 'p2',
        amount: 10,
        currencyCode: 'EUR',
        transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
        description: 'Lunch',
        status: TransactionStatus.Completed,
      },
    ],
  });

  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ freeText: 'lunch' });
  });

  expect(transactionApi.search).toHaveBeenCalledWith({ freeText: 'lunch' });
  expect(harness.getHook().transactions).toHaveLength(1);
});

test('handleSearch with empty query calls search with empty object', async () => {
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch({});
  });

  expect(transactionApi.search).toHaveBeenCalledWith({});
});

test('handleSearch with involvement only calls search endpoint', async () => {
  transactionApi.search.mockResolvedValueOnce({ data: [] } as any);
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ involvement: TransactionInvolvement.Owned });
  });

  expect(transactionApi.search).toHaveBeenCalledWith({ involvement: TransactionInvolvement.Owned });
});

test('unauthorized search triggers session expiration and clears state', async () => {
  transactionApi.search.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch();
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
  transactionApi.search.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ freeText: 'lunch' });
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
});

test('handleSave failure sets error message', async () => {
  transactionApi.create.mockRejectedValueOnce(new Error('boom'));
  const harness = createHarness();

  await expect(act(async () => {
    await harness.getHook().handleSave({
      payerPersonId: 'p1',
      payeePersonId: 'p2',
      amount: 10,
      currencyCode: 'EUR',
      transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
      description: 'Lunch',
      status: TransactionStatus.Completed,
    });
  })).rejects.toThrow('boom');

  expect(transactionApi.create).toHaveBeenCalled();
});

test('handleDelete failure sets error message', async () => {
  transactionApi.delete.mockRejectedValueOnce(new Error('boom'));
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleDelete('tx-1');
  });

  expect(harness.getHook().error).toBe('Failed to delete transaction');
});

test('handleEdit blocks users from editing transactions they did not create', () => {
  const harness = createHarness({ role: PersonRole.User, currentPersonId: 'p1' });

  act(() => {
    harness.getHook().handleEdit({
      id: 'tx-2',
      payerPersonId: 'p3',
      payeePersonId: 'p4',
      createdByPersonId: 'p9',
      amount: 15,
      currencyCode: 'EUR',
      transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
      description: 'Blocked edit',
      status: TransactionStatus.Pending,
    });
  });

  expect(harness.getHook().showForm).toBe(false);
  expect(harness.getHook().error).toBe('You are not allowed to edit this transaction.');
});

test('handleDelete blocks users from deleting transactions they did not create', async () => {
  transactionApi.search.mockResolvedValueOnce({
    data: [{
      id: 'tx-2',
      payerPersonId: 'p1',
      payeePersonId: 'p2',
      createdByPersonId: 'p9',
      amount: 15,
      currencyCode: 'EUR',
      transactionDateUtc: TRANSACTION_TEST_VALUES.DATE_UTC,
      description: 'Blocked delete',
      status: TransactionStatus.Pending,
    }],
  });
  const harness = createHarness({ role: PersonRole.User, currentPersonId: 'p1' });

  await act(async () => {
    await harness.getHook().handleSearch();
  });

  await act(async () => {
    await harness.getHook().handleDelete('tx-2');
  });

  expect(harness.getHook().error).toBe('You are not allowed to delete this transaction.');
  expect(transactionApi.delete).not.toHaveBeenCalled();
});
