import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { usePersons } from './usePersons';

jest.mock('../../../shared/api/api', () => ({
  personApi: {
    getAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { personApi } = jest.requireMock('../../../shared/api/api') as {
  personApi: {
    getAll: jest.Mock;
    search: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type PersonsHookResult = ReturnType<typeof usePersons>;

function createPersonsHarness(expireSession = jest.fn()) {
  let latest: PersonsHookResult;

  const Harness = () => {
    latest = usePersons({ expireSession });
    return null;
  };

  render(<Harness />);

  return {
    expireSession,
    getHook: () => latest,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  personApi.getAll.mockResolvedValue({
    data: [{ id: 'p1', firstName: 'John', lastName: 'Doe', dateOfBirth: '1990-01-01T12:00:00Z', addresses: undefined }],
  });
  personApi.search.mockResolvedValue({
    data: [{ id: 'p2', firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1980-05-20T00:00:00Z', addresses: undefined }],
  });
  personApi.create.mockResolvedValue({});
  personApi.update.mockResolvedValue({});
  personApi.delete.mockResolvedValue({});
});

test('loadPersons normalizes API data and clears errors', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().loadPersons();
  });

  await waitFor(() => {
    expect(harness.getHook().persons).toEqual([
      {
        id: 'p1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        addresses: [],
      },
    ]);
  });

  expect(harness.getHook().error).toBeNull();
  expect(harness.getHook().loading).toBe(false);
});

test('loadPersons unauthorized triggers expireSession callback', async () => {
  personApi.getAll.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().loadPersons();
  });

  expect(harness.expireSession).toHaveBeenCalledWith('Your session expired. Please log in again.');
  expect(harness.getHook().persons).toEqual([]);
});

test('handleSearch with empty query falls back to loadPersons', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSearch('');
  });

  expect(personApi.getAll).toHaveBeenCalled();
});

test('handleSave uses create for new person and update for existing person', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSave({
      firstName: 'New',
      lastName: 'Person',
      phoneNumber: undefined,
      email: undefined,
      dateOfBirth: undefined,
      addresses: [],
    });
  });

  expect(personApi.create).toHaveBeenCalled();

  act(() => {
    harness.getHook().handleEdit({ id: 'p1', firstName: 'Edit', lastName: 'Me', addresses: [] });
  });

  await act(async () => {
    await harness.getHook().handleSave({
      firstName: 'Edited',
      lastName: 'Person',
      phoneNumber: '555-123-4567',
      email: 'edited@example.com',
      dateOfBirth: '1995-02-03',
      addresses: [],
    });
  });

  expect(personApi.update).toHaveBeenCalledWith(
    'p1',
    expect.objectContaining({
      firstName: 'Edited',
      lastName: 'Person',
      phoneNumber: '555-123-4567',
      email: 'edited@example.com',
      dateOfBirth: '1995-02-03',
    }),
  );
});

test('handleSave toggles saveLoading during save lifecycle', async () => {
  const harness = createPersonsHarness();
  let resolveSave: () => void = () => {};

  personApi.create.mockImplementationOnce(() => new Promise<void>((resolve) => {
    resolveSave = resolve;
  }));

  let savePromise: Promise<void> | undefined;
  act(() => {
    savePromise = harness.getHook().handleSave({
      firstName: 'Async',
      lastName: 'Person',
      phoneNumber: undefined,
      email: undefined,
      dateOfBirth: undefined,
      addresses: [],
    });
  });

  expect(harness.getHook().saveLoading).toBe(true);

  await act(async () => {
    resolveSave();
    await savePromise;
  });

  expect(harness.getHook().saveLoading).toBe(false);
});

test('handleDelete respects confirm dialog and calls delete when confirmed', async () => {
  const harness = createPersonsHarness();
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

  await act(async () => {
    await harness.getHook().handleDelete('p1');
  });

  expect(personApi.delete).not.toHaveBeenCalled();

  confirmSpy.mockReturnValue(true);

  await act(async () => {
    await harness.getHook().handleDelete('p1');
  });

  expect(personApi.delete).toHaveBeenCalledWith('p1');
  confirmSpy.mockRestore();
});
