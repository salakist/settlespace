import axios from 'axios';
import { Transaction, TransactionInvolvement, TransactionStatus } from '../types';
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

export interface TransactionSearchQuery {
  freeText?: string;
  status?: TransactionStatus[];
  involvement?: TransactionInvolvement;
  category?: string;
  description?: string;
  involved?: string[];
  managedBy?: string[];
  payer?: string;
  payee?: string;
}

export const transactionApi = {
  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),
  search: (query: TransactionSearchQuery) => api.post<Transaction[]>('/transactions/search', query),
  create: (transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    api.post<Transaction>('/transactions', transaction),
  update: (id: string, transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    api.put(`/transactions/${id}`, transaction),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};
