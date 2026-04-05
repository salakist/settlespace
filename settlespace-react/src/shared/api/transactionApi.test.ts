import axios from 'axios';
import { TransactionStatus } from '../types';
import { mockDelete, mockGet, mockPost, mockPut, mockRequestUse, setupApiClientMock } from './apiTestClientMock';
import { API_TEST_VALUES } from './testConstants';

jest.mock('axios');


beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem('settlespace.auth.token', 'token-1');

  let loadedApi: typeof import('./transactionApi').transactionApi;
  jest.isolateModules(() => {
    loadedApi = require('./transactionApi').transactionApi;
  });

  expect(loadedApi!).toBeDefined();
  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });
  expect(result.headers.Authorization).toBe('Bearer token-1');
});

test('transaction api methods call expected routes', () => {
  let loadedApi: typeof import('./transactionApi').transactionApi;
  jest.isolateModules(() => {
    loadedApi = require('./transactionApi').transactionApi;
  });

  loadedApi!.getById(API_TEST_VALUES.TRANSACTION_ID);
  loadedApi!.search({ freeText: 'lunch' });
  loadedApi!.create({
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 10,
    currencyCode: 'EUR',
    transactionDateUtc: API_TEST_VALUES.TRANSACTION_DATE_UTC,
    description: 'Lunch',
    status: TransactionStatus.Completed,
  });
  loadedApi!.update(API_TEST_VALUES.TRANSACTION_ID, {
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 20,
    currencyCode: 'EUR',
    transactionDateUtc: API_TEST_VALUES.TRANSACTION_DATE_UTC,
    description: 'Dinner',
    status: TransactionStatus.Pending,
  });
  loadedApi!.delete(API_TEST_VALUES.TRANSACTION_ID);

  expect(mockGet).toHaveBeenNthCalledWith(1, API_TEST_VALUES.TRANSACTION_ROUTE);
  expect(mockPost).toHaveBeenNthCalledWith(1, '/transactions/search', { freeText: 'lunch' });
  expect(mockPost).toHaveBeenNthCalledWith(2, '/transactions', expect.any(Object));
  expect(mockPut).toHaveBeenCalledWith(API_TEST_VALUES.TRANSACTION_ROUTE, expect.any(Object));
  expect(mockDelete).toHaveBeenCalledWith(API_TEST_VALUES.TRANSACTION_ROUTE);
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
