import { useCallback, useState } from 'react';
import {
  handleRequestError,
  rejectUnauthorizedAction,
} from '../../../shared/api/requestHandling';
import { transactionApi } from '../../../shared/api/transactionApi';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
import { PersonRole, Transaction } from '../../../shared/types';

type UseTransactionsOptions = {
  expireSession: (message?: string) => void;
  currentPersonId?: string;
  role: PersonRole | null;
};

export function useTransactions({ expireSession, currentPersonId, role }: UseTransactionsOptions) {
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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load transactions',
      });
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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Search failed',
      });
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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to save transaction',
        forbiddenMessage: 'You are not allowed to save this transaction.',
        rethrow: true,
      });
    }
  }, [editingTransaction, handleUnauthorized, loadTransactions]);

  const handleEdit = useCallback((transaction: Transaction) => {
    if (rejectUnauthorizedAction(
      canUpdateOrDeleteTransaction(role, currentPersonId, transaction),
      setError,
      'You are not allowed to edit this transaction.',
    )) {
      return;
    }

    setEditingTransaction(transaction);
    setShowForm(true);
  }, [currentPersonId, role]);

  const handleDelete = useCallback(async (id: string) => {
    const target = transactions.find((transaction) => transaction.id === id);
    if (target && rejectUnauthorizedAction(
      canUpdateOrDeleteTransaction(role, currentPersonId, target),
      setError,
      'You are not allowed to delete this transaction.',
    )) {
      return;
    }

    if (!globalThis.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await transactionApi.delete(id);
      await loadTransactions();
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to delete transaction',
        forbiddenMessage: 'You are not allowed to delete this transaction.',
      });
    }
  }, [currentPersonId, handleUnauthorized, loadTransactions, role, transactions]);

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
