import React from 'react';
import { act, render } from '@testing-library/react';
import { useAppAuth } from './useAppAuth';

type AppAuthHookResult = ReturnType<typeof useAppAuth>;

const mockOptions = {
  login: jest.fn<Promise<boolean>, [string, string]>(),
  register: jest.fn<Promise<boolean>, [unknown]>(),
  logout: jest.fn(),
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

test('handleLogin calls login', async () => {
  const harness = createHarness();

  await act(async () => {
    await harness.getHook().handleLogin('john.doe', 'Secret!1');
  });

  expect(mockOptions.login).toHaveBeenCalledWith('john.doe', 'Secret!1');
});

test('handleRegister calls register', async () => {
  const harness = createHarness();
  const request = { firstName: 'Jane', lastName: 'Doe', password: 'Secret!1', dateOfBirth: '1990-01-01', addresses: [] };

  await act(async () => {
    await harness.getHook().handleRegister(request);
  });

  expect(mockOptions.register).toHaveBeenCalledWith(request);
});

test('handleLogout logs out', () => {
  const harness = createHarness();

  act(() => {
    harness.getHook().handleLogout();
  });

  expect(mockOptions.logout).toHaveBeenCalled();
});
