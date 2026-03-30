import React from 'react';
import { Alert, Typography, Stack } from '@mui/material';

const TransactionsPage: React.FC = () => {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Transactions</Typography>
      <Alert severity="info">
        Transactions page - not yet implemented. This page will allow users to manage transactions between persons.
      </Alert>
    </Stack>
  );
};

export default TransactionsPage;
