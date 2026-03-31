import React, { useEffect } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { canUpdateOrDeleteTransaction } from '../../../shared/auth/permissions';
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

  const canManageTransaction = (transaction: Transaction) => canUpdateOrDeleteTransaction(role, currentPersonId, transaction);

  useEffect(() => {
    Promise.resolve(loadTransactions()).catch((error) => {
      console.error(error);
    });
  }, [loadTransactions]);

  return (
    <>
      <SearchBar onSearch={handleSearch} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="subtitle1">Manage your transactions</Typography>
        <Button variant="contained" onClick={showCreateForm} disabled={showForm}>
          Add Transaction
        </Button>
      </Stack>

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          persons={persons}
          currentPersonId={currentPersonId}
          role={role}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <TransactionList
          transactions={transactions}
          persons={persons}
          canManage={canManageTransaction}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default TransactionsPage;
