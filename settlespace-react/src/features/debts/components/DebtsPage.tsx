import React, { useCallback, useEffect, useMemo } from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DebtDirection, DebtSummary, parseDebtDirection } from '../../../shared/types';
import SearchResultsAlert from '../../search/components/SearchResultsAlert';
import { useDebts } from '../hooks/useDebts';
import { DEBT_LIST_TEXT } from '../constants';
import { DebtSearchQuery } from '../search/debtSearchConfig';
import DebtsList from './DebtsList';
import DebtSettlementDrawer from './DebtSettlementDrawer';
import DebtSearchBar from './DebtSearchBar';

type DebtsPageProps = {
  expireSession: (message?: string) => void;
};

const DebtsPage: React.FC<DebtsPageProps> = ({ expireSession }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQueryFromUrl = useMemo<DebtSearchQuery>(() => {
    const query: DebtSearchQuery = {};
    const freeText = searchParams.get('freeText')?.trim() ?? searchParams.get('search')?.trim();
    const direction = parseDebtDirection(searchParams.get('direction'));

    if (freeText) {
      query.freeText = freeText;
    }

    if (direction) {
      query.direction = direction;
    }

    return query;
  }, [searchParams]);
  const normalizedFreeText = searchQueryFromUrl.freeText?.toLowerCase() ?? '';
  const hasActiveSearch = Boolean(searchQueryFromUrl.freeText || searchQueryFromUrl.direction);
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

  const filteredDebts = useMemo(() => debts.filter((debt) => {
    const counterpartyName = (debt.counterpartyDisplayName ?? debt.counterpartyPersonId).toLowerCase();
    const matchesFreeText = !normalizedFreeText || counterpartyName.includes(normalizedFreeText);
    const matchesDirection = !searchQueryFromUrl.direction || debt.direction === searchQueryFromUrl.direction;

    return matchesFreeText && matchesDirection;
  }), [debts, normalizedFreeText, searchQueryFromUrl.direction]);

  const allVisibleDebtsSettled = filteredDebts.length > 0
    && filteredDebts.every((debt) => debt.direction === DebtDirection.Settled)
    && searchQueryFromUrl.direction !== DebtDirection.Settled;

  const handleViewDetails = (debt: DebtSummary) => {
    navigate(`/debts/${encodeURIComponent(debt.counterpartyPersonId)}/${encodeURIComponent(debt.currencyCode)}`);
  };

  const handleSearchChange = useCallback((query: DebtSearchQuery) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete('search');
    nextSearchParams.delete('freeText');
    nextSearchParams.delete('direction');

    if (query.freeText) {
      nextSearchParams.set('freeText', query.freeText);
    }

    if (query.direction) {
      nextSearchParams.set('direction', query.direction);
    }

    setSearchParams(nextSearchParams);
  }, [searchParams, setSearchParams]);

  let debtsContent: React.ReactNode;

  if (loading) {
    debtsContent = (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    );
  } else if (hasActiveSearch && debts.length > 0 && filteredDebts.length === 0) {
    debtsContent = <SearchResultsAlert entityName="debts" />;
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
      <DebtSearchBar
        onSearch={handleSearchChange}
        initialQuery={searchQueryFromUrl}
      />

      {successMessage && (
        <Alert severity="success" onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {allVisibleDebtsSettled && (
        <Alert severity="info">{DEBT_LIST_TEXT.ALL_VISIBLE_SETTLED}</Alert>
      )}

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
