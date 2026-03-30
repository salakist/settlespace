import axios from 'axios';
import { mockDelete, mockGet, mockPost, mockPut, mockRequestUse, setupApiClientMock } from './apiTestClientMock';

jest.mock('axios');

const TX_DATE = '2026-03-29T00:00:00Z';
const TX_ID = 'tx-1';
const TX_ROUTE = '/transactions/tx-1';

beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem('fotest.auth.token', 'token-1');

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

  loadedApi!.getCurrentUser();
  loadedApi!.getById(TX_ID);
  loadedApi!.searchCurrentUser('lunch');
  loadedApi!.create({
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 10,
    currencyCode: 'EUR',
    transactionDateUtc: TX_DATE,
    description: 'Lunch',
    status: 'Completed',
  });
  loadedApi!.update(TX_ID, {
    payerPersonId: 'p1',
    payeePersonId: 'p2',
    amount: 20,
    currencyCode: 'EUR',
    transactionDateUtc: TX_DATE,
    description: 'Dinner',
    status: 'Pending',
  });
  loadedApi!.delete(TX_ID);

  expect(mockGet).toHaveBeenNthCalledWith(1, '/transactions/me');
  expect(mockGet).toHaveBeenNthCalledWith(2, TX_ROUTE);
  expect(mockGet).toHaveBeenNthCalledWith(3, '/transactions/me/search/lunch');
  expect(mockPost).toHaveBeenCalledWith('/transactions', expect.any(Object));
  expect(mockPut).toHaveBeenCalledWith(TX_ROUTE, expect.any(Object));
  expect(mockDelete).toHaveBeenCalledWith(TX_ROUTE);
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
