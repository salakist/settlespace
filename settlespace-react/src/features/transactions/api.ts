import { apiClient } from '../../shared/api/client';
import { Transaction } from '../../shared/types';
import { TransactionSearchQuery } from './types';

export const transactionApi = {
  getById: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`),
  search: (query: TransactionSearchQuery) => apiClient.post<Transaction[]>('/transactions/search', query),
  create: (transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    apiClient.post<Transaction>('/transactions', transaction),
  update: (id: string, transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) =>
    apiClient.put(`/transactions/${id}`, transaction),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
};
