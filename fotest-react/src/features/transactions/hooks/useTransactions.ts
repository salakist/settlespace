import { useCallback, useState } from 'react';
import { transactionApi } from '../../../shared/api/transactionApi';
import { Transaction } from '../../../shared/types';

type UseTransactionsOptions = {
  expireSession: (message?: string) => void;
};

export function useTransactions({ expireSession }: UseTransactionsOptions) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearTransactionsState = useCallback(() => {
    setTransactions([]);
    setEditingTransaction(undefined);
    setShowForm(false);
    setError(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearTransactionsState();
    expireSession('Your session expired. Please log in again.');
  }, [clearTransactionsState, expireSession]);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await transactionApi.getCurrentUser();
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadTransactions();
      return;
    }

    try {
      setLoading(true);
      const response = await transactionApi.searchCurrentUser(query);
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, loadTransactions]);

  const handleSave = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) => {
    try {
      if (editingTransaction?.id) {
        await transactionApi.update(editingTransaction.id, transactionData);
      } else {
        await transactionApi.create(transactionData);
      }

      setEditingTransaction(undefined);
      setShowForm(false);
      await loadTransactions();
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to save transaction');
      console.error(err);
    }
  }, [editingTransaction, handleUnauthorized, loadTransactions]);

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!globalThis.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionApi.delete(id);
      await loadTransactions();
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to delete transaction');
      console.error(err);
    }
  }, [handleUnauthorized, loadTransactions]);

  const handleCancel = useCallback(() => {
    setEditingTransaction(undefined);
    setShowForm(false);
  }, []);

  const showCreateForm = useCallback(() => {
    setEditingTransaction(undefined);
    setShowForm(true);
  }, []);

  return {
    clearTransactionsState,
    editingTransaction,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSave,
    handleSearch,
    loadTransactions,
    loading,
    showCreateForm,
    showForm,
    transactions,
  };
}
