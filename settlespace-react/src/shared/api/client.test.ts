import axios from 'axios';
import { mockRequestUse, setupApiClientMock } from './apiTestClientMock';
import { AUTH_STORAGE_KEYS } from './constants';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, 'token-abc');

  let loadedClient: typeof import('./client').apiClient;
  jest.isolateModules(() => {
    loadedClient = require('./client').apiClient;
  });

  expect(loadedClient!).toBeDefined();
  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });

  expect(result.headers.Authorization).toBe('Bearer token-abc');
});

test('registers interceptor and skips auth header when no token', () => {
  jest.isolateModules(() => {
    require('./client');
  });

  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });

  expect(result.headers.Authorization).toBeUndefined();
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
