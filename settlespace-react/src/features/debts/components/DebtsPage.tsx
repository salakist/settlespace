import React, { useEffect } from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { Person } from '../../../shared/types';
import { useDebts } from '../hooks/useDebts';
import DebtsList from './DebtsList';
import DebtSettlementDrawer from './DebtSettlementDrawer';

type DebtsPageProps = {
  persons: Person[];
  expireSession: (message?: string) => void;
};

const DebtsPage: React.FC<DebtsPageProps> = ({ persons, expireSession }) => {
  const {
    clearSuccessMessage,
    closeSettlementDrawer,
    debts,
    detailsLoading,
    error,
    loadDebts,
    loading,
    openSettlementDrawer,
    selectedDebt,
    selectedDebtDetail,
    settlementOpen,
    settlementSaving,
    submitSettlement,
    successMessage,
  } = useDebts({ expireSession });

  useEffect(() => {
    Promise.resolve(loadDebts()).catch((loadError) => {
      console.error(loadError);
    });
  }, [loadDebts]);

  return (
    <Stack spacing={2.5}>
      <div>
        <Typography variant="h5">Debts</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage balances that still need settling, then record partial or full repayments from one place.
        </Typography>
      </div>

      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <DebtsList debts={debts} persons={persons} onSettle={openSettlementDrawer} />
      )}

      <DebtSettlementDrawer
        open={settlementOpen}
        debt={selectedDebt}
        details={selectedDebtDetail}
        persons={persons}
        loading={detailsLoading}
        saving={settlementSaving}
        error={error}
        successMessage={successMessage}
        onClose={closeSettlementDrawer}
        onSubmit={submitSettlement}
      />
    </Stack>
  );
};

export default DebtsPage;
