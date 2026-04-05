import { apiClient } from '../../shared/api/client';
import {
  DebtDetails,
  DebtSettlementResult,
  DebtSummary,
  SettleDebtRequest,
} from './types';

export const debtsApi = {
  getCurrentUser: () => apiClient.get<DebtSummary[]>('/debts/me'),
  getCurrentUserDetails: (counterpartyPersonId: string) => apiClient.get<DebtDetails[]>(`/debts/me/${counterpartyPersonId}`),
  settle: (request: SettleDebtRequest) => apiClient.post<DebtSettlementResult>('/debts/settlements', request),
};
