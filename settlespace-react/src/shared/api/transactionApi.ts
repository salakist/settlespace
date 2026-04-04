import axios from 'axios';
import { Transaction } from '../types';

const API_BASE_URL = 'http://localhost:5279/api';
const TOKEN_STORAGE_KEY = 'settlespace.auth.token';

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

export interface TransactionSearchQuery {
  freeText?: string;
  status?: string[];
}

export const transactionApi = {
  getCurrentUser: () => api.get<Transaction[]>('/transactions/me'),
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  searchCurrentUser: (query: string) => api.get<Transaction[]>(`/transactions/me/search/${query}`),
  search: (query: TransactionSearchQuery) => api.post<Transaction[]>('/transactions/search', query),
  create: (transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    api.post<Transaction>('/transactions', transaction),
  update: (id: string, transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    api.put(`/transactions/${id}`, transaction),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};
