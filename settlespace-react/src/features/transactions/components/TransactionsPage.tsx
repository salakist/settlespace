import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, LinearProgress, Stack } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import {
  Person,
  PersonRole,
  Transaction,
} from '../../../shared/types';
import { TransactionSearchQuery } from '../types';
import TransactionSearchBar from './TransactionSearchBar';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

type TransactionsPageProps = {
  transactions: Transaction[];
  persons: Person[];
  loading: boolean;
  error: string | null;
  personsLoading: boolean;
  personsError: string | null;
  showForm: boolean;
  editingTransaction?: Transaction;
  currentPersonId?: string;
  role: PersonRole | null;
  initialQuery: TransactionSearchQuery;
  listPath: string;
  canUpdate: (transaction: Transaction) => boolean;
  canDelete: (transaction: Transaction) => boolean;
  canConfirm: (transaction: Transaction) => boolean;
  canRefuse: (transaction: Transaction) => boolean;
  onSearch: (query: TransactionSearchQuery) => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>) => Promise<void>;
  onCancel: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onConfirm: (id: string) => void;
  onRefuse: (id: string) => void;
  onAdd: () => void;
};

const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  persons,
  loading,
  error,
  personsLoading,
  personsError,
  showForm,
  editingTransaction,
  currentPersonId,
  role,
  initialQuery,
  listPath,
  canUpdate,
  canDelete,
  canConfirm,
  canRefuse,
  onSearch,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onConfirm,
  onRefuse,
  onAdd,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactionId } = useParams();
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

  const routedTransaction = useMemo(
    () => transactions.find((transaction) => transaction.id === decodedTransactionId),
    [decodedTransactionId, transactions],
  );

  useEffect(() => {
    if (lastSyncedRouteKey.current === currentRouteKey) {
      return;
    }

    if (currentRouteKey === 'create') {
      onAdd();
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    if (decodedTransactionId) {
      if (!routedTransaction) {
        return;
      }

      onEdit(routedTransaction);
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    onCancel();
    lastSyncedRouteKey.current = currentRouteKey;
  }, [currentRouteKey, decodedTransactionId, onAdd, onCancel, onEdit, routedTransaction]);

  const displayForm = showForm || currentRouteKey !== 'list';
  const currentEditingTransaction = editingTransaction ?? routedTransaction;

  const handleAddClick = () => {
    lastSyncedRouteKey.current = 'create';
    onAdd();
    navigate('/transactions/new');
  };

  const handleEditNavigate = (transaction: Transaction) => {
    if (!transaction.id) {
      return;
    }

    lastSyncedRouteKey.current = `edit:${transaction.id}`;
    onEdit(transaction);
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

    void onDelete(pendingDeleteTransaction.id);
    setPendingDeleteTransaction(null);
  };

  const handleSaveAndClose = async (
    transaction: Omit<Transaction, 'id' | 'createdByPersonId' | 'createdAtUtc' | 'updatedAtUtc'>,
  ) => {
    await onSave(transaction);
    navigate(listPath);
  };

  const handleCancelAndClose = () => {
    onCancel();
    navigate(listPath);
  };

  return (
    <Stack spacing={2.5}>
      {!displayForm && (
        <TransactionSearchBar
          onSearch={onSearch}
          initialQuery={initialQuery}
          persons={persons}
          action={(
            <Button variant="contained" onClick={handleAddClick} sx={{ whiteSpace: 'nowrap', px: 3.5 }}>
              Create Transaction
            </Button>
          )}
        />
      )}

      {displayForm && (
        personsLoading && persons.length === 0 ? (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <TransactionForm
            transaction={currentEditingTransaction}
            persons={persons}
            currentPersonId={currentPersonId}
            role={role}
            onSave={handleSaveAndClose}
            onCancel={handleCancelAndClose}
          />
        )
      )}

      {personsError && <Alert severity="error">{personsError}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {!displayForm && (
        loading && transactions.length === 0 ? (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack sx={{ position: 'relative' }}>
            {loading && (
              <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
            )}
            <TransactionList
              transactions={transactions}
              currentPersonId={currentPersonId}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canConfirm={canConfirm}
              canRefuse={canRefuse}
              onEdit={handleEditNavigate}
              onDelete={handleDeleteRequest}
              onConfirm={onConfirm}
              onRefuse={onRefuse}
            />
          </Stack>
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
