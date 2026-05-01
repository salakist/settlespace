import { useCallback, useState } from 'react';
import {
  handleRequestError,
  rejectUnauthorizedAction,
} from '../../../shared/api/requestHandling';
import {
  canDeleteTransaction,
  canUpdateTransaction,
} from '../../../shared/auth/permissions';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { PersonRole, Transaction } from '../../../shared/types';
import { transactionApi } from '../api';
import { TransactionSearchQuery } from '../types';

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
    expireSession(SESSION_EXPIRED_MESSAGE);
  }, [clearTransactionsState, expireSession]);

  const handleSearch = useCallback(async (query: TransactionSearchQuery = {}) => {
    const searchQuery: TransactionSearchQuery = { ...query };
    if (searchQuery.freeText) {
      searchQuery.freeText = searchQuery.freeText.trim();
    }

    try {
      setLoading(true);
      const response = await transactionApi.search(searchQuery);
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

  const handleSave = useCallback(async (transactionData: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) => {
    try {
      if (editingTransaction?.id) {
        await transactionApi.update(editingTransaction.id, transactionData);
      } else {
        await transactionApi.create(transactionData);
      }

      setEditingTransaction(undefined);
      setShowForm(false);
      await handleSearch();
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
  }, [editingTransaction, handleSearch, handleUnauthorized]);

  const handleEdit = useCallback((transaction: Transaction) => {
    if (rejectUnauthorizedAction(
      canUpdateTransaction(role, currentPersonId, transaction),
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
      canDeleteTransaction(role, currentPersonId, target),
      setError,
      'You are not allowed to delete this transaction.',
    )) {
      return;
    }

    try {
      await transactionApi.delete(id);
      await handleSearch();
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to delete transaction',
        forbiddenMessage: 'You are not allowed to delete this transaction.',
      });
    }
  }, [currentPersonId, handleSearch, handleUnauthorized, role, transactions]);

  const handleCancel = useCallback(() => {
    setEditingTransaction(undefined);
    setShowForm(false);
  }, []);

  const showCreateForm = useCallback(() => {
    setEditingTransaction(undefined);
    setShowForm(true);
  }, []);

  const handleConfirm = useCallback(async (id: string) => {
    try {
      const response = await transactionApi.confirm(id);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? response.data : t)),
      );
      setError(null);
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to confirm transaction',
        forbiddenMessage: 'You are not allowed to confirm this transaction.',
      });
    }
  }, [handleUnauthorized]);

  const handleRefuse = useCallback(async (id: string) => {
    try {
      const response = await transactionApi.refuse(id);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? response.data : t)),
      );
      setError(null);
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to refuse transaction',
        forbiddenMessage: 'You are not allowed to refuse this transaction.',
      });
    }
  }, [handleUnauthorized]);

  return {
    editingTransaction,
    error,
    handleCancel,
    handleConfirm,
    handleDelete,
    handleEdit,
    handleRefuse,
    handleSave,
    handleSearch,
    loading,
    showCreateForm,
    showForm,
    transactions,
  };
}
