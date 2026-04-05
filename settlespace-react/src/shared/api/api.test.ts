import axios from 'axios';
import { PersonRole } from '../types';
import { AUTH_STORAGE_KEYS } from './constants';
import { API_TEST_VALUES } from './testConstants';
import { mockDelete, mockGet, mockPost, mockPut, mockRequestUse, setupApiClientMock } from './apiTestClientMock';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('registers interceptor and applies bearer token when present', () => {
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, 'token-abc');

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

  const personData = { firstName: 'John', lastName: 'Doe', addresses: [] };

  loadedApi!.personApi.getAll();
  loadedApi!.personApi.getCurrent();
  loadedApi!.personApi.getById(API_TEST_VALUES.PERSON_ID);
  loadedApi!.personApi.create(personData);
  loadedApi!.personApi.update(API_TEST_VALUES.PERSON_ID, personData);
  loadedApi!.personApi.updateCurrent(personData);
  loadedApi!.personApi.delete(API_TEST_VALUES.PERSON_ID);
  loadedApi!.personApi.search('john');

  expect(mockGet).toHaveBeenNthCalledWith(1, '/persons');
  expect(mockGet).toHaveBeenNthCalledWith(2, '/persons/me');
  expect(mockGet).toHaveBeenNthCalledWith(3, `/persons/${API_TEST_VALUES.PERSON_ID}`);
  expect(mockPost).toHaveBeenCalledWith('/persons', personData);
  expect(mockPut).toHaveBeenNthCalledWith(1, `/persons/${API_TEST_VALUES.PERSON_ID}`, personData);
  expect(mockPut).toHaveBeenNthCalledWith(2, '/persons/me', personData);
  expect(mockDelete).toHaveBeenCalledWith(`/persons/${API_TEST_VALUES.PERSON_ID}`);
  expect(mockGet).toHaveBeenNthCalledWith(4, '/persons/search/john');
});

test('authStorage returns null for an invalid stored role value', () => {
  localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, 'NOT_A_REAL_ROLE');

  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  expect(loadedApi!.authStorage.getRole()).toBeNull();
});

test('authStorage reads and writes to localStorage', () => {
  let loadedApi: typeof import('./api');
  jest.isolateModules(() => {
    loadedApi = require('./api');
  });

  const { authStorage } = loadedApi!;

  expect(authStorage.getToken()).toBeNull();
  expect(authStorage.getUsername()).toBeNull();
  expect(authStorage.getPersonId()).toBeNull();
  expect(authStorage.getDisplayName()).toBeNull();
  expect(authStorage.getRole()).toBeNull();
  expect(authStorage.isAuthenticated()).toBe(false);

  authStorage.saveSession({
    token: 'tok',
    username: 'john',
    personId: 'person-1',
    displayName: 'John Doe',
    role: PersonRole.User,
    expiresAtUtc: '2026-01-01T00:00:00Z',
  });
  expect(authStorage.getToken()).toBe('tok');
  expect(authStorage.getUsername()).toBe('john');
  expect(authStorage.getPersonId()).toBe('person-1');
  expect(authStorage.getDisplayName()).toBe('John Doe');
  expect(authStorage.getRole()).toBe(PersonRole.User);
  expect(authStorage.isAuthenticated()).toBe(true);

  authStorage.setUsername('jane');
  authStorage.setPersonId('person-2');
  authStorage.setDisplayName('Jane Doe');
  expect(authStorage.getUsername()).toBe('jane');
  expect(authStorage.getPersonId()).toBe('person-2');
  expect(authStorage.getDisplayName()).toBe('Jane Doe');

  authStorage.clearSession();
  expect(authStorage.getToken()).toBeNull();
  expect(authStorage.getUsername()).toBeNull();
  expect(authStorage.getPersonId()).toBeNull();
  expect(authStorage.getDisplayName()).toBeNull();
  expect(authStorage.getRole()).toBeNull();
  expect(authStorage.isAuthenticated()).toBe(false);
});
