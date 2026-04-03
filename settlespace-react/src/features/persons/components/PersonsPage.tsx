import React from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Person, PersonRole } from '../../../shared/types';
import SearchBar from './SearchBar';
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
  onSearch: (query: string) => void;
  onSave: (person: Omit<Person, 'id'>) => Promise<void>;
  onCancel: () => void;
  onEdit: (person: Person) => void;
  onDelete: (id: string) => void;
};

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
}) => (
  <Stack spacing={2.5}>
    <div>
      <Typography variant="h5">Persons</Typography>
      <Typography variant="body2" color="text.secondary">
        Search the shared directory and manage people, roles, and contact details from one place.
      </Typography>
    </div>

    <SearchBar onSearch={onSearch} />

    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1.5}>
      <Typography variant="subtitle1">Manage persons in the database</Typography>
      <Button variant="contained" onClick={onAdd} disabled={showForm || !canCreate}>
        Add New Person
      </Button>
    </Stack>

    {showForm && (
      <PersonForm
        person={editingPerson}
        onSave={onSave}
        onCancel={onCancel}
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
      !showForm && <PersonList persons={persons} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
    )}
  </Stack>
);

export default PersonsPage;
