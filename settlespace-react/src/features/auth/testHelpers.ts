import { PersonRole } from '../../shared/types';

export type AuthApiMock = {
  login: jest.Mock;
  register: jest.Mock;
  changePassword?: jest.Mock;
};

export type AuthApiModule<T extends AuthApiMock = AuthApiMock> = {
  authApi: T;
};

export type AuthStorageMock = {
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

export function createAuthApiMock(): Required<AuthApiMock> {
  return {
    login: jest.fn(),
    register: jest.fn(),
    changePassword: jest.fn(),
  };
}

export function createAuthStorageMock(): AuthStorageMock {
  return {
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
  };
}

type SessionOverrides = {
  isAuthenticated?: boolean;
  username?: string | null;
  personId?: string | null;
  displayName?: string | null;
  role?: PersonRole | null;
};

type AuthResponse = {
  token: string;
  username: string;
  personId: string;
  displayName: string;
  role: PersonRole;
};

export type AuthStorageModule = {
  authStorage: AuthStorageMock;
};

export function getAuthApiMock<T extends AuthApiMock>(mockedModule: AuthApiModule<T>): T {
  return mockedModule.authApi;
}

export function getAuthStorageMock(mockedModule: AuthStorageModule): AuthStorageMock {
  return mockedModule.authStorage;
}

export function seedAuthStorage(
  authStorage: AuthStorageMock,
  overrides: SessionOverrides = {},
): void {
  const session = {
    isAuthenticated: false,
    username: null,
    personId: null,
    displayName: null,
    role: null,
    ...overrides,
  };

  authStorage.isAuthenticated.mockReturnValue(session.isAuthenticated);
  authStorage.getUsername.mockReturnValue(session.username);
  authStorage.getPersonId.mockReturnValue(session.personId);
  authStorage.getDisplayName.mockReturnValue(session.displayName);
  authStorage.getRole.mockReturnValue(session.role);
}

export function seedSuccessfulAuthResponses(
  authApi: AuthApiMock,
  overrides: { login?: AuthResponse; register?: AuthResponse } = {},
): void {
  authApi.login.mockResolvedValue({
    data: overrides.login ?? {
      token: 't1',
      username: 'john.doe',
      personId: 'p1',
      displayName: 'John Doe',
      role: PersonRole.User,
    },
  });

  authApi.register.mockResolvedValue({
    data: overrides.register ?? {
      token: 't2',
      username: 'jane.doe',
      personId: 'p2',
      displayName: 'Jane Doe',
      role: PersonRole.User,
    },
  });

  authApi.changePassword?.mockResolvedValue({});
}
