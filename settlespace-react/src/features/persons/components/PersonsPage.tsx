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
  <>
    <SearchBar onSearch={onSearch} />

    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
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

    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

    {loading ? (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    ) : (
      !showForm && <PersonList persons={persons} onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
    )}
  </>
);

export default PersonsPage;
