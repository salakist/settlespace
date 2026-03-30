import React from 'react';
import { Alert, Typography, Stack } from '@mui/material';

const DebtsPage: React.FC = () => {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Debts</Typography>
      <Alert severity="info">
        Debts page - not yet implemented. This page will allow users to view and manage transaction deficits.
      </Alert>
    </Stack>
  );
};

export default DebtsPage;
