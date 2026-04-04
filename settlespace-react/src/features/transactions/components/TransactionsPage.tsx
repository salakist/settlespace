import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { Person, PersonRole, Transaction } from '../../../shared/types';
import SearchBar from '../../persons/components/SearchBar';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { useTransactions } from '../hooks/useTransactions';

type TransactionsPageProps = {
  persons: Person[];
  currentPersonId?: string;
  role: PersonRole | null;
  expireSession: (message?: string) => void;
};

const TransactionsPage: React.FC<TransactionsPageProps> = ({ persons, currentPersonId, role, expireSession }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const decodedTransactionId = transactionId ? decodeURIComponent(transactionId) : undefined;
  const isCreateRoute = location.pathname.endsWith('/new');
  const currentRouteKey = useMemo(() => {
    if (isCreateRoute) {
      return 'create';
    }

    if (decodedTransactionId) {
      return `edit:${decodedTransactionId}`;
    }

    return 'list';
  }, [decodedTransactionId, isCreateRoute]);
  const lastSyncedRouteKey = useRef<string>('');
  const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState<{ id: string; label: string } | null>(null);

  const {
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
  } = useTransactions({ expireSession, currentPersonId, role });

  const routedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === decodedTransactionId),
    [decodedTransactionId, transactions],
  );

  const canManageTransaction = (transaction: Transaction) => canUpdateOrDeleteTransaction(role, currentPersonId, transaction);

  useEffect(() => {
    const loadPage = async () => {
      if (searchQuery) {
        await handleSearch(searchQuery);
        return;
      }

      await loadTransactions();
    };

    Promise.resolve(loadPage()).catch((loadError) => {
      console.error(loadError);
    });
  }, [handleSearch, loadTransactions, searchQuery]);

  useEffect(() => {
    if (lastSyncedRouteKey.current === currentRouteKey) {
      return;
    }

    if (currentRouteKey === 'create') {
      showCreateForm();
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    if (decodedTransactionId) {
      if (!routedTransaction) {
        return;
      }

      handleEdit(routedTransaction);
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    handleCancel();
    lastSyncedRouteKey.current = currentRouteKey;
  }, [currentRouteKey, decodedTransactionId, handleCancel, handleEdit, routedTransaction, showCreateForm]);

  const displayForm = showForm || currentRouteKey !== 'list';
  const currentEditingTransaction = editingTransaction ?? routedTransaction;

  const handleSearchChange = (query: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      nextSearchParams.set('search', trimmedQuery);
    } else {
      nextSearchParams.delete('search');
    }

    setSearchParams(nextSearchParams);
  };

  const navigateToList = () => {
    navigate(searchQuery ? `/transactions?search=${encodeURIComponent(searchQuery)}` : '/transactions');
  };

  const handleAddClick = () => {
    lastSyncedRouteKey.current = 'create';
    showCreateForm();
    navigate('/transactions/new');
  };

  const handleEditNavigate = (transaction: Transaction) => {
    if (!transaction.id) {
      return;
    }

    lastSyncedRouteKey.current = `edit:${transaction.id}`;
    handleEdit(transaction);
    navigate(`/transactions/${encodeURIComponent(transaction.id)}/edit`);
  };

  const handleDeleteRequest = (id: string) => {
    const targetTransaction = transactions.find((transaction) => transaction.id === id);
    const label = targetTransaction?.description ? `"${targetTransaction.description}"` : 'this transaction';

    setPendingDeleteTransaction({ id, label });
  };

  const handleDeleteCancel = () => {
    setPendingDeleteTransaction(null);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDeleteTransaction?.id) {
      return;
    }

    void handleDelete(pendingDeleteTransaction.id);
    setPendingDeleteTransaction(null);
  };

  const handleSaveAndClose = async (
    transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>,
  ) => {
    await handleSave(transaction);
    navigateToList();
  };

  const handleCancelAndClose = () => {
    handleCancel();
    navigateToList();
  };

  return (
    <Stack spacing={2.5}>
      {!displayForm && (
        <SearchBar
          onSearch={handleSearchChange}
          placeholder="Search by description, category, or involved person's name"
          initialQuery={searchQuery}
          action={(
            <Button variant="contained" onClick={handleAddClick} sx={{ whiteSpace: 'nowrap', px: 3.5 }}>
              Create Transaction
            </Button>
          )}
        />
      )}

      {displayForm && (
        <TransactionForm
          transaction={currentEditingTransaction}
          persons={persons}
          currentPersonId={currentPersonId}
          role={role}
          onSave={handleSaveAndClose}
          onCancel={handleCancelAndClose}
        />
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        !displayForm && (
          <TransactionList
            transactions={transactions}
            persons={persons}
            currentPersonId={currentPersonId}
            canManage={canManageTransaction}
            onEdit={handleEditNavigate}
            onDelete={handleDeleteRequest}
          />
        )
      )}

      <ConfirmationDialog
        open={Boolean(pendingDeleteTransaction)}
        title="Delete transaction?"
        message={pendingDeleteTransaction
          ? `Are you sure you want to delete ${pendingDeleteTransaction.label}? This action cannot be undone.`
          : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Stack>
  );
};

export default TransactionsPage;
