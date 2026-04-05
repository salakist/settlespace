import axios from 'axios';
import { AUTH_STORAGE_KEYS } from '../../shared/api/constants';
import { mockPost, setupApiClientMock } from '../../shared/api/apiTestClientMock';
import { PersonRole } from '../../shared/types';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('auth api methods call expected routes', () => {
  let loadedApi: typeof import('./api').authApi;
  jest.isolateModules(() => {
    loadedApi = require('./api').authApi;
  });

  loadedApi!.login({ username: 'john.doe', password: 'P@ssw0rd!' });
  loadedApi!.register({ firstName: 'John', lastName: 'Doe', password: 'P@ssw0rd!' });
  loadedApi!.changePassword({ currentPassword: 'old', newPassword: 'new' });

  expect(mockPost).toHaveBeenNthCalledWith(1, '/auth/login', expect.any(Object));
  expect(mockPost).toHaveBeenNthCalledWith(2, '/auth/register', expect.any(Object));
  expect(mockPost).toHaveBeenNthCalledWith(3, '/auth/change-password', expect.any(Object));
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});

test('auth storage returns null for an invalid stored role value', () => {
  localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, 'NOT_A_REAL_ROLE');

  let loadedStorage: typeof import('./storage').authStorage;
  jest.isolateModules(() => {
    loadedStorage = require('./storage').authStorage;
  });

  expect(loadedStorage!.getRole()).toBeNull();
});

test('auth storage reads and writes to localStorage', () => {
  let loadedStorage: typeof import('./storage').authStorage;
  jest.isolateModules(() => {
    loadedStorage = require('./storage').authStorage;
  });

  const authStorage = loadedStorage!;

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
