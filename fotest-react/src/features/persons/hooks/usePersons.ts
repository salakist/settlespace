import { useCallback, useState } from 'react';
import { personApi } from '../../../shared/api/api';
import { Person } from '../../../shared/types';

type UsePersonsOptions = {
  expireSession: (message?: string) => void;
};

export function usePersons({ expireSession }: UsePersonsOptions) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizePerson = useCallback((person: Person): Person => ({
    ...person,
    dateOfBirth: person.dateOfBirth?.slice(0, 10),
    addresses: person.addresses ?? [],
  }), []);

  const clearPersonsState = useCallback(() => {
    setPersons([]);
    setEditingPerson(undefined);
    setShowForm(false);
    setSaveLoading(false);
    setError(null);
  }, []);

  const clearPersonsError = useCallback(() => {
    setError(null);
  }, []);

  const setDirectoryIdle = useCallback(() => {
    setLoading(false);
  }, []);

  const setPersonInList = useCallback((person: Person) => {
    setPersons((currentPersons) =>
      person.id
        ? currentPersons.map((current) => (current.id === person.id ? person : current))
        : currentPersons);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearPersonsState();
    expireSession('Your session expired. Please log in again.');
  }, [clearPersonsState, expireSession]);

  const loadPersons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await personApi.getAll();
      setPersons(response.data.map(normalizePerson));
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to load persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, normalizePerson]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadPersons();
      return;
    }

    try {
      setLoading(true);
      const response = await personApi.search(query);
      setPersons(response.data.map(normalizePerson));
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, loadPersons, normalizePerson]);

  const handleSave = useCallback(async (personData: Omit<Person, 'id'>) => {
    setSaveLoading(true);
    try {
      if (editingPerson?.id) {
        await personApi.update(editingPerson.id, personData);
      } else {
        await personApi.create(personData);
      }

      setEditingPerson(undefined);
      setShowForm(false);
      setError(null);
      await loadPersons();
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to save person');
      console.error(err);
      throw err;
    } finally {
      setSaveLoading(false);
    }
  }, [editingPerson, handleUnauthorized, loadPersons]);

  const handleEdit = useCallback((person: Person) => {
    setEditingPerson(person);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!globalThis.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    try {
      await personApi.delete(id);
      await loadPersons();
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to delete person');
      console.error(err);
    }
  }, [handleUnauthorized, loadPersons]);

  const handleCancel = useCallback(() => {
    setEditingPerson(undefined);
    setShowForm(false);
  }, []);

  const showCreateForm = useCallback(() => {
    setEditingPerson(undefined);
    setShowForm(true);
  }, []);

  return {
    clearPersonsError,
    clearPersonsState,
    editingPerson,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSave,
    handleSearch,
    loadPersons,
    loading,
    persons,
    saveLoading,
    setDirectoryIdle,
    setPersonInList,
    showCreateForm,
    showForm,
  };
}
