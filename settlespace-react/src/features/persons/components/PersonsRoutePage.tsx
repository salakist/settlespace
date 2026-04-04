import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  canAccessPersonsPage,
  canDeletePerson,
  canEditRole,
  canUpdatePerson,
} from '../../../shared/auth/permissions';
import { Person, PersonRole } from '../../../shared/types';
import { usePersons } from '../hooks/usePersons';
import PersonsPage from './PersonsPage';

type PersonsRoutePageProps = {
  expireSession: (message?: string) => void;
  currentPersonId?: string;
  role: PersonRole | null;
  redirectTo?: string;
};

const PERSONS_ROUTE = '/persons';

const isPersonsRoutePath = (pathname: string) => pathname === PERSONS_ROUTE || pathname.startsWith(`${PERSONS_ROUTE}/`);

const PersonsRoutePage: React.FC<PersonsRoutePageProps> = ({
  expireSession,
  currentPersonId,
  role,
  redirectTo = '/home',
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
  const canCreateManagedPerson = role === 'ADMIN' || role === 'MANAGER';

  const canEditManagedPerson = (person: Person) =>
    canUpdatePerson(role, currentPersonId, person, person.role ?? 'USER');

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
      defaultCreateRole="USER"
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
