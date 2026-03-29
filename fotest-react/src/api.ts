import axios from 'axios';
import { Person } from './types';

const API_BASE_URL = 'http://localhost:5279/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const personApi = {
  getAll: () => api.get<Person[]>('/persons'),
  getById: (id: string) => api.get<Person>(`/persons/${id}`),
  create: (person: Omit<Person, 'id'>) => api.post<Person>('/persons', person),
  update: (id: string, person: Omit<Person, 'id'>) => api.put(`/persons/${id}`, person),
  delete: (id: string) => api.delete(`/persons/${id}`),
  search: (query: string) => api.get<Person[]>(`/persons/search/${query}`),
};