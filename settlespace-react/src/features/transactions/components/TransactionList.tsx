import React from 'react';
import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { Person, Transaction } from '../../../shared/types';
import { listItemSurfaceSx } from '../../../shared/theme/surfaceStyles';

type TransactionListProps = {
  transactions: Transaction[];
  persons: Person[];
  canManage: (transaction: Transaction) => boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

function resolvePersonName(persons: Person[], personId: string): string {
  const person = persons.find((candidate) => candidate.id === personId);
  if (!person) {
    return personId;
  }

  return `${person.firstName} ${person.lastName}`;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, persons, canManage, onEdit, onDelete }) => {
  if (transactions.length === 0) {
    return <Typography color="text.secondary">No transactions found for your account.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {transactions.map((transaction) => {
        const transactionId = transaction.id;

        return (
          <Paper key={transactionId} elevation={0} sx={listItemSurfaceSx}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                <Typography variant="h6">{transaction.description}</Typography>
                <Chip label={transaction.status} size="small" />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {resolvePersonName(persons, transaction.payerPersonId)} paid {resolvePersonName(persons, transaction.payeePersonId)}
              </Typography>

              <Typography variant="body1">
                {transaction.amount.toFixed(2)} {transaction.currencyCode}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {new Date(transaction.transactionDateUtc).toLocaleDateString()}
                {transaction.category ? ` • ${transaction.category}` : ''}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => onEdit(transaction)} disabled={!canManage(transaction)}>Edit</Button>
                {transactionId && (
                  <Button size="small" variant="outlined" color="secondary" onClick={() => onDelete(transactionId)} disabled={!canManage(transaction)}>Delete</Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default TransactionList;
