import axios from 'axios';
import { DebtDetails, DebtSettlementResult, DebtSummary, SettleDebtRequest } from '../types';

const API_BASE_URL = 'http://localhost:5279/api';
const TOKEN_STORAGE_KEY = 'settlespace.auth.token';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
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
