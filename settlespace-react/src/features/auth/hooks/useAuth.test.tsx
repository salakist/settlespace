import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { APP_TEST_VALUES } from '../../../app/testConstants';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { PersonRole } from '../../../shared/types';
import {
  AuthApiModule,
  AuthStorageModule,
  getAuthApiMock,
  getAuthStorageMock,
  seedAuthStorage,
  seedSuccessfulAuthResponses,
} from '../testHelpers';
import { useAuth } from './useAuth';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../api', () => {
  const { createAuthApiMock } = jest.requireActual('../testHelpers') as typeof import('../testHelpers');

  return {
    authApi: createAuthApiMock(),
  };
});

jest.mock('../storage', () => {
  const { createAuthStorageMock } = jest.requireActual('../testHelpers') as typeof import('../testHelpers');

  return {
    authStorage: createAuthStorageMock(),
  };
});

const authApi = getAuthApiMock(jest.requireMock('../api') as AuthApiModule<{
  login: jest.Mock;
  register: jest.Mock;
}>);
const authStorage = getAuthStorageMock(jest.requireMock('../storage') as AuthStorageModule);

type AuthHookResult = ReturnType<typeof useAuth>;

function createAuthHarness() {
  let latest: AuthHookResult;

  const Harness = () => {
    latest = useAuth();
    return null;
  };

  render(<Harness />);

  return {
    getHook: () => latest,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  seedAuthStorage(authStorage, {
    username: '',
    personId: '',
    displayName: '',
  });
  seedSuccessfulAuthResponses(authApi);
});

test('login saves session, updates auth state, and navigates to home', async () => {
  const harness = createAuthHarness();

  await act(async () => {
    const success = await harness.getHook().login(APP_TEST_VALUES.TEST_USERNAME, APP_TEST_VALUES.TEST_PASSWORD);
    expect(success).toBe(true);
  });

  await waitFor(() => {
    expect(authStorage.saveSession).toHaveBeenCalledWith({
      token: 't1',
      username: 'john.doe',
      personId: 'p1',
      displayName: 'John Doe',
      role: PersonRole.User,
    });
  });

  expect(harness.getHook().isAuthenticated).toBe(true);
  expect(harness.getHook().username).toBe('john.doe');
  expect(harness.getHook().personId).toBe('p1');
  expect(harness.getHook().displayName).toBe('John Doe');
  expect(harness.getHook().authError).toBeNull();
  expect(mockNavigate).toHaveBeenCalledWith('/home');
});

test('register surfaces backend error message and returns false', async () => {
  const error = new Error('registration failed') as Error & { response?: { data?: { error?: string } } };
  error.response = { data: { error: 'Email already exists' } };
  authApi.register.mockRejectedValueOnce(error);

  const harness = createAuthHarness();

  await act(async () => {
    const success = await harness.getHook().register({
      firstName: 'Jane',
      lastName: 'Doe',
      password: APP_TEST_VALUES.TEST_PASSWORD,
      addresses: [],
    });
    expect(success).toBe(false);
  });

  expect(harness.getHook().authError).toBe('Email already exists');
  expect(mockNavigate).not.toHaveBeenCalledWith('/home');
});

test('expireSession clears storage and redirects to login', () => {
  const harness = createAuthHarness();

  act(() => {
    harness.getHook().expireSession();
  });

  expect(authStorage.clearSession).toHaveBeenCalled();
  expect(harness.getHook().isAuthenticated).toBe(false);
  expect(harness.getHook().authError).toBe(SESSION_EXPIRED_MESSAGE);
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});

test('logout clears auth state and redirects to login', () => {
  authStorage.isAuthenticated.mockReturnValue(true);
  authStorage.getUsername.mockReturnValue('john.doe');
  const harness = createAuthHarness();

  act(() => {
    harness.getHook().logout();
  });

  expect(authStorage.clearSession).toHaveBeenCalled();
  expect(harness.getHook().isAuthenticated).toBe(false);
  expect(harness.getHook().username).toBe('');
  expect(harness.getHook().authError).toBeNull();
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});
