import React from 'react';
import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Person, Transaction } from '../../../shared/types';

type TransactionListProps = {
  transactions: Transaction[];
  persons: Person[];
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

const TransactionList: React.FC<TransactionListProps> = ({ transactions, persons, onEdit, onDelete }) => {
  if (transactions.length === 0) {
    return <Typography color="text.secondary">No transactions found for your account.</Typography>;
  }

  return (
    <Stack spacing={2}>
      {transactions.map((transaction) => (
        <Card key={transaction.id} variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                <Button size="small" variant="outlined" onClick={() => onEdit(transaction)}>Edit</Button>
                {transaction.id && (
                  <Button size="small" variant="outlined" color="secondary" onClick={() => onDelete(transaction.id)}>Delete</Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};

export default TransactionList;
