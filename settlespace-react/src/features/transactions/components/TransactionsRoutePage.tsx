import React, { useCallback, useEffect, useMemo } from 'react';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
import { usePersonDirectory } from '../../persons/hooks/usePersonDirectory';
import { PersonRole, Transaction } from '../../../shared/types';
import { useTransactions } from '../hooks/useTransactions';
import useUrlSearchQuery from '../../search/hooks/useUrlSearchQuery';
import {
  parseTransactionSearchQuery,
  serializeTransactionSearchQuery,
} from '../search/transactionSearchUrl';
import TransactionsPage from './TransactionsPage';

type TransactionsRoutePageProps = {
  currentPersonId?: string;
  role: PersonRole | null;
  expireSession: (message?: string) => void;
};

const TransactionsRoutePage: React.FC<TransactionsRoutePageProps> = ({ currentPersonId, role, expireSession }) => {
  const [searchQuery, setQueryToUrl] = useUrlSearchQuery(
    parseTransactionSearchQuery,
    serializeTransactionSearchQuery,
  );

  const {
    error: personsError,
    loading: personsLoading,
    persons: loadedPersons,
  } = usePersonDirectory({ expireSession });

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

  const listPath = useMemo(() => {
    const params = serializeTransactionSearchQuery(searchQuery).toString();
    return params ? `/transactions?${params}` : '/transactions';
  }, [searchQuery]);

  useEffect(() => {
    const loadPage = async () => {
      await handleSearch(searchQuery);
    };

    Promise.resolve(loadPage()).catch((loadError) => {
      console.error(loadError);
    });
  }, [handleSearch, searchQuery]);

  const canManageTransaction = useCallback(
    (transaction: Transaction) => canUpdateOrDeleteTransaction(role, currentPersonId, transaction),
    [currentPersonId, role],
  );

  return (
    <TransactionsPage
      transactions={transactions}
      persons={loadedPersons}
      loading={loading}
      error={error}
      personsLoading={personsLoading}
      personsError={personsError}
      showForm={showForm}
      editingTransaction={editingTransaction}
      currentPersonId={currentPersonId}
      role={role}
      initialQuery={searchQuery}
      listPath={listPath}
      canManage={canManageTransaction}
      onSearch={setQueryToUrl}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onAdd={showCreateForm}
    />
  );
};

export default TransactionsRoutePage;
