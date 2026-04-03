import { useCallback, useState } from 'react';
import { personApi } from '../../../shared/api/api';
import {
  handleRequestError,
  rejectUnauthorizedAction,
} from '../../../shared/api/requestHandling';
import {
  canCreatePerson,
  canDeletePerson,
  canUpdatePerson,
} from '../../../shared/auth/permissions';
import { Person, PersonRole } from '../../../shared/types';

type UsePersonsOptions = {
  expireSession: (message?: string) => void;
  currentPersonId?: string;
  role: PersonRole | null;
};

export function usePersons({ expireSession, currentPersonId, role }: UsePersonsOptions) {
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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load persons',
      });
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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Search failed',
      });
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, loadPersons, normalizePerson]);

  const handleSave = useCallback(async (personData: Omit<Person, 'id'>) => {
    const requestedRole = personData.role ?? 'USER';

    if (editingPerson) {
      if (rejectUnauthorizedAction(
        canUpdatePerson(role, currentPersonId, editingPerson, requestedRole),
        setError,
        'You are not allowed to update this person.',
      )) {
        return;
      }
    } else if (rejectUnauthorizedAction(
      canCreatePerson(role, requestedRole),
      setError,
      'You are not allowed to create this person.',
    )) {
      return;
    }

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
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to save person',
        forbiddenMessage: 'You are not allowed to save this person.',
        rethrow: true,
      });
    } finally {
      setSaveLoading(false);
    }
  }, [currentPersonId, editingPerson, handleUnauthorized, loadPersons, role]);

  const handleEdit = useCallback((person: Person) => {
    const requestedRole = person.role ?? 'USER';
    if (rejectUnauthorizedAction(
      canUpdatePerson(role, currentPersonId, person, requestedRole),
      setError,
      'You are not allowed to edit this person.',
    )) {
      return;
    }

    setEditingPerson(person);
    setShowForm(true);
  }, [currentPersonId, role]);

  const handleDelete = useCallback(async (id: string) => {
    const target = persons.find((person) => person.id === id);
    if (target && rejectUnauthorizedAction(
      canDeletePerson(role, target),
      setError,
      'You are not allowed to delete this person.',
    )) {
      return;
    }

    if (!globalThis.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    try {
      await personApi.delete(id);
      await loadPersons();
    } catch (err) {
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to delete person',
        forbiddenMessage: 'You are not allowed to delete this person.',
      });
    }
  }, [handleUnauthorized, loadPersons, persons, role]);

  const handleCancel = useCallback(() => {
    setEditingPerson(undefined);
    setShowForm(false);
  }, []);

  const showCreateForm = useCallback(() => {
    if (rejectUnauthorizedAction(
      canCreatePerson(role, 'USER'),
      setError,
      'You are not allowed to create persons.',
    )) {
      return;
    }

    setEditingPerson(undefined);
    setShowForm(true);
  }, [role]);

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
