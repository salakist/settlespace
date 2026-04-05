import axios from 'axios';
import { mockGet, mockPost, setupApiClientMock } from '../../shared/api/apiTestClientMock';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('debts api methods call expected routes', () => {
  let loadedApi: typeof import('./api').debtsApi;
  jest.isolateModules(() => {
    loadedApi = require('./api').debtsApi;
  });

  loadedApi!.getCurrentUser();
  loadedApi!.getCurrentUserDetails('person-2');
  loadedApi!.settle({
    counterpartyPersonId: 'person-2',
    amount: 12.5,
    currencyCode: 'EUR',
    description: 'Partial settlement',
  });

  expect(mockGet).toHaveBeenNthCalledWith(1, '/debts/me');
  expect(mockGet).toHaveBeenNthCalledWith(2, '/debts/me/person-2');
  expect(mockPost).toHaveBeenCalledWith('/debts/settlements', {
    counterpartyPersonId: 'person-2',
    amount: 12.5,
    currencyCode: 'EUR',
    description: 'Partial settlement',
  });
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
