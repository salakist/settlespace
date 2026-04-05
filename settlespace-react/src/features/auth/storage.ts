import { AUTH_STORAGE_KEYS } from '../../shared/api/constants';
import { PersonRole, parsePersonRole } from '../../shared/types';
import { LoginResponse } from './types';

export const authStorage = {
  getToken: () => localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN),
  getUsername: () => localStorage.getItem(AUTH_STORAGE_KEYS.USERNAME),
  getPersonId: () => localStorage.getItem(AUTH_STORAGE_KEYS.PERSON_ID),
  getDisplayName: () => localStorage.getItem(AUTH_STORAGE_KEYS.DISPLAY_NAME),
  getRole: (): PersonRole | null => parsePersonRole(localStorage.getItem(AUTH_STORAGE_KEYS.ROLE)),
  isAuthenticated: () => Boolean(localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)),
  setUsername: (username: string) => localStorage.setItem(AUTH_STORAGE_KEYS.USERNAME, username),
  setPersonId: (personId: string) => localStorage.setItem(AUTH_STORAGE_KEYS.PERSON_ID, personId),
  clearPersonId: () => localStorage.removeItem(AUTH_STORAGE_KEYS.PERSON_ID),
  setDisplayName: (displayName: string) => localStorage.setItem(AUTH_STORAGE_KEYS.DISPLAY_NAME, displayName),
  clearDisplayName: () => localStorage.removeItem(AUTH_STORAGE_KEYS.DISPLAY_NAME),
  setRole: (role: PersonRole) => localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, role),
  saveSession: (response: LoginResponse) => {
    localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, response.token);
    localStorage.setItem(AUTH_STORAGE_KEYS.USERNAME, response.username);
    localStorage.setItem(AUTH_STORAGE_KEYS.PERSON_ID, response.personId);
    localStorage.setItem(AUTH_STORAGE_KEYS.DISPLAY_NAME, response.displayName);
    localStorage.setItem(AUTH_STORAGE_KEYS.ROLE, response.role);
  },
  clearSession: () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USERNAME);
    localStorage.removeItem(AUTH_STORAGE_KEYS.PERSON_ID);
    localStorage.removeItem(AUTH_STORAGE_KEYS.DISPLAY_NAME);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ROLE);
  },
};
