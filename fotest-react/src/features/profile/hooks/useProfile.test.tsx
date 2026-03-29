import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { useProfile } from './useProfile';

jest.mock('../../../shared/api/api', () => ({
  authApi: {
    changePassword: jest.fn(),
  },
  personApi: {
    getCurrent: jest.fn(),
    updateCurrent: jest.fn(),
  },
}));

const { authApi, personApi } = jest.requireMock('../../../shared/api/api') as {
  authApi: {
    changePassword: jest.Mock;
  };
  personApi: {
    getCurrent: jest.Mock;
    updateCurrent: jest.Mock;
  };
};

type ProfileHookResult = ReturnType<typeof useProfile>;

function createProfileHarness(options: {
  handleUnauthorized: jest.Mock;
  setAuthUsername: jest.Mock;
  setPersonInList: jest.Mock;
}) {
  let latest: ProfileHookResult;

  const Harness = () => {
    latest = useProfile(options);
    return null;
  };

  render(<Harness />);

  return {
    getHook: () => latest,
  };
}

beforeEach(() => {
  jest.clearAllMocks();

  personApi.getCurrent.mockResolvedValue({
    data: {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01T13:45:00Z',
      addresses: undefined,
    },
  });

  personApi.updateCurrent.mockResolvedValue({});
  authApi.changePassword.mockResolvedValue({});
});

test('loads current person and normalizes profile data', async () => {
  const handleUnauthorized = jest.fn();
  const setAuthUsername = jest.fn();
  const setPersonInList = jest.fn();
  const harness = createProfileHarness({
    handleUnauthorized,
    setAuthUsername,
    setPersonInList,
  });

  await act(async () => {
    await harness.getHook().loadCurrentPerson();
  });

  await waitFor(() => {
    expect(setAuthUsername).toHaveBeenCalledWith('John.Doe');
  });

  expect(setPersonInList).toHaveBeenCalledWith(
    expect.objectContaining({
      dateOfBirth: '1990-01-01',
      addresses: [],
    }),
  );

  expect(handleUnauthorized).not.toHaveBeenCalled();
  expect(harness.getHook().profileError).toBeNull();
});

test('handles unauthorized profile load by clearing state and delegating session handling', async () => {
  personApi.getCurrent.mockRejectedValueOnce({ response: { status: 401 } });

  const handleUnauthorized = jest.fn();
  const harness = createProfileHarness({
    handleUnauthorized,
    setAuthUsername: jest.fn(),
    setPersonInList: jest.fn(),
  });

  await act(async () => {
    await harness.getHook().loadCurrentPerson();
  });

  expect(handleUnauthorized).toHaveBeenCalled();
  expect(harness.getHook().currentPerson).toBeNull();
  expect(harness.getHook().profileError).toBeNull();
});

test('sets profile error when profile save fails with non-401 response', async () => {
  personApi.updateCurrent.mockRejectedValueOnce(new Error('save failed'));

  const harness = createProfileHarness({
    handleUnauthorized: jest.fn(),
    setAuthUsername: jest.fn(),
    setPersonInList: jest.fn(),
  });

  await act(async () => {
    await harness.getHook().handleProfileSave({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      addresses: [],
    });
  });

  expect(harness.getHook().profileError).toBe('Failed to save your profile.');
});

test('delegates unauthorized password-change failures and keeps state safe', async () => {
  authApi.changePassword.mockRejectedValueOnce({ response: { status: 401 } });

  const handleUnauthorized = jest.fn();
  const harness = createProfileHarness({
    handleUnauthorized,
    setAuthUsername: jest.fn(),
    setPersonInList: jest.fn(),
  });

  await act(async () => {
    await harness.getHook().handlePasswordChange('old', 'new');
  });

  expect(handleUnauthorized).toHaveBeenCalled();
  expect(harness.getHook().currentPerson).toBeNull();
});
