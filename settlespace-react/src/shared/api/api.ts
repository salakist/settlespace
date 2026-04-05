import axios from 'axios';
import { ChangePasswordRequest, LoginRequest, LoginResponse, Person, PersonRole, RegisterRequest, parsePersonRole } from '../types';
import { API_BASE_URL, AUTH_STORAGE_KEYS } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export const authApi = {
  login: (request: LoginRequest) => api.post<LoginResponse>('/auth/login', request),
  register: (request: RegisterRequest) => api.post<LoginResponse>('/auth/register', request),
  changePassword: (request: ChangePasswordRequest) => api.post('/auth/change-password', request),
};

export const personApi = {
  getAll: () => api.get<Person[]>('/persons'),
  getCurrent: () => api.get<Person>('/persons/me'),
  getById: (id: string) => api.get<Person>(`/persons/${id}`),
  create: (person: Omit<Person, 'id'>) => api.post<Person>('/persons', person),
  update: (id: string, person: Omit<Person, 'id'>) => api.put(`/persons/${id}`, person),
  updateCurrent: (person: Omit<Person, 'id'>) => api.put('/persons/me', person),
  delete: (id: string) => api.delete(`/persons/${id}`),
  search: (query: string) => api.get<Person[]>(`/persons/search/${query}`),
};