import React from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { Person } from '../../../shared/types';
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
      <Button variant="contained" onClick={onAdd} disabled={showForm}>
        Add New Person
      </Button>
    </Stack>

    {showForm && (
      <PersonForm person={editingPerson} onSave={onSave} onCancel={onCancel} saveLoading={saveLoading} />
    )}

    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

    {loading ? (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    ) : (
      !showForm && <PersonList persons={persons} onEdit={onEdit} onDelete={onDelete} />
    )}
  </>
);

export default PersonsPage;
