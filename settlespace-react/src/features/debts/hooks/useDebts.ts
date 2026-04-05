import { useCallback, useState } from 'react';
import { debtsApi } from '../../../shared/api/debtsApi';
import { handleRequestError } from '../../../shared/api/requestHandling';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { DebtDetails, DebtSummary, SettleDebtRequest } from '../../../shared/types';
import { DEBT_SETTLEMENT_TEXT } from '../constants';

type UseDebtsOptions = {
  expireSession: (message?: string) => void;
};

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

  const loadDebtDetails = useCallback(async (
    counterpartyPersonId: string,
    currencyCode: string,
  ): Promise<DebtDetails | undefined> => {
    try {
      setDetailsLoading(true);
      const response = await debtsApi.getCurrentUserDetails(counterpartyPersonId);
      const detail = findMatchingDetail(response.data, currencyCode);
      setError(null);
      return detail;
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load debt details',
      });
      return undefined;
    } finally {
      setDetailsLoading(false);
    }
  }, [handleUnauthorized]);

  const openSettlementDrawer = useCallback(async (debt: DebtSummary) => {
    setSelectedDebt(debt);
    setSelectedDebtDetail(undefined);
    setSettlementOpen(true);
    setSuccessMessage(null);

    const detail = await loadDebtDetails(debt.counterpartyPersonId, debt.currencyCode);
    setSelectedDebtDetail(detail);
  }, [loadDebtDetails]);

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
      setSuccessMessage(DEBT_SETTLEMENT_TEXT.SETTLEMENT_RECORDED);
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
    loadDebtDetails,
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
