import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { PersonRole } from '../../../shared/types';
import { usePersons } from './usePersons';

jest.mock('../api', () => ({
  personApi: {
    getAll: jest.fn(),
    search: jest.fn(),
    searchStructured: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { personApi } = jest.requireMock('../api') as {
  personApi: {
    getAll: jest.Mock;
    search: jest.Mock;
    searchStructured: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

type PersonsHookResult = ReturnType<typeof usePersons>;

function createPersonsHarness(options: {
  expireSession?: jest.Mock;
  role?: PersonRole | null;
  currentPersonId?: string;
} = {}) {
  const {
    expireSession = jest.fn(),
    role = PersonRole.Admin,
    currentPersonId = 'p-admin',
  } = options;
  let latest: PersonsHookResult;

  const Harness = () => {
    latest = usePersons({ expireSession, role, currentPersonId });
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
  personApi.searchStructured.mockResolvedValue({
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

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  expect(harness.getHook().persons).toEqual([]);
});

test('handleSearch with an empty structured query falls back to loadPersons', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSearch({});
  });

  expect(personApi.getAll).toHaveBeenCalled();
  expect(personApi.searchStructured).not.toHaveBeenCalled();
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

test('handleDelete deletes immediately once the UI has confirmed the action', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleDelete('p1');
  });

  expect(personApi.delete).toHaveBeenCalledWith('p1');
});

test('loadPersons non-401 error sets error state', async () => {
  personApi.getAll.mockRejectedValueOnce(new Error('Network error'));
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().loadPersons();
  });

  expect(harness.getHook().error).toBe('Failed to load persons');
  expect(harness.getHook().persons).toEqual([]);
});

test('handleSearch returns results for a non-empty structured query', async () => {
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ freeText: 'Jane' });
  });

  expect(personApi.searchStructured).toHaveBeenCalledWith({ freeText: 'Jane' });
  await waitFor(() => {
    expect(harness.getHook().persons).toEqual([
      {
        id: 'p2',
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1980-05-20',
        addresses: [],
      },
    ]);
  });
  expect(harness.getHook().loading).toBe(false);
});

test('handleSearch unauthorized triggers expireSession', async () => {
  personApi.searchStructured.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ freeText: 'query' });
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
});

test('handleSearch non-401 error sets error state', async () => {
  personApi.searchStructured.mockRejectedValueOnce(new Error('Search error'));
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSearch({ freeText: 'fail' });
  });

  expect(harness.getHook().error).toBe('Search failed');
});

test('handleSave unauthorized triggers expireSession', async () => {
  personApi.create.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleSave({
      firstName: 'Test',
      lastName: 'Person',
      phoneNumber: undefined,
      email: undefined,
      dateOfBirth: undefined,
      addresses: [],
    });
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
});

test('handleSave non-401 error sets error state and rethrows', async () => {
  personApi.create.mockRejectedValueOnce(new Error('Save failed'));
  const harness = createPersonsHarness();

  await act(async () => {
    await expect(
      harness.getHook().handleSave({
        firstName: 'Test',
        lastName: 'Person',
        phoneNumber: undefined,
        email: undefined,
        dateOfBirth: undefined,
        addresses: [],
      }),
    ).rejects.toThrow();
  });

  expect(harness.getHook().error).toBe('Failed to save person');
});

test('handleDelete unauthorized triggers expireSession', async () => {
  const confirmSpy = jest.spyOn(globalThis, 'confirm').mockReturnValue(true);
  personApi.delete.mockRejectedValueOnce({ response: { status: 401 } });
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleDelete('p1');
  });

  expect(harness.expireSession).toHaveBeenCalledWith(SESSION_EXPIRED_MESSAGE);
  confirmSpy.mockRestore();
});

test('handleDelete non-401 error sets error state', async () => {
  const confirmSpy = jest.spyOn(globalThis, 'confirm').mockReturnValue(true);
  personApi.delete.mockRejectedValueOnce(new Error('Delete error'));
  const harness = createPersonsHarness();

  await act(async () => {
    await harness.getHook().handleDelete('p1');
  });

  expect(harness.getHook().error).toBe('Failed to delete person');
  confirmSpy.mockRestore();
});

test('handleCancel clears editing state and hides form', () => {
  const harness = createPersonsHarness();

  act(() => {
    harness.getHook().handleEdit({ id: 'p1', firstName: 'Edit', lastName: 'Me', addresses: [] });
  });

  expect(harness.getHook().showForm).toBe(true);

  act(() => {
    harness.getHook().handleCancel();
  });

  expect(harness.getHook().showForm).toBe(false);
  expect(harness.getHook().editingPerson).toBeUndefined();
});

test('showCreateForm shows form without an editing person', () => {
  const harness = createPersonsHarness();

  act(() => {
    harness.getHook().showCreateForm();
  });

  expect(harness.getHook().showForm).toBe(true);
  expect(harness.getHook().editingPerson).toBeUndefined();
});

test('showCreateForm blocks unauthorized users before opening the form', () => {
  const harness = createPersonsHarness({ role: PersonRole.User });

  act(() => {
    harness.getHook().showCreateForm();
  });

  expect(harness.getHook().showForm).toBe(false);
  expect(harness.getHook().error).toBe('You are not allowed to create persons.');
  expect(personApi.create).not.toHaveBeenCalled();
});

test('handleEdit blocks managers from editing admin profiles', () => {
  const harness = createPersonsHarness({ role: PersonRole.Manager });

  act(() => {
    harness.getHook().handleEdit({
      id: 'admin-1',
      firstName: 'Ada',
      lastName: 'Admin',
      role: PersonRole.Admin,
      addresses: [],
    });
  });

  expect(harness.getHook().showForm).toBe(false);
  expect(harness.getHook().editingPerson).toBeUndefined();
  expect(harness.getHook().error).toBe('You are not allowed to edit this person.');
});

test('handleDelete blocks managers from deleting admin profiles', async () => {
  personApi.getAll.mockResolvedValueOnce({
    data: [{ id: 'admin-1', firstName: 'Ada', lastName: 'Admin', role: PersonRole.Admin, addresses: [] }],
  });
  const harness = createPersonsHarness({ role: PersonRole.Manager });

  await act(async () => {
    await harness.getHook().loadPersons();
  });

  await act(async () => {
    await harness.getHook().handleDelete('admin-1');
  });

  expect(harness.getHook().error).toBe('You are not allowed to delete this person.');
  expect(personApi.delete).not.toHaveBeenCalled();
});
