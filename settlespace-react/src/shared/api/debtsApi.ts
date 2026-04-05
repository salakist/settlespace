import axios from 'axios';
import { DebtDetails, DebtSettlementResult, DebtSummary, SettleDebtRequest } from '../types';
import { API_BASE_URL, AUTH_STORAGE_KEYS } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const debtsApi = {
  getCurrentUser: () => api.get<DebtSummary[]>('/debts/me'),
  getCurrentUserDetails: (counterpartyPersonId: string) => api.get<DebtDetails[]>(`/debts/me/${counterpartyPersonId}`),
  settle: (request: SettleDebtRequest) => api.post<DebtSettlementResult>('/debts/settlements', request),
};
