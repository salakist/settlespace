import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { PersonRole } from '../../../shared/types';
import { useAuth } from './useAuth';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

jest.mock('../storage', () => ({
  authStorage: {
    isAuthenticated: jest.fn(),
    getUsername: jest.fn(),
    getPersonId: jest.fn(),
    getDisplayName: jest.fn(),
    getRole: jest.fn(),
    saveSession: jest.fn(),
    clearSession: jest.fn(),
    setUsername: jest.fn(),
    setPersonId: jest.fn(),
    setDisplayName: jest.fn(),
    setRole: jest.fn(),
  },
}));

const { authApi } = jest.requireMock('../api') as {
  authApi: {
    login: jest.Mock;
    register: jest.Mock;
  };
};

const { authStorage } = jest.requireMock('../storage') as {
  authStorage: {
    isAuthenticated: jest.Mock;
    getUsername: jest.Mock;
    getPersonId: jest.Mock;
    getDisplayName: jest.Mock;
    getRole: jest.Mock;
    saveSession: jest.Mock;
    clearSession: jest.Mock;
    setUsername: jest.Mock;
    setPersonId: jest.Mock;
    setDisplayName: jest.Mock;
    setRole: jest.Mock;
  };
};

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
  authStorage.isAuthenticated.mockReturnValue(false);
  authStorage.getUsername.mockReturnValue('');
  authStorage.getPersonId.mockReturnValue('');
  authStorage.getDisplayName.mockReturnValue('');
  authStorage.getRole.mockReturnValue(null);
  authApi.login.mockResolvedValue({
    data: { token: 't1', username: 'john.doe', personId: 'p1', displayName: 'John Doe', role: PersonRole.User },
  });
  authApi.register.mockResolvedValue({
    data: { token: 't2', username: 'jane.doe', personId: 'p2', displayName: 'Jane Doe', role: PersonRole.User },
  });
});

test('login saves session, updates auth state, and navigates to home', async () => {
  const harness = createAuthHarness();

  await act(async () => {
    const success = await harness.getHook().login('john.doe', 'Secret!1');
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
      password: 'Secret!1',
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
  expect(harness.getHook().authError).toBe('Your session expired. Please log in again.');
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
