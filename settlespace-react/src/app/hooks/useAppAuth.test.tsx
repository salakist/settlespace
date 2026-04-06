import React from 'react';
import { act, render } from '@testing-library/react';
import { APP_TEST_VALUES } from '../testConstants';
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
    await harness.getHook().handleLogin(APP_TEST_VALUES.TEST_USERNAME, APP_TEST_VALUES.TEST_PASSWORD);
  });

  expect(mockOptions.login).toHaveBeenCalledWith(APP_TEST_VALUES.TEST_USERNAME, APP_TEST_VALUES.TEST_PASSWORD);
});

test('handleRegister calls register', async () => {
  const harness = createHarness();
  const request = {
    firstName: 'Jane',
    lastName: 'Doe',
    password: APP_TEST_VALUES.TEST_PASSWORD,
    dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH,
    addresses: [],
  };

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
