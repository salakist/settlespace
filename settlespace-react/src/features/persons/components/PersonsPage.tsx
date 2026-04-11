import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Person, PersonRole } from '../../../shared/types';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { PersonSearchQuery } from '../search/personSearchTypes';
import PersonSearchBar from './PersonSearchBar';
import PersonForm from './PersonForm';
import PersonList from './PersonList';

type PersonsPageProps = {
  persons: Person[];
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  showForm: boolean;
  editingPerson?: Person;
  canCreate: boolean;
  canEdit: (person: Person) => boolean;
  canDelete: (person: Person) => boolean;
  canEditRole: boolean;
  defaultCreateRole: PersonRole;
  onAdd: () => void;
  onSearch: (query: PersonSearchQuery) => void;
  onSave: (person: Omit<Person, 'id'>) => Promise<void>;
  onCancel: () => void;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
};

function buildPersonSearchQuery(person: Person): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
}

const PersonsPage: React.FC<PersonsPageProps> = ({
  persons,
  loading,
  saveLoading,
  error,
  showForm,
  editingPerson,
  canCreate,
  canEdit,
  canDelete,
  canEditRole,
  defaultCreateRole,
  onAdd,
  onSearch,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { personId } = useParams();
  const decodedPersonId = personId ? decodeURIComponent(personId) : undefined;
  const isCreateRoute = location.pathname.endsWith('/new');
  const currentRouteKey = useMemo(() => {
    if (isCreateRoute) {
      return 'create';
    }

    if (decodedPersonId) {
      return `edit:${decodedPersonId}`;
    }

    return 'list';
  }, [decodedPersonId, isCreateRoute]);
  const lastSyncedRouteKey = useRef<string>('');
  const [pendingDeletePerson, setPendingDeletePerson] = useState<{ id: string; label: string } | null>(null);

  const routedPerson = useMemo(
    () => persons.find((person) => person.id === decodedPersonId),
    [decodedPersonId, persons],
  );

  useEffect(() => {
    if (lastSyncedRouteKey.current === currentRouteKey) {
      return;
    }

    if (currentRouteKey === 'create') {
      onAdd();
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    if (decodedPersonId) {
      if (!routedPerson) {
        return;
      }

      onEdit(routedPerson);
      lastSyncedRouteKey.current = currentRouteKey;
      return;
    }

    onCancel();
    lastSyncedRouteKey.current = currentRouteKey;
  }, [currentRouteKey, decodedPersonId, onAdd, onCancel, onEdit, routedPerson]);

  const displayForm = showForm || currentRouteKey !== 'list';
  const currentEditingPerson = editingPerson ?? routedPerson;

  const handleAddClick = () => {
    if (!canCreate) {
      return;
    }

    lastSyncedRouteKey.current = 'create';
    onAdd();
    navigate('/persons/new');
  };

  const handleEditNavigate = (person: Person) => {
    if (!person.id) {
      return;
    }

    lastSyncedRouteKey.current = `edit:${person.id}`;
    onEdit(person);
    navigate(`/persons/${encodeURIComponent(person.id)}/edit`);
  };

  const handleViewTransactions = (person: Person) => {
    const nextParams = new URLSearchParams();

    if (person.id) {
      nextParams.append('involved', person.id);
    } else {
      const searchQuery = buildPersonSearchQuery(person);
      if (searchQuery) {
        nextParams.set('freeText', searchQuery);
      }
    }

    const params = nextParams.toString();
    navigate(params ? `/transactions?${params}` : '/transactions');
  };

  const handleViewDebts = (person: Person) => {
    const searchQuery = buildPersonSearchQuery(person);
    navigate(searchQuery ? `/debts?search=${encodeURIComponent(searchQuery)}` : '/debts');
  };

  const handleDeleteRequest = (id: string) => {
    const targetPerson = persons.find((person) => person.id === id);
    const label = targetPerson
      ? `${targetPerson.firstName} ${targetPerson.lastName}`.trim()
      : 'this person';

    setPendingDeletePerson({ id, label });
  };

  const handleDeleteCancel = () => {
    setPendingDeletePerson(null);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDeletePerson?.id) {
      return;
    }

    onDelete(pendingDeletePerson.id);
    setPendingDeletePerson(null);
  };

  const handleCancelAndClose = () => {
    onCancel();
    navigate('/persons');
  };

  const handleSaveAndClose = async (person: Omit<Person, 'id'>) => {
    await onSave(person);
    navigate('/persons');
  };

  return (
    <Stack spacing={2.5}>
      {!displayForm && (
        <PersonSearchBar
          onSearch={onSearch}
          action={(
            <Button
              variant="contained"
              onClick={handleAddClick}
              disabled={!canCreate}
              sx={{ whiteSpace: 'nowrap', px: 3.5 }}
            >
              Create Person
            </Button>
          )}
        />
      )}

      {displayForm && (
        <PersonForm
          person={currentEditingPerson}
          onSave={handleSaveAndClose}
          onCancel={handleCancelAndClose}
          saveLoading={saveLoading}
          canEditRole={canEditRole}
          defaultRole={defaultCreateRole}
        />
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <CircularProgress />
        </Stack>
      ) : (
        !displayForm && (
          <PersonList
            persons={persons}
            onEdit={handleEditNavigate}
            onDelete={handleDeleteRequest}
            onViewTransactions={handleViewTransactions}
            onViewDebts={handleViewDebts}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        )
      )}

      <ConfirmationDialog
        open={Boolean(pendingDeletePerson)}
        title="Delete person?"
        message={pendingDeletePerson
          ? `Are you sure you want to delete ${pendingDeletePerson.label}? This action cannot be undone.`
          : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Stack>
  );
};

export default PersonsPage;
