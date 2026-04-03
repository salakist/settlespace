import axios from 'axios';
import { mockDelete, mockGet, mockPost, mockPut, mockRequestUse, setupApiClientMock } from './apiTestClientMock';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem('settlespace.auth.token', 'token-abc');

  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  expect(loadedApi!.authApi).toBeDefined();
  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });
  expect(result.headers.Authorization).toBe('Bearer token-abc');
});

test('registers interceptor and skips auth header when no token', () => {
  jest.isolateModules(() => {
    require('./api');
  });

  expect(mockRequestUse).toHaveBeenCalled();

  const interceptor = mockRequestUse.mock.calls[0][0] as (config: { headers: { Authorization?: string } }) => { headers: { Authorization?: string } };
  const result = interceptor({ headers: {} });
  expect(result.headers.Authorization).toBeUndefined();
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});

test('authApi methods call expected routes', () => {
  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  loadedApi!.authApi.login({ username: 'john.doe', password: 'P@ssw0rd!' });
  loadedApi!.authApi.register({ firstName: 'John', lastName: 'Doe', password: 'P@ssw0rd!' });
  loadedApi!.authApi.changePassword({ currentPassword: 'old', newPassword: 'new' });

  expect(mockPost).toHaveBeenNthCalledWith(1, '/auth/login', expect.any(Object));
  expect(mockPost).toHaveBeenNthCalledWith(2, '/auth/register', expect.any(Object));
  expect(mockPost).toHaveBeenNthCalledWith(3, '/auth/change-password', expect.any(Object));
});

test('personApi methods call expected routes', () => {
  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  const personId = 'person-1';
  const personData = { firstName: 'John', lastName: 'Doe', addresses: [] };

  loadedApi!.personApi.getAll();
  loadedApi!.personApi.getCurrent();
  loadedApi!.personApi.getById(personId);
  loadedApi!.personApi.create(personData);
  loadedApi!.personApi.update(personId, personData);
  loadedApi!.personApi.updateCurrent(personData);
  loadedApi!.personApi.delete(personId);
  loadedApi!.personApi.search('john');

  expect(mockGet).toHaveBeenNthCalledWith(1, '/persons');
  expect(mockGet).toHaveBeenNthCalledWith(2, '/persons/me');
  expect(mockGet).toHaveBeenNthCalledWith(3, `/persons/${personId}`);
  expect(mockPost).toHaveBeenCalledWith('/persons', personData);
  expect(mockPut).toHaveBeenNthCalledWith(1, `/persons/${personId}`, personData);
  expect(mockPut).toHaveBeenNthCalledWith(2, '/persons/me', personData);
  expect(mockDelete).toHaveBeenCalledWith(`/persons/${personId}`);
  expect(mockGet).toHaveBeenNthCalledWith(4, '/persons/search/john');
});

test('authStorage reads and writes to localStorage', () => {
  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  const { authStorage } = loadedApi!;

  expect(authStorage.getToken()).toBeNull();
  expect(authStorage.getUsername()).toBeNull();
  expect(authStorage.getRole()).toBeNull();
  expect(authStorage.isAuthenticated()).toBe(false);

  authStorage.saveSession({ token: 'tok', username: 'john', role: 'USER', expiresAtUtc: '2026-01-01T00:00:00Z' });
  expect(authStorage.getToken()).toBe('tok');
  expect(authStorage.getUsername()).toBe('john');
  expect(authStorage.getRole()).toBe('USER');
  expect(authStorage.isAuthenticated()).toBe(true);

  authStorage.setUsername('jane');
  expect(authStorage.getUsername()).toBe('jane');

  authStorage.clearSession();
  expect(authStorage.getToken()).toBeNull();
  expect(authStorage.getUsername()).toBeNull();
  expect(authStorage.getRole()).toBeNull();
  expect(authStorage.isAuthenticated()).toBe(false);
});
