import axios from 'axios';
import { ChangePasswordRequest, LoginRequest, LoginResponse, Person, RegisterRequest } from './types';

const API_BASE_URL = 'http://localhost:5279/api';
const TOKEN_STORAGE_KEY = 'fotest.auth.token';
const USERNAME_STORAGE_KEY = 'fotest.auth.username';

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
  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  saveSession: (response: LoginResponse) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USERNAME_STORAGE_KEY, response.username);
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USERNAME_STORAGE_KEY);
  },
};

export const authApi = {
  login: (request: LoginRequest) => api.post<LoginResponse>('/auth/login', request),
  register: (request: RegisterRequest) => api.post<LoginResponse>('/auth/register', request),
  changePassword: (request: ChangePasswordRequest) => api.post('/auth/change-password', request),
};

export const personApi = {
  getAll: () => api.get<Person[]>('/persons'),
  getById: (id: string) => api.get<Person>(`/persons/${id}`),
  create: (person: Omit<Person, 'id'>) => api.post<Person>('/persons', person),
  update: (id: string, person: Omit<Person, 'id'>) => api.put(`/persons/${id}`, person),
  delete: (id: string) => api.delete(`/persons/${id}`),
  search: (query: string) => api.get<Person[]>(`/persons/search/${query}`),
};