import { useCallback, useState } from 'react';
import { authApi, personApi } from '../../../shared/api/api';
import { logHandledError } from '../../../shared/api/requestHandling';
import { primePersonDirectory } from '../../../shared/hooks/usePersonDirectory';
import { Person, PersonRole } from '../../../shared/types';

type UseProfileOptions = {
  handleUnauthorized: () => void;
  setAuthUsername: (nextUsername: string) => void;
  setAuthDisplayName: (nextDisplayName: string) => void;
  setAuthRole: (nextRole: PersonRole) => void;
  setAuthPersonId: (nextPersonId: string) => void;
};

export function useProfile({
  handleUnauthorized,
  setAuthUsername,
  setAuthDisplayName,
  setAuthRole,
  setAuthPersonId,
}: UseProfileOptions) {
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const clearProfileState = useCallback(() => {
    setCurrentPerson(null);
    setProfileError(null);
    setProfileLoading(false);
    setProfileSaveLoading(false);
    setPasswordLoading(false);
  }, []);

  const setProfileIdle = useCallback(() => {
    setProfileLoading(false);
  }, []);

  const loadCurrentPerson = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await personApi.getCurrent();
      const person = {
        ...response.data,
        dateOfBirth: response.data.dateOfBirth?.slice(0, 10),
        addresses: response.data.addresses ?? [],
      };
      setCurrentPerson(person);
      primePersonDirectory([person]);
      const nextUsername = person.username?.trim() || `${person.firstName}.${person.lastName}`;
      const nextDisplayName = person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim();
      setAuthUsername(nextUsername);
      setAuthDisplayName(nextDisplayName);
      if (person.id) {
        setAuthPersonId(person.id);
      }
      if (person.role) {
        setAuthRole(person.role);
      }
      setProfileError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        clearProfileState();
        handleUnauthorized();
        return;
      }

      setProfileError('Failed to load your profile.');
      logHandledError(err);
    } finally {
      setProfileLoading(false);
    }
  }, [
    clearProfileState,
    handleUnauthorized,
    setAuthDisplayName,
    setAuthPersonId,
    setAuthRole,
    setAuthUsername,
  ]);

  const handleProfileSave = useCallback(async (personData: Omit<Person, 'id'>) => {
    setProfileSaveLoading(true);
    try {
      await personApi.updateCurrent(personData);
      await loadCurrentPerson();
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        clearProfileState();
        handleUnauthorized();
        return;
      }
      setProfileError('Failed to save your profile.');
      logHandledError(err);
    } finally {
      setProfileSaveLoading(false);
    }
  }, [clearProfileState, handleUnauthorized, loadCurrentPerson]);

  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        clearProfileState();
        handleUnauthorized();
        return;
      }
      throw err;
    } finally {
      setPasswordLoading(false);
    }
  }, [clearProfileState, handleUnauthorized]);

  return {
    clearProfileState,
    currentPerson,
    handlePasswordChange,
    handleProfileSave,
    loadCurrentPerson,
    passwordLoading,
    profileError,
    profileLoading,
    profileSaveLoading,
    setProfileIdle,
  };
}
