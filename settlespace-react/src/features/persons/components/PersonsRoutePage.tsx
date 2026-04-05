import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/constants';
import {
  canAccessPersonsPage,
  canDeletePerson,
  canEditRole,
  canUpdatePerson,
} from '../../../shared/auth/permissions';
import { Person, PersonRole } from '../../../shared/types';
import { DEFAULT_PERSON_CREATE_ROLE } from '../constants';
import { usePersons } from '../hooks/usePersons';
import PersonsPage from './PersonsPage';

type PersonsRoutePageProps = {
  expireSession: (message?: string) => void;
  currentPersonId?: string;
  role: PersonRole | null;
  redirectTo?: string;
};

const isPersonsRoutePath = (pathname: string) => (
  pathname === APP_ROUTES.PERSONS || pathname.startsWith(`${APP_ROUTES.PERSONS}/`)
);

const PersonsRoutePage: React.FC<PersonsRoutePageProps> = ({
  expireSession,
  currentPersonId,
  role,
  redirectTo = APP_ROUTES.HOME,
}) => {
  const location = useLocation();
  const isActiveRoute = isPersonsRoutePath(location.pathname);
  const {
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
    showCreateForm,
    showForm,
  } = usePersons({ expireSession, currentPersonId, role });

  useEffect(() => {
    if (!isActiveRoute) {
      return;
    }

    void loadPersons();
  }, [isActiveRoute, loadPersons]);

  if (!isActiveRoute) {
    return null;
  }

  if (!canAccessPersonsPage(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  const visiblePersons = currentPersonId
    ? persons.filter((person) => person.id !== currentPersonId)
    : persons;
  const canCreateManagedPerson = role === PersonRole.Admin || role === PersonRole.Manager;

  const canEditManagedPerson = (person: Person) =>
    canUpdatePerson(role, currentPersonId, person, person.role ?? PersonRole.User);

  const canDeleteManagedPerson = (person: Person) => canDeletePerson(role, person);

  return (
    <PersonsPage
      persons={visiblePersons}
      loading={loading}
      saveLoading={saveLoading}
      error={error}
      showForm={showForm}
      editingPerson={editingPerson}
      canCreate={canCreateManagedPerson}
      canEdit={canEditManagedPerson}
      canDelete={canDeleteManagedPerson}
      canEditRole={canEditRole(role)}
      defaultCreateRole={DEFAULT_PERSON_CREATE_ROLE}
      onAdd={showCreateForm}
      onSearch={handleSearch}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default PersonsRoutePage;
