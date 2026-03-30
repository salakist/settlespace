import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('react-router-dom');

const {
  __mockNavigate,
  __resetRouterMocks,
  __setMockPathname,
} = jest.requireMock('react-router-dom') as {
  __mockNavigate: jest.Mock;
  __resetRouterMocks: () => void;
  __setMockPathname: (pathname: string) => void;
};

jest.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../features/persons/hooks/usePersons', () => ({
  usePersons: jest.fn(),
}));

jest.mock('../features/profile/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('../features/auth/components/LoginPage', () => ({
  __esModule: true,
  default: ({ onShowRegister, error }: { onShowRegister: () => void; error?: string | null }) => (
    <div>
      <h1>Sign In</h1>
      <button onClick={onShowRegister}>Go Register</button>
      {error ? <div>{error}</div> : null}
    </div>
  ),
}));

jest.mock('../features/auth/components/RegisterPage', () => ({
  __esModule: true,
  default: ({ onShowLogin }: { onShowLogin: () => void }) => (
    <div>
      <h1>Register</h1>
      <button onClick={onShowLogin}>Back Login</button>
    </div>
  ),
}));

jest.mock('../features/persons/components/SearchBar', () => ({
  __esModule: true,
  default: () => <div>Search Bar</div>,
}));

jest.mock('../features/persons/components/PersonForm', () => ({
  __esModule: true,
  default: () => <div>Person Form</div>,
}));

jest.mock('../features/persons/components/PersonList', () => ({
  __esModule: true,
  default: () => <div>Person List</div>,
}));

jest.mock('../features/profile/components/ProfilePage', () => ({
  __esModule: true,
  default: () => <h2>Profile Page</h2>,
}));

const { useAuth: mockUseAuth } = jest.requireMock('../features/auth/hooks/useAuth') as {
  useAuth: jest.Mock;
};

const { usePersons: mockUsePersons } = jest.requireMock('../features/persons/hooks/usePersons') as {
  usePersons: jest.Mock;
};

const { useProfile: mockUseProfile } = jest.requireMock('../features/profile/hooks/useProfile') as {
  useProfile: jest.Mock;
};

const App = require('./App').default;

beforeEach(() => {
  jest.clearAllMocks();
  __resetRouterMocks();

  mockUseAuth.mockReturnValue({
    authError: null,
    authLoading: false,
    clearAuthError: jest.fn(),
    expireSession: jest.fn(),
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    setAuthUsername: jest.fn(),
    username: '',
  });

  mockUsePersons.mockReturnValue({
    clearPersonsError: jest.fn(),
    clearPersonsState: jest.fn(),
    editingPerson: undefined,
    error: null,
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleSearch: jest.fn(),
    loadPersons: jest.fn(),
    loading: false,
    persons: [],
    setDirectoryIdle: jest.fn(),
    setPersonInList: jest.fn(),
    showCreateForm: jest.fn(),
    showForm: false,
  });

  mockUseProfile.mockReturnValue({
    clearProfileState: jest.fn(),
    currentPerson: null,
    handlePasswordChange: jest.fn(),
    handleProfileSave: jest.fn(),
    loadCurrentPerson: jest.fn(),
    passwordLoading: false,
    profileError: null,
    profileLoading: false,
    profileSaveLoading: false,
    setProfileIdle: jest.fn(),
  });
});

test('renders authentication shell when user is unauthenticated', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByText(/FoTest Person Manager/i)).not.toBeInTheDocument();
});

test('renders authenticated shell and calls composed logout actions', () => {
  const clearPersonsState = jest.fn();
  const clearProfileState = jest.fn();
  const logout = jest.fn();

  mockUseAuth.mockReturnValue({
    authError: null,
    authLoading: false,
    clearAuthError: jest.fn(),
    expireSession: jest.fn(),
    isAuthenticated: true,
    login: jest.fn(),
    logout,
    register: jest.fn(),
    setAuthUsername: jest.fn(),
    username: 'john.doe',
  });

  mockUsePersons.mockReturnValue({
    clearPersonsError: jest.fn(),
    clearPersonsState,
    editingPerson: undefined,
    error: null,
    handleCancel: jest.fn(),
    handleDelete: jest.fn(),
    handleEdit: jest.fn(),
    handleSave: jest.fn(),
    handleSearch: jest.fn(),
    loadPersons: jest.fn(),
    loading: false,
    persons: [],
    setDirectoryIdle: jest.fn(),
    setPersonInList: jest.fn(),
    showCreateForm: jest.fn(),
    showForm: false,
  });

  mockUseProfile.mockReturnValue({
    clearProfileState,
    currentPerson: { firstName: 'John', lastName: 'Doe', addresses: [] },
    handlePasswordChange: jest.fn(),
    handleProfileSave: jest.fn(),
    loadCurrentPerson: jest.fn(),
    passwordLoading: false,
    profileError: null,
    profileLoading: false,
    profileSaveLoading: false,
    setProfileIdle: jest.fn(),
  });

  render(<App />);

  expect(screen.getByText(/FoTest Person Manager/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /log out/i }));

  expect(clearPersonsState).toHaveBeenCalled();
  expect(clearProfileState).toHaveBeenCalled();
  expect(logout).toHaveBeenCalled();
});

test('renders home top bar without back to home and shows welcome content', () => {
  mockUseAuth.mockReturnValue({
    authError: null,
    authLoading: false,
    clearAuthError: jest.fn(),
    expireSession: jest.fn(),
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    setAuthUsername: jest.fn(),
    username: 'john.doe',
  });

  mockUseProfile.mockReturnValue({
    clearProfileState: jest.fn(),
    currentPerson: { firstName: 'John', lastName: 'Doe', addresses: [] },
    handlePasswordChange: jest.fn(),
    handleProfileSave: jest.fn(),
    loadCurrentPerson: jest.fn(),
    passwordLoading: false,
    profileError: null,
    profileLoading: false,
    profileSaveLoading: false,
    setProfileIdle: jest.fn(),
  });

  render(<App />);

  expect(screen.queryByRole('button', { name: /back to home/i })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /persons/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument();
  expect(screen.getByText(/welcome back, john doe!/i)).toBeInTheDocument();
});

test('renders non-home top bar with back to home first and navigates correctly', () => {
  __setMockPathname('/profile');

  mockUseAuth.mockReturnValue({
    authError: null,
    authLoading: false,
    clearAuthError: jest.fn(),
    expireSession: jest.fn(),
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    setAuthUsername: jest.fn(),
    username: 'john.doe',
  });

  render(<App />);

  const backToHomeButton = screen.getByRole('button', { name: /back to home/i });
  const personsButton = screen.getByRole('button', { name: /persons/i });
  const profileButton = screen.getByRole('button', { name: /profile/i });

  expect(backToHomeButton).toBeInTheDocument();
  expect(profileButton).toBeDisabled();
  expect(personsButton).not.toBeDisabled();

  fireEvent.click(backToHomeButton);
  fireEvent.click(personsButton);

  expect(__mockNavigate).toHaveBeenNthCalledWith(1, '/home');
  expect(__mockNavigate).toHaveBeenNthCalledWith(2, '/persons');
});
