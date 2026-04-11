import axios from 'axios';
import { mockDelete, mockGet, mockPost, mockPut, setupApiClientMock } from '../../shared/api/apiTestClientMock';
import { API_TEST_VALUES } from '../../shared/api/testConstants';
import { PersonRole } from '../../shared/types';

jest.mock('axios');

beforeEach(() => {
  setupApiClientMock();
});

test('person api methods call expected routes', () => {
  let loadedApi: typeof import('./api').personApi;
  jest.isolateModules(() => {
    loadedApi = require('./api').personApi;
  });

  const personData = { firstName: 'John', lastName: 'Doe', addresses: [] };

  loadedApi!.getAll();
  loadedApi!.getCurrent();
  loadedApi!.getById(API_TEST_VALUES.PERSON_ID);
  loadedApi!.create(personData);
  loadedApi!.update(API_TEST_VALUES.PERSON_ID, personData);
  loadedApi!.updateCurrent(personData);
  loadedApi!.delete(API_TEST_VALUES.PERSON_ID);
  loadedApi!.search('john');
  loadedApi!.searchStructured({ freeText: 'john', role: [PersonRole.User] });

  expect(mockGet).toHaveBeenNthCalledWith(1, '/persons');
  expect(mockGet).toHaveBeenNthCalledWith(2, '/persons/me');
  expect(mockGet).toHaveBeenNthCalledWith(3, `/persons/${API_TEST_VALUES.PERSON_ID}`);
  expect(mockPost).toHaveBeenNthCalledWith(1, '/persons', personData);
  expect(mockPost).toHaveBeenNthCalledWith(2, '/persons/search', { freeText: 'john', role: [PersonRole.User] });
  expect(mockPut).toHaveBeenNthCalledWith(1, `/persons/${API_TEST_VALUES.PERSON_ID}`, personData);
  expect(mockPut).toHaveBeenNthCalledWith(2, '/persons/me', personData);
  expect(mockDelete).toHaveBeenCalledWith(`/persons/${API_TEST_VALUES.PERSON_ID}`);
  expect(mockGet).toHaveBeenNthCalledWith(4, '/persons/search/john');
  expect((axios.create as jest.Mock).mock.calls[0][0]).toEqual({ baseURL: 'http://localhost:5279/api' });
});
