import axios from 'axios';
import { mockGet, mockPost, mockRequestUse, setupApiClientMock } from './apiTestClientMock';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem('settlespace.auth.token', 'token-1');

  let loadedApi: typeof import('./debtsApi').debtsApi;
  jest.isolateModules(() => {
    loadedApi = require('./debtsApi').debtsApi;
  });

  expect(loadedApi!).toBeDefined();
  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });

  expect(result.headers.Authorization).toBe('Bearer token-1');
});

test('debts api methods call expected routes', () => {
  let loadedApi: typeof import('./debtsApi').debtsApi;
  jest.isolateModules(() => {
    loadedApi = require('./debtsApi').debtsApi;
  });

  loadedApi!.getCurrentUser();
  loadedApi!.getCurrentUserDetails('person-2');
  loadedApi!.settle({
    counterpartyPersonId: 'person-2',
    amount: 12.5,
    currencyCode: 'EUR',
    description: 'Partial settlement',
  });

  expect(mockGet).toHaveBeenNthCalledWith(1, '/debts/me');
  expect(mockGet).toHaveBeenNthCalledWith(2, '/debts/me/person-2');
  expect(mockPost).toHaveBeenCalledWith('/debts/settlements', {
    counterpartyPersonId: 'person-2',
    amount: 12.5,
    currencyCode: 'EUR',
    description: 'Partial settlement',
  });
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
