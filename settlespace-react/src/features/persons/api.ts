import { apiClient } from '../../shared/api/client';
import { Person } from '../../shared/types';

export const personApi = {
  getAll: () => apiClient.get<Person[]>('/persons'),
  getCurrent: () => apiClient.get<Person>('/persons/me'),
  getById: (id: string) => apiClient.get<Person>(`/persons/${id}`),
  create: (person: Omit<Person, 'id'>) => apiClient.post<Person>('/persons', person),
  update: (id: string, person: Omit<Person, 'id'>) => apiClient.put(`/persons/${id}`, person),
  updateCurrent: (person: Omit<Person, 'id'>) => apiClient.put('/persons/me', person),
  delete: (id: string) => apiClient.delete(`/persons/${id}`),
  search: (query: string) => apiClient.get<Person[]>(`/persons/search/${query}`),
};
