import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, LinearProgress, Stack } from '@mui/material';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { usePersonDirectory } from '../../../shared/hooks/usePersonDirectory';
import { Person, PersonRole, Transaction } from '../../../shared/types';
import TransactionSearchBar from './TransactionSearchBar';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { useTransactions } from '../hooks/useTransactions';

type TransactionsPageProps = {
  persons?: Person[];
  currentPersonId?: string;
  role: PersonRole | null;
  expireSession: (message?: string) => void;
};

const TransactionsPage: React.FC<TransactionsPageProps> = ({ persons, currentPersonId, role, expireSession }) => {
  const navigate = useNavigate();
  const {
    error: personsError,
    loading: personsLoading,
    persons: loadedPersons,
  } = usePersonDirectory({ expireSession, initialPersons: persons });
  const location = useLocation();
  const { transactionId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQueryFromUrl = useMemo<TransactionSearchQuery>(() => {
    const query: TransactionSearchQuery = {};
    const freeText = searchParams.get('freeText')?.trim();
    if (freeText) {
      query.freeText = freeText;
    }
    const statuses = searchParams.getAll('status');
    if (statuses.length > 0) {
      query.status = statuses;
    }
    const involvement = searchParams.get('involvement');
    if (involvement) {
      query.involvement = involvement;
    }
    const category = searchParams.get('category');
    if (category) {
      query.category = category;
    }
    const description = searchParams.get('description');
    if (description) {
      query.description = description;
    }
    const involved = searchParams.getAll('involved');
    if (involved.length > 0) {
      query.involved = involved;
    }
    const managedBy = searchParams.getAll('managedBy');
    if (managedBy.length > 0) {
      query.managedBy = managedBy;
    }
    const payer = searchParams.get('payer');
    if (payer) {
      query.payer = payer;
    }
    const payee = searchParams.get('payee');
    if (payee) {
      query.payee = payee;
    }
    return query;
  }, [searchParams]);
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

  const availablePersons = loadedPersons;

  const {
    editingTransaction,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSave,
    handleSearch,
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
      await handleSearch(searchQueryFromUrl);
    };

    Promise.resolve(loadPage()).catch((loadError) => {
      console.error(loadError);
    });
  }, [handleSearch, searchQueryFromUrl]);

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

  const handleSearchChange = useCallback((query: TransactionSearchQuery) => {
    const nextParams = new URLSearchParams();

    if (query.freeText) {
      nextParams.set('freeText', query.freeText);
    }

    if (query.status) {
      for (const status of query.status) {
        nextParams.append('status', status);
      }
    }

    if (query.involvement) {
      nextParams.set('involvement', query.involvement);
    }

    if (query.category) {
      nextParams.set('category', query.category);
    }

    if (query.description) {
      nextParams.set('description', query.description);
    }

    if (query.involved) {
      for (const personId of query.involved) {
        nextParams.append('involved', personId);
      }
    }

    if (query.managedBy) {
      for (const personId of query.managedBy) {
        nextParams.append('managedBy', personId);
      }
    }

    if (query.payer) {
      nextParams.set('payer', query.payer);
    }

    if (query.payee) {
      nextParams.set('payee', query.payee);
    }

    setSearchParams(nextParams);
  }, [setSearchParams]);

  const buildSearchParamsString = useCallback(() => {
    const params = searchParams.toString();
    return params ? `?${params}` : '';
  }, [searchParams]);

  const navigateToList = () => {
    navigate(`/transactions${buildSearchParamsString()}`);
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
        <TransactionSearchBar
          onSearch={handleSearchChange}
          initialQuery={searchQueryFromUrl}
          persons={availablePersons}
          action={(
            <Button variant="contained" onClick={handleAddClick} sx={{ whiteSpace: 'nowrap', px: 3.5 }}>
              Create Transaction
            </Button>
          )}
        />
      )}

      {displayForm && (
        personsLoading && availablePersons.length === 0 ? (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <TransactionForm
            transaction={currentEditingTransaction}
            persons={availablePersons}
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
              canManage={canManageTransaction}
              onEdit={handleEditNavigate}
              onDelete={handleDeleteRequest}
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
