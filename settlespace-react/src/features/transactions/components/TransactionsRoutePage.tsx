import React, { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
import { usePersonDirectory } from '../../persons/hooks/usePersonDirectory';
import { PersonRole, Transaction } from '../../../shared/types';
import {
  parseTransactionInvolvement,
  parseTransactionStatus,
  TransactionSearchQuery,
} from '../types';
import { useTransactions } from '../hooks/useTransactions';
import TransactionsPage from './TransactionsPage';

type TransactionsRoutePageProps = {
  currentPersonId?: string;
  role: PersonRole | null;
  expireSession: (message?: string) => void;
};

const TransactionsRoutePage: React.FC<TransactionsRoutePageProps> = ({ currentPersonId, role, expireSession }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const searchQueryFromUrl = useMemo<TransactionSearchQuery>(() => {
    const query: TransactionSearchQuery = {};
    const freeText = searchParams.get('freeText')?.trim();
    if (freeText) {
      query.freeText = freeText;
    }
    const statuses = searchParams.getAll('status')
      .map((status) => parseTransactionStatus(status))
      .filter((status): status is NonNullable<typeof status> => status !== null);
    if (statuses.length > 0) {
      query.status = statuses;
    }
    const involvement = parseTransactionInvolvement(searchParams.get('involvement'));
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

  const listPath = useMemo(() => {
    const params = searchParams.toString();
    return params ? `/transactions?${params}` : '/transactions';
  }, [searchParams]);

  useEffect(() => {
    const loadPage = async () => {
      await handleSearch(searchQueryFromUrl);
    };

    Promise.resolve(loadPage()).catch((loadError) => {
      console.error(loadError);
    });
  }, [handleSearch, searchQueryFromUrl]);

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
      initialQuery={searchQueryFromUrl}
      listPath={listPath}
      canManage={canManageTransaction}
      onSearch={handleSearchChange}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onAdd={showCreateForm}
    />
  );
};

export default TransactionsRoutePage;
