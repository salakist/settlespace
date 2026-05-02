import axios from 'axios';
import { mockGet, mockPost, setupApiClientMock } from '../../shared/api/apiTestClientMock';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('notification api methods call expected routes', () => {
  let loadedApi: typeof import('./api').notificationApi;
  jest.isolateModules(() => {
    loadedApi = require('./api').notificationApi;
  });

  loadedApi!.getUnread();
  loadedApi!.markRead('n-1');
  loadedApi!.markAllRead();

  expect(mockGet).toHaveBeenNthCalledWith(1, '/notifications');
  expect(mockPost).toHaveBeenNthCalledWith(1, '/notifications/n-1/read', {});
  expect(mockPost).toHaveBeenNthCalledWith(2, '/notifications/read-all', {});
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
