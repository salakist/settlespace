import axios from 'axios';
import { ChangePasswordRequest, LoginRequest, LoginResponse, Person, PersonRole, RegisterRequest } from '../types';

const API_BASE_URL = 'http://localhost:5279/api';
const TOKEN_STORAGE_KEY = 'settlespace.auth.token';
const USERNAME_STORAGE_KEY = 'settlespace.auth.username';
const PERSON_ID_STORAGE_KEY = 'settlespace.auth.personId';
const DISPLAY_NAME_STORAGE_KEY = 'settlespace.auth.displayName';
const ROLE_STORAGE_KEY = 'settlespace.auth.role';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  getUsername: () => localStorage.getItem(USERNAME_STORAGE_KEY),
  getPersonId: () => localStorage.getItem(PERSON_ID_STORAGE_KEY),
  getDisplayName: () => localStorage.getItem(DISPLAY_NAME_STORAGE_KEY),
  getRole: () => localStorage.getItem(ROLE_STORAGE_KEY) as PersonRole | null,
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  setUsername: (username: string) => localStorage.setItem(USERNAME_STORAGE_KEY, username),
  setPersonId: (personId: string) => localStorage.setItem(PERSON_ID_STORAGE_KEY, personId),
  clearPersonId: () => localStorage.removeItem(PERSON_ID_STORAGE_KEY),
  setDisplayName: (displayName: string) => localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName),
  clearDisplayName: () => localStorage.removeItem(DISPLAY_NAME_STORAGE_KEY),
  setRole: (role: PersonRole) => localStorage.setItem(ROLE_STORAGE_KEY, role),
  saveSession: (response: LoginResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USERNAME_STORAGE_KEY, response.username);
    localStorage.setItem(PERSON_ID_STORAGE_KEY, response.personId);
    localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, response.displayName);
    localStorage.setItem(ROLE_STORAGE_KEY, response.role);
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USERNAME_STORAGE_KEY);
    localStorage.removeItem(PERSON_ID_STORAGE_KEY);
    localStorage.removeItem(DISPLAY_NAME_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
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