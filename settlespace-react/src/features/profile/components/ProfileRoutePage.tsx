import React, { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/constants';
import { SESSION_EXPIRED_MESSAGE } from '../../../shared/constants/messages';
import { PersonRole } from '../../../shared/types';
import { useProfile } from '../hooks/useProfile';
import ProfilePage from './ProfilePage';

type ProfileRoutePageProps = {
  expireSession: (message?: string) => void;
  setAuthUsername: (nextUsername: string) => void;
  setAuthDisplayName: (nextDisplayName: string) => void;
  setAuthRole: (nextRole: PersonRole) => void;
  setAuthPersonId: (nextPersonId: string) => void;
};

const isProfileRoutePath = (pathname: string) => (
  pathname === APP_ROUTES.PROFILE || pathname.startsWith(`${APP_ROUTES.PROFILE}/`)
);

const ProfileRoutePage: React.FC<ProfileRoutePageProps> = ({
  expireSession,
  setAuthUsername,
  setAuthDisplayName,
  setAuthRole,
  setAuthPersonId,
}) => {
  const location = useLocation();
  const isActiveRoute = isProfileRoutePath(location.pathname);
  const handleUnauthorized = useCallback(() => {
    expireSession(SESSION_EXPIRED_MESSAGE);
  }, [expireSession]);
  const {
    currentPerson,
    handlePasswordChange,
    handleProfileSave,
    loadCurrentPerson,
    passwordLoading,
    profileError,
    profileLoading,
    profileSaveLoading,
  } = useProfile({
    handleUnauthorized,
    setAuthUsername,
    setAuthDisplayName,
    setAuthRole,
    setAuthPersonId,
  });

  useEffect(() => {
    if (!isActiveRoute) {
      return;
    }

    void loadCurrentPerson();
  }, [isActiveRoute, loadCurrentPerson]);

  if (!isActiveRoute) {
    return null;
  }

  return (
    <ProfilePage
      person={currentPerson}
      loading={profileLoading}
      error={profileError}
      saveLoading={profileSaveLoading}
      passwordLoading={passwordLoading}
      onSave={handleProfileSave}
      onChangePassword={handlePasswordChange}
    />
  );
};

export default ProfileRoutePage;
