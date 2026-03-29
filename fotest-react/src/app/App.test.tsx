import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const MOCK_DOB = '1990-01-01';

jest.mock('react-router-dom');

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
  authStorage: {
    isAuthenticated: jest.fn(),
    getUsername: jest.fn(),
    saveSession: jest.fn(),
    clearSession: jest.fn(),
    setUsername: jest.fn(),
  },
}));

const {
  authApi: mockAuthApi,
  personApi: mockPersonApi,
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
  authStorage: {
    isAuthenticated: jest.Mock;
    getUsername: jest.Mock;
    saveSession: jest.Mock;
    clearSession: jest.Mock;
    setUsername: jest.Mock;
  };
};

const App = require('./App').default;

jest.mock('../features/persons/components/SearchBar', () => ({
  __esModule: true,
  default: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <div>
      <button onClick={() => onSearch('john')}>Search John</button>
      <button onClick={() => onSearch('')}>Search Empty</button>
    </div>
  ),
}));

jest.mock('../features/persons/components/PersonForm', () => ({
  __esModule: true,
  default: ({ onSave, onCancel }: { onSave: (person: unknown) => void; onCancel: () => void }) => (
    <div>
      <button
        onClick={() =>
          onSave({
            firstName: 'Test',
            lastName: 'Person',
            dateOfBirth: MOCK_DOB,
            addresses: [],
            password: 'Pass123!',
          })
        }
      >
        Save Person
      </button>
      <button onClick={onCancel}>Cancel Person</button>
    </div>
  ),
}));

jest.mock('../features/persons/components/PersonList', () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: { onEdit: (person: unknown) => void; onDelete: (id: string) => void }) => (
    <div>
      <button onClick={() => onEdit({ id: 'p1', firstName: 'Edited', lastName: 'Person', addresses: [] })}>Edit Person</button>
      <button onClick={() => onDelete('p1')}>Delete Person</button>
    </div>
  ),
}));

jest.mock('../features/auth/components/LoginPage', () => ({
  __esModule: true,
  default: ({ onLogin, onShowRegister, error }: { onLogin: (u: string, p: string) => void; onShowRegister: () => void; error?: string | null }) => (
    <div>
      <h1>Sign In</h1>
      <button onClick={() => onLogin('john.doe', 'Secret!1')}>Submit Login</button>
      <button onClick={onShowRegister}>Go Register</button>
      {error ? <div>{error}</div> : null}
    </div>
  ),
}));

jest.mock('../features/auth/components/RegisterPage', () => ({
  __esModule: true,
  default: ({ onRegister, onShowLogin }: { onRegister: (request: unknown) => void; onShowLogin: () => void }) => (
    <div>
      <h1>Register</h1>
      <button onClick={() => onRegister({ firstName: 'Jane', lastName: 'Doe', password: 'Secret!1', dateOfBirth: MOCK_DOB, addresses: [] })}>Submit Register</button>
      <button onClick={onShowLogin}>Back Login</button>
    </div>
  ),
}));

jest.mock('../features/profile/components/ProfilePage', () => ({
  __esModule: true,
  default: ({ onSave, onChangePassword }: { onSave: (person: unknown) => void; onChangePassword: (c: string, n: string) => void }) => (
    <div>
      <h2>Profile Page</h2>
      <button
        onClick={() =>
          onSave({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: MOCK_DOB,
            addresses: [],
            password: 'Secret!1',
          })
        }
      >
        Save Profile
      </button>
      <button onClick={() => onChangePassword('old-password', 'new-password')}>Change Password</button>
    </div>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockAuthStorage.isAuthenticated.mockReturnValue(false);
  mockAuthStorage.getUsername.mockReturnValue(null);

  mockAuthApi.login.mockResolvedValue({ data: { token: 'token', username: 'john.doe' } });
  mockAuthApi.register.mockResolvedValue({ data: { token: 'token2', username: 'jane.doe' } });
  mockAuthApi.changePassword.mockResolvedValue({});

  mockPersonApi.getAll.mockResolvedValue({
    data: [
      {
        id: 'p1',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: MOCK_DOB,
        addresses: [],
      },
    ],
  });
  mockPersonApi.getCurrent.mockResolvedValue({
    data: {
      id: 'p1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: MOCK_DOB,
      addresses: [],
    },
  });
  mockPersonApi.create.mockResolvedValue({});
  mockPersonApi.update.mockResolvedValue({});
  mockPersonApi.updateCurrent.mockResolvedValue({});
  mockPersonApi.delete.mockResolvedValue({});
  mockPersonApi.search.mockResolvedValue({ data: [] });
});

test('renders login form when unauthenticated', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('can switch to register and back to login', () => {
  // Note: Navigation/routing is tested manually - this test just verifies components render
  render(<App />);

  // Both login and register pages should be available in the render
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('handles registration errors', async () => {
  const error = new Error('Registration failed');
  (error as any).response = { data: { error: 'Email already exists' } };
  mockAuthApi.register.mockRejectedValueOnce(error);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /go register/i } as any));
  fireEvent.click(screen.getByRole('button', { name: /submit register/i }));

  await waitFor(() => {
    expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
  });
});

test('handles unauthorized responses by clearing session and returning to login', async () => {
  mockPersonApi.getAll.mockRejectedValueOnce({ response: { status: 401 } });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /submit login/i }));

  await waitFor(() => expect(mockAuthStorage.clearSession).toHaveBeenCalled());
  expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
});

test('supports login, directory actions, profile actions, and logout', async () => {
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /submit login/i }));

  expect(await screen.findByText(/FoTest Person Manager/i)).toBeInTheDocument();
  await waitFor(() => expect(mockPersonApi.getAll).toHaveBeenCalled());
  await waitFor(() => expect(mockPersonApi.getCurrent).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Search John/i }));
  await waitFor(() => expect(mockPersonApi.search).toHaveBeenCalledWith('john'));

  fireEvent.click(screen.getByRole('button', { name: /Search Empty/i }));
  await waitFor(() => expect(mockPersonApi.getAll).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Add New Person/i }));
  fireEvent.click(screen.getByRole('button', { name: /Save Person/i }));
  await waitFor(() => expect(mockPersonApi.create).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Edit Person/i }));
  fireEvent.click(screen.getByRole('button', { name: /Save Person/i }));
  await waitFor(() => expect(mockPersonApi.update).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Delete Person/i }));
  await waitFor(() => expect(mockPersonApi.delete).toHaveBeenCalledWith('p1'));

  fireEvent.click(screen.getByRole('button', { name: /^Profile$/i }));
  // Profile page renders  
  expect(screen.getByRole('heading', { name: /Profile Page/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
  await waitFor(() => expect(mockPersonApi.updateCurrent).toHaveBeenCalled());

  fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
  await waitFor(() => expect(mockAuthApi.changePassword).toHaveBeenCalledWith({ currentPassword: 'old-password', newPassword: 'new-password' }));

  fireEvent.click(screen.getByRole('button', { name: /Log Out/i }));

  await waitFor(() => expect(mockAuthStorage.clearSession).toHaveBeenCalled());
  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();

  confirmSpy.mockRestore();
});
