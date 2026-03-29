import { useCallback, useState } from 'react';
import { authApi, personApi } from '../../../shared/api/api';
import { Person } from '../../../shared/types';

type UseProfileOptions = {
  handleUnauthorized: () => void;
  setAuthUsername: (nextUsername: string) => void;
  setPersonInList: (person: Person) => void;
};

export function useProfile({ handleUnauthorized, setAuthUsername, setPersonInList }: UseProfileOptions) {
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
      setPersonInList(person);
      const nextUsername = `${person.firstName}.${person.lastName}`;
      setAuthUsername(nextUsername);
      setProfileError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        clearProfileState();
        handleUnauthorized();
        return;
      }

      setProfileError('Failed to load your profile.');
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }, [clearProfileState, handleUnauthorized, setAuthUsername, setPersonInList]);

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
      console.error(err);
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
