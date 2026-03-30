import React from 'react';
import { act, render } from '@testing-library/react';
import { useAppAuth } from './useAppAuth';

type AppAuthHookResult = ReturnType<typeof useAppAuth>;

const mockOptions = {
  login: jest.fn<Promise<boolean>, [string, string]>(),
  register: jest.fn<Promise<boolean>, [unknown]>(),
  logout: jest.fn(),
  clearPersonsError: jest.fn(),
  clearPersonsState: jest.fn(),
  clearProfileState: jest.fn(),
};

function createHarness() {
  let latest: AppAuthHookResult;

  const Harness = () => {
    latest = useAppAuth(mockOptions as Parameters<typeof useAppAuth>[0]);
    return null;
  };

  render(<Harness />);

  return { getHook: () => latest };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOptions.login.mockResolvedValue(true);
  mockOptions.register.mockResolvedValue(true);
});

test('handleLogin calls login and clears persons error on success', async () => {
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleLogin('john.doe', 'Secret!1');
  });

  expect(mockOptions.login).toHaveBeenCalledWith('john.doe', 'Secret!1');
  expect(mockOptions.clearPersonsError).toHaveBeenCalled();
});

test('handleLogin does not clear persons error on failure', async () => {
  mockOptions.login.mockResolvedValue(false);
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleLogin('john.doe', 'wrong');
  });

  expect(mockOptions.clearPersonsError).not.toHaveBeenCalled();
});

test('handleRegister calls register and clears persons error on success', async () => {
  const harness = createHarness();
  const request = { firstName: 'Jane', lastName: 'Doe', password: 'Secret!1', dateOfBirth: '1990-01-01', addresses: [] };

  await act(async () => {
    await harness.getHook().handleRegister(request);
  });

  expect(mockOptions.register).toHaveBeenCalledWith(request);
  expect(mockOptions.clearPersonsError).toHaveBeenCalled();
});

test('handleRegister does not clear persons error on failure', async () => {
  mockOptions.register.mockResolvedValue(false);
  const harness = createHarness();
  const request = { firstName: 'Jane', lastName: 'Doe', password: 'Secret!1', dateOfBirth: '1990-01-01', addresses: [] };

  await act(async () => {
    await harness.getHook().handleRegister(request);
  });

  expect(mockOptions.clearPersonsError).not.toHaveBeenCalled();
});

test('handleLogout clears persons state, clears profile state, and logs out', () => {
  const harness = createHarness();

  act(() => {
    harness.getHook().handleLogout();
  });

  expect(mockOptions.clearPersonsState).toHaveBeenCalled();
  expect(mockOptions.clearProfileState).toHaveBeenCalled();
  expect(mockOptions.logout).toHaveBeenCalled();
});
