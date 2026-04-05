import React, { useEffect, useMemo } from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DebtSummary } from '../../../shared/types';
import { useDebts } from '../hooks/useDebts';
import DebtsList from './DebtsList';
import DebtSettlementDrawer from './DebtSettlementDrawer';
import SearchBar from '../../persons/components/SearchBar';

type DebtsPageProps = {
  expireSession: (message?: string) => void;
};

const DebtsPage: React.FC<DebtsPageProps> = ({ expireSession }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim().toLowerCase() ?? '';
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

  const filteredDebts = useMemo(() => {
    if (!searchQuery) {
      return debts;
    }

    return debts.filter((debt) => (debt.counterpartyDisplayName ?? debt.counterpartyPersonId).toLowerCase().includes(searchQuery));
  }, [debts, searchQuery]);

  const handleViewDetails = (debt: DebtSummary) => {
    navigate(`/debts/${encodeURIComponent(debt.counterpartyPersonId)}/${encodeURIComponent(debt.currencyCode)}`);
  };

  const handleSearch = (query: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      nextSearchParams.set('search', trimmedQuery);
    } else {
      nextSearchParams.delete('search');
    }

    setSearchParams(nextSearchParams);
  };

  let debtsContent: React.ReactNode;

  if (loading) {
    debtsContent = (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    );
  } else if (searchQuery && debts.length > 0 && filteredDebts.length === 0) {
    debtsContent = <Alert severity="info">No debts match that person name.</Alert>;
  } else {
    debtsContent = (
      <DebtsList
        debts={filteredDebts}
        onSettle={openSettlementDrawer}
        onViewDetails={handleViewDetails}
      />
    );
  }

  return (
    <Stack spacing={2.5}>
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by first or last name"
        initialQuery={searchParams.get('search') ?? ''}
        ariaLabel="Debt search"
      />

      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {debtsContent}

      <DebtSettlementDrawer
        open={settlementOpen}
        debt={selectedDebt}
        details={selectedDebtDetail}
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
