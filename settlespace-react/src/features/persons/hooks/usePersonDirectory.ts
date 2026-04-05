import { useCallback, useEffect, useState } from 'react';
import { handleRequestError } from '../../../shared/api/requestHandling';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { Person } from '../../../shared/types';
import { personApi } from '../api';

let cachedPersons: Person[] = [];
let cachedPromise: Promise<Person[]> | null = null;

function normalizePerson(person: Person): Person {
  return {
    ...person,
    dateOfBirth: person.dateOfBirth?.slice(0, 10),
    addresses: person.addresses ?? [],
  };
}

function mergePersons(current: Person[], incoming: Person[]): Person[] {
  const mergedById = new Map<string, Person>();
  const withoutIds: Person[] = [];

  for (const person of [...current, ...incoming].map(normalizePerson)) {
    if (person.id) {
      mergedById.set(person.id, person);
      continue;
    }

    withoutIds.push(person);
  }

  return [...mergedById.values(), ...withoutIds];
}

export function primePersonDirectory(persons: Person[]): Person[] {
  if (persons.length === 0) {
    return cachedPersons;
  }

  cachedPersons = mergePersons(cachedPersons, persons);
  return cachedPersons;
}

export function clearPersonDirectoryCache(): void {
  cachedPersons = [];
  cachedPromise = null;
}

type UsePersonDirectoryOptions = {
  expireSession: (message?: string) => void;
  initialPersons?: Person[];
  autoLoad?: boolean;
};

export function usePersonDirectory({
  expireSession,
  initialPersons,
  autoLoad = true,
}: UsePersonDirectoryOptions) {
  const [persons, setPersons] = useState<Person[]>(() => {
    if (initialPersons && initialPersons.length > 0) {
      return primePersonDirectory(initialPersons);
    }

    return cachedPersons;
  });
  const [loading, setLoading] = useState(autoLoad && initialPersons === undefined && cachedPersons.length === 0);
  const [error, setError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    clearPersonDirectoryCache();
    expireSession(SESSION_EXPIRED_MESSAGE);
  }, [expireSession]);

  const loadPersons = useCallback(async (forceRefresh = false): Promise<Person[]> => {
    if (forceRefresh) {
      clearPersonDirectoryCache();
    } else if (cachedPersons.length > 0) {
      setPersons(cachedPersons);
      setLoading(false);
      return cachedPersons;
    }

    try {
      setLoading(true);
      setError(null);

      cachedPromise ??= personApi
        .getAll()
        .then((response) => primePersonDirectory(response.data));

      const nextPersons = await cachedPromise;
      setPersons(nextPersons);
      return nextPersons;
    } catch (err) {
      cachedPromise = null;
      handleRequestError({
        error: err,
        onUnauthorized: handleUnauthorized,
        setError,
        fallbackMessage: 'Failed to load persons',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!initialPersons || initialPersons.length === 0) {
      return;
    }

    setPersons(primePersonDirectory(initialPersons));
    setLoading(false);
  }, [initialPersons]);

  useEffect(() => {
    if (!autoLoad || initialPersons !== undefined) {
      return;
    }

    if (cachedPersons.length > 0) {
      setPersons(cachedPersons);
      setLoading(false);
      return;
    }

    void loadPersons();
  }, [autoLoad, initialPersons, loadPersons]);

  return {
    error,
    loadPersons,
    loading,
    persons,
    refreshPersons: () => loadPersons(true),
  };
}
