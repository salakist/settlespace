import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PersonRole } from '../shared/types';
import { APP_TEST_VALUES } from './testConstants';

jest.mock('react-router-dom');

const {
  __resetRouterMocks,
  __setMockPathname,
} = jest.requireMock('react-router-dom') as {
  __resetRouterMocks: () => void;
  __setMockPathname: (pathname: string) => void;
};

const mockGetAppTestValues = () => (jest.requireActual('./testConstants') as typeof import('./testConstants')).APP_TEST_VALUES;

jest.mock('../shared/api/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    changePassword: jest.fn(),
  },
  personApi: {
    getAll: jest.fn(),
    getCurrent: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateCurrent: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  },
  transactionApi: {
    getById: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
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

const {
  authApi: mockAuthApi,
  personApi: mockPersonApi,
  transactionApi: mockTransactionApi,
  authStorage: mockAuthStorage,
} = jest.requireMock('../shared/api/api') as {
  authApi: {
    login: jest.Mock;
    register: jest.Mock;
    changePassword: jest.Mock;
  };
  personApi: {
    getAll: jest.Mock;
    getCurrent: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateCurrent: jest.Mock;
    delete: jest.Mock;
    search: jest.Mock;
  };
  transactionApi: {
    getById: jest.Mock;
    search: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
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

const { debtsApi: mockDebtsApi } = jest.requireMock('../shared/api/debtsApi') as {
  debtsApi: {
    getCurrentUser: jest.Mock;
    getCurrentUserDetails: jest.Mock;
    settle: jest.Mock;
  };
};

const App = require('./App').default;

jest.mock('../shared/api/debtsApi', () => ({
  debtsApi: {
    getCurrentUser: jest.fn(),
    getCurrentUserDetails: jest.fn(),
    settle: jest.fn(),
  },
}));

jest.mock('../features/persons/components/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch, action }: { onSearch: (query: string) => void; action?: React.ReactNode }) => (
    <div>
      <button onClick={() => onSearch('john')}>Search John</button>
      <button onClick={() => onSearch('')}>Search Empty</button>
      {action}
    </div>
  ),
}));
jest.mock('../features/transactions/components/TransactionsPage', () => ({
  __esModule: true,
  default: () => <div>Transactions Page</div>,
}));

jest.mock('../features/persons/components/PersonForm', () => {
  const APP_TEST_VALUES = mockGetAppTestValues();

  return {
    __esModule: true,
    default: ({ onSave, onCancel }: { onSave: (person: unknown) => Promise<void>; onCancel: () => void }) => (
      <div>
        <button
          onClick={() =>
            onSave({
              firstName: 'Test',
              lastName: 'Person',
              dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH,
              addresses: [],
            })
          }
        >
          Save Person
        </button>
        <button onClick={onCancel}>Cancel Person</button>
      </div>
    ),
  };
});

jest.mock('../features/persons/components/PersonList', () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: { onEdit: (person: unknown) => void; onDelete: (id: string) => void }) => (
    <div>
      <button onClick={() => onEdit({ id: 'p1', firstName: 'Edited', lastName: 'Person', addresses: [] })}>Edit Person</button>
      <button onClick={() => onDelete('p1')}>Delete Person</button>
    </div>
  ),
}));

jest.mock('../features/auth/components/LoginPage', () => {
  const APP_TEST_VALUES = mockGetAppTestValues();

  return {
    __esModule: true,
    default: ({ onLogin, onShowRegister, error }: { onLogin: (u: string, p: string) => void; onShowRegister: () => void; error?: string | null }) => (
      <div>
        <h1>Sign In</h1>
        <button onClick={() => onLogin('john.doe', APP_TEST_VALUES.TEST_PASSWORD)}>Submit Login</button>
        <button onClick={onShowRegister}>Go Register</button>
        {error ? <div>{error}</div> : null}
      </div>
    ),
  };
});

jest.mock('../features/auth/components/RegisterPage', () => {
  const APP_TEST_VALUES = mockGetAppTestValues();

  return {
    __esModule: true,
    default: ({ onRegister, onShowLogin }: { onRegister: (request: unknown) => void; onShowLogin: () => void }) => (
      <div>
        <h1>Register</h1>
        <button onClick={() => onRegister({ firstName: 'Jane', lastName: 'Doe', password: APP_TEST_VALUES.TEST_PASSWORD, dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH, addresses: [] })}>Submit Register</button>
        <button onClick={onShowLogin}>Back Login</button>
      </div>
    ),
  };
});

jest.mock('../features/profile/components/ProfilePage', () => {
  const APP_TEST_VALUES = mockGetAppTestValues();

  return {
    __esModule: true,
    default: ({ onSave, onChangePassword }: { onSave: (person: unknown) => Promise<void>; onChangePassword: (c: string, n: string) => Promise<void> }) => (
      <div>
        <h2>Profile Page</h2>
        <button
          onClick={() =>
            onSave({
              firstName: 'John',
              lastName: 'Doe',
              dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH,
              addresses: [],
            })
          }
        >
          Save Profile
        </button>
        <button onClick={() => void onChangePassword('old-password', 'new-password')}>Change Password</button>
      </div>
    ),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  __resetRouterMocks();

  mockAuthStorage.isAuthenticated.mockReturnValue(false);
  mockAuthStorage.getUsername.mockReturnValue(null);
  mockAuthStorage.getPersonId.mockReturnValue(null);
  mockAuthStorage.getDisplayName.mockReturnValue(null);
  mockAuthStorage.getRole.mockReturnValue(null);

  mockAuthApi.login.mockResolvedValue({
    data: { token: 'token', username: 'john.doe', personId: 'p1', displayName: 'John Doe', role: PersonRole.Admin },
  });
  mockAuthApi.register.mockResolvedValue({
    data: { token: 'token2', username: 'jane.doe', personId: 'p2', displayName: 'Jane Doe', role: PersonRole.User },
  });
  mockAuthApi.changePassword.mockResolvedValue({});

  mockPersonApi.getAll.mockResolvedValue({
    data: [
      {
        id: 'p1',
        firstName: 'John',
        lastName: 'Doe',
        role: PersonRole.Admin,
        dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH,
        addresses: [],
      },
    ],
  });
  mockPersonApi.getCurrent.mockResolvedValue({
    data: {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      role: PersonRole.Admin,
      dateOfBirth: APP_TEST_VALUES.MOCK_DATE_OF_BIRTH,
      addresses: [],
    },
  });
  mockPersonApi.create.mockResolvedValue({});
  mockPersonApi.update.mockResolvedValue({});
  mockPersonApi.updateCurrent.mockResolvedValue({});
  mockPersonApi.delete.mockResolvedValue({});
  mockPersonApi.search.mockResolvedValue({ data: [] });
  mockTransactionApi.search.mockResolvedValue({ data: [] });
  mockTransactionApi.create.mockResolvedValue({});
  mockTransactionApi.update.mockResolvedValue({});
  mockTransactionApi.delete.mockResolvedValue({});
  mockDebtsApi.getCurrentUser.mockResolvedValue({ data: [] });
  mockDebtsApi.getCurrentUserDetails.mockResolvedValue({ data: [] });
  mockDebtsApi.settle.mockResolvedValue({});
});

test('handles unauthorized responses by clearing session and returning to login', async () => {
  mockPersonApi.getAll.mockRejectedValueOnce({ response: { status: 401 } });
  __setMockPathname('/persons');

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /submit login/i }));

  await waitFor(() => expect(mockAuthStorage.clearSession).toHaveBeenCalled());
  expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('hydrates auth identity for authenticated legacy sessions missing person metadata', async () => {
  mockAuthStorage.isAuthenticated.mockReturnValue(true);
  mockAuthStorage.getUsername.mockReturnValue('legacy.user');
  mockAuthStorage.getPersonId.mockReturnValue(null);
  mockAuthStorage.getDisplayName.mockReturnValue(null);
  mockAuthStorage.getRole.mockReturnValue(null);
  __setMockPathname('/home');

  render(<App />);

  expect(await screen.findByAltText(/SettleSpace header/i)).toBeInTheDocument();
  await waitFor(() => expect(mockPersonApi.getCurrent).toHaveBeenCalledTimes(1));
  expect(mockAuthStorage.setUsername).toHaveBeenCalledWith('John.Doe');
  expect(mockAuthStorage.setDisplayName).toHaveBeenCalledWith('John Doe');
  expect(mockAuthStorage.setPersonId).toHaveBeenCalledWith('p1');
  expect(mockAuthStorage.setRole).toHaveBeenCalledWith(PersonRole.Admin);
});

test('expires the session when identity hydration is unauthorized', async () => {
  mockAuthStorage.isAuthenticated.mockReturnValue(true);
  mockAuthStorage.getUsername.mockReturnValue('legacy.user');
  mockAuthStorage.getPersonId.mockReturnValue(null);
  mockAuthStorage.getDisplayName.mockReturnValue(null);
  mockAuthStorage.getRole.mockReturnValue(null);
  mockPersonApi.getCurrent.mockRejectedValueOnce({ response: { status: 401 } });
  __setMockPathname('/home');

  render(<App />);

  await waitFor(() => expect(mockAuthStorage.clearSession).toHaveBeenCalled());
  expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('supports login, directory actions, profile actions, and logout', async () => {
  __setMockPathname('/persons');
  const { rerender } = render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /submit login/i }));

  expect(await screen.findByAltText(/SettleSpace header/i)).toBeInTheDocument();
  await waitFor(() => expect(mockPersonApi.getAll).toHaveBeenCalled());
  expect(mockPersonApi.getCurrent).not.toHaveBeenCalled();

  fireEvent.click(screen.getAllByRole('button', { name: /Search John/i })[0]);
  await waitFor(() => expect(mockPersonApi.search).toHaveBeenCalledWith('john'));

  fireEvent.click(screen.getAllByRole('button', { name: /Search Empty/i })[0]);
  await waitFor(() => expect(mockPersonApi.getAll).toHaveBeenCalled());

  fireEvent.click(screen.getAllByRole('button', { name: /Create Person/i })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /Save Person/i })[0]);
  await waitFor(() => expect(mockPersonApi.create).toHaveBeenCalled());

  fireEvent.click(screen.getAllByRole('button', { name: /Edit Person/i })[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /Save Person/i })[0]);
  await waitFor(() => expect(mockPersonApi.update).toHaveBeenCalled());

  fireEvent.click(screen.getAllByRole('button', { name: /Delete Person/i })[0]);
  const deleteDialog = screen.getByRole('dialog');
  fireEvent.click(within(deleteDialog).getByRole('button', { name: /^Delete$/i }));
  await waitFor(() => expect(mockPersonApi.delete).toHaveBeenCalledWith('p1'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /john doe/i }));
  __setMockPathname('/profile');
  rerender(<App />);

  expect(screen.getByRole('heading', { name: /Profile Page/i })).toBeInTheDocument();
  await waitFor(() => expect(mockPersonApi.getCurrent).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
  await waitFor(() => expect(mockPersonApi.updateCurrent).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
  await waitFor(() => expect(mockAuthApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'old-password', newPassword: 'new-password' }));

  fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));

  await waitFor(() => expect(mockAuthStorage.clearSession).toHaveBeenCalled());
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});
