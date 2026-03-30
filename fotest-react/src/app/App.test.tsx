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

const ARIA_SELECTED = 'aria-selected';
const mockPersonsPage = jest.fn(() => <div>Persons Page</div>);

jest.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../features/persons/hooks/usePersons', () => ({
  usePersons: jest.fn(),
}));

jest.mock('../features/profile/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

jest.mock('./hooks/useAppAuth', () => ({
  useAppAuth: jest.fn(),
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

jest.mock('../features/persons/components/PersonsPage', () => ({
  __esModule: true,
  default: (props: unknown) => mockPersonsPage(props),
}));

jest.mock('../features/profile/components/ProfilePage', () => ({
  __esModule: true,
  default: () => <h2>Profile Page</h2>,
}));

jest.mock('../features/transactions/components/TransactionsPage', () => ({
  __esModule: true,
  default: () => <div>Transactions Page</div>,
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

const { useAppAuth: mockUseAppAuth } = jest.requireMock('./hooks/useAppAuth') as {
  useAppAuth: jest.Mock;
};

const App = require('./App').default;

const setAuthenticatedSession = (currentPersonId?: string) => {
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
    currentPerson: { id: currentPersonId, firstName: 'John', lastName: 'Doe', addresses: [] },
    handlePasswordChange: jest.fn(),
    handleProfileSave: jest.fn(),
    loadCurrentPerson: jest.fn(),
    passwordLoading: false,
    profileError: null,
    profileLoading: false,
    profileSaveLoading: false,
    setProfileIdle: jest.fn(),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetRouterMocks();
  mockPersonsPage.mockClear();

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
    saveLoading: false,
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

  mockUseAppAuth.mockReturnValue({
    handleLogin: jest.fn(),
    handleLogout: jest.fn(),
    handleRegister: jest.fn(),
  });
});

test('renders authentication shell when user is unauthenticated', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByText(/FoTest Person Manager/i)).not.toBeInTheDocument();
});

test('renders authenticated shell and calls handleLogout on logout click', () => {
  const handleLogout = jest.fn();

  setAuthenticatedSession();

  mockUseAppAuth.mockReturnValue({
    handleLogin: jest.fn(),
    handleLogout,
    handleRegister: jest.fn(),
  });

  render(<App />);

  expect(screen.getByText(/FoTest Person Manager/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /log out/i }));

  expect(handleLogout).toHaveBeenCalled();
});

test('renders home navigation tabs and shows welcome content', () => {
  setAuthenticatedSession();

  render(<App />);

  expect(screen.getByRole('tab', { name: /home/i })).toHaveAttribute(ARIA_SELECTED, 'true');
  expect(screen.getByRole('tab', { name: /persons/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /john doe/i })).toBeInTheDocument();
  expect(screen.getByText(/welcome back, john doe!/i)).toBeInTheDocument();
});

test('renders non-home tabs and navigates correctly', () => {
  __setMockPathname('/profile');

  setAuthenticatedSession();

  render(<App />);

  const homeTab = screen.getByRole('tab', { name: /home/i });
  const personsTab = screen.getByRole('tab', { name: /persons/i });
  const profileButton = screen.getByRole('button', { name: /john doe/i });

  expect(profileButton).toBeInTheDocument();
  expect(personsTab).toHaveAttribute(ARIA_SELECTED, 'false');
  expect(homeTab).toHaveAttribute(ARIA_SELECTED, 'false');

  fireEvent.click(homeTab);
  fireEvent.click(personsTab);
  fireEvent.click(profileButton);

  expect(__mockNavigate).toHaveBeenNthCalledWith(1, '/home');
  expect(__mockNavigate).toHaveBeenNthCalledWith(2, '/persons');
  expect(__mockNavigate).toHaveBeenNthCalledWith(3, '/profile');
});

test('does not pass logged-in user to persons page list', () => {
  __setMockPathname('/persons');
  setAuthenticatedSession('1');

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
    persons: [
      { id: '1', firstName: 'John', lastName: 'Doe', addresses: [] },
      { id: '2', firstName: 'Jane', lastName: 'Smith', addresses: [] },
    ],
    saveLoading: false,
    setDirectoryIdle: jest.fn(),
    setPersonInList: jest.fn(),
    showCreateForm: jest.fn(),
    showForm: false,
  });

  render(<App />);

  expect(mockPersonsPage).toHaveBeenCalled();

  const personsPageProps = mockPersonsPage.mock.calls[0][0] as { persons: Array<{ id: string }> };
  expect(personsPageProps.persons).toEqual([
    { id: '2', firstName: 'Jane', lastName: 'Smith', addresses: [] },
  ]);
});
