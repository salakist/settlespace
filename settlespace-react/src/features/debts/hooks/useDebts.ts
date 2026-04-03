import { useCallback, useState } from 'react';
import { debtsApi } from '../../../shared/api/debtsApi';
import { handleRequestError } from '../../../shared/api/requestHandling';
import { DebtDetails, DebtSummary, SettleDebtRequest } from '../../../shared/types';

type UseDebtsOptions = {
  expireSession: (message?: string) => void;
};

const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

function findMatchingDetail(details: DebtDetails[], currencyCode: string): DebtDetails | undefined {
  return details.find((candidate) => candidate.currencyCode === currencyCode);
}

export function useDebts({ expireSession }: UseDebtsOptions) {
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtSummary | undefined>();
  const [selectedDebtDetail, setSelectedDebtDetail] = useState<DebtDetails | undefined>();
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [settlementSaving, setSettlementSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearDebtsState = useCallback(() => {
    setDebts([]);
    setSelectedDebt(undefined);
    setSelectedDebtDetail(undefined);
    setSettlementOpen(false);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearDebtsState();
    expireSession(SESSION_EXPIRED_MESSAGE);
  }, [clearDebtsState, expireSession]);

  const loadDebts = useCallback(async (): Promise<DebtSummary[]> => {
    try {
      setLoading(true);
      const response = await debtsApi.getCurrentUser();
      setDebts(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load debts',
        forbiddenMessage: 'You are not allowed to view debts.',
      });

      return [];
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  const openSettlementDrawer = useCallback(async (debt: DebtSummary) => {
    setSelectedDebt(debt);
    setSelectedDebtDetail(undefined);
    setSettlementOpen(true);
    setSuccessMessage(null);

    try {
      setDetailsLoading(true);
      const response = await debtsApi.getCurrentUserDetails(debt.counterpartyPersonId);
      setSelectedDebtDetail(findMatchingDetail(response.data, debt.currencyCode));
      setError(null);
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load debt details',
      });
    } finally {
      setDetailsLoading(false);
    }
  }, [handleUnauthorized]);

  const closeSettlementDrawer = useCallback(() => {
    setSettlementOpen(false);
    setSelectedDebt(undefined);
    setSelectedDebtDetail(undefined);
  }, []);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const submitSettlement = useCallback(async (request: SettleDebtRequest) => {
    try {
      setSettlementSaving(true);
      await debtsApi.settle(request);
      setError(null);
      await loadDebts();
      closeSettlementDrawer();
      setSuccessMessage('Settlement recorded successfully.');
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to record settlement',
        forbiddenMessage: 'You are not allowed to record this settlement.',
      });
    } finally {
      setSettlementSaving(false);
    }
  }, [closeSettlementDrawer, handleUnauthorized, loadDebts]);

  return {
    clearDebtsState,
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
  };
}
