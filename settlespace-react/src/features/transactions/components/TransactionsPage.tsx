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
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5">Transactions</Typography>
        <Typography variant="body2" color="text.secondary">
          Track recent activity, search quickly, and update entries without leaving the flow.
        </Typography>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by description, category, or involved person's name"
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
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

      {error && <Alert severity="error">{error}</Alert>}

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
    </Stack>
  );
};

export default TransactionsPage;
