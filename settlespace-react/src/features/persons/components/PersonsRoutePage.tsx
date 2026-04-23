import React, { useCallback, useEffect, useMemo } from 'react';
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
import useUrlSearchQuery from '../../search/hooks/useUrlSearchQuery';
import { parsePersonSearchQuery, serializePersonSearchQuery } from '../search/personSearchUrl';
import { PersonSearchQuery } from '../search/personSearchTypes';
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
  const [searchQuery, setQueryToUrl] = useUrlSearchQuery(
    parsePersonSearchQuery,
    serializePersonSearchQuery,
  );
  const {
    editingPerson,
    error,
    handleCancel,
    handleDelete,
    handleEdit,
    handleSave,
    handleSearch,
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

    // Fires on route activation to load results from URL search params.
    // User-initiated searches are handled by handleSearchChange below.
    void handleSearch(searchQuery);
    // searchQuery is intentionally excluded from deps — this effect should only
    // fire when the route becomes active (navigation), not on every query change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActiveRoute, handleSearch]);

  // Handles user-initiated searches: updates URL and immediately fetches results.
  const handleSearchChange = useCallback((query: PersonSearchQuery) => {
    setQueryToUrl(query);
    void handleSearch(query);
  }, [setQueryToUrl, handleSearch]);

  const listPath = useMemo(() => {
    const params = serializePersonSearchQuery(searchQuery).toString();
    return params ? `/persons?${params}` : '/persons';
  }, [searchQuery]);

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
      onSearch={handleSearchChange}
      initialQuery={searchQuery}
      listPath={listPath}
      onSave={handleSave}
      onCancel={handleCancel}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default PersonsRoutePage;
