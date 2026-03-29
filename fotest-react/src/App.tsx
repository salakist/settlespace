import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Container, CssBaseline, Stack, Typography, ThemeProvider, createTheme } from '@mui/material';
import './App.css';
import { Person } from './types';
import { personApi } from './api';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import SearchBar from './SearchBar';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#f48fb1' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#bbbbbb',
    },
  },
});

function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await personApi.getAll();
      setPersons(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadPersons();
      return;
    }
    try {
      setLoading(true);
      const response = await personApi.search(query);
      setPersons(response.data);
      setError(null);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (personData: Omit<Person, 'id'>) => {
    try {
      if (editingPerson?.id) {
        await personApi.update(editingPerson.id, personData);
      } else {
        await personApi.create(personData);
      }
      setEditingPerson(undefined);
      setShowForm(false);
      loadPersons();
    } catch (err) {
      setError('Failed to save person');
      console.error(err);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        await personApi.delete(id);
        loadPersons();
      } catch (err) {
        setError('Failed to delete person');
        console.error(err);
      }
    }
  };

  const handleCancel = () => {
    setEditingPerson(undefined);
    setShowForm(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <Container maxWidth="md">
          <Typography variant="h3" align="center" gutterBottom sx={{ mt: 4 }}>
            FoTest Person Manager
          </Typography>

        <SearchBar onSearch={handleSearch} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Manage persons in the database</Typography>
          <Button variant="contained" onClick={() => setShowForm(true)} disabled={showForm}>
            Add New Person
          </Button>
        </Stack>

        {showForm && (
          <PersonForm person={editingPerson} onSave={handleSave} onCancel={handleCancel} />
        )}

        {loading ? (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <PersonList persons={persons} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Container>
    </div>
    </ThemeProvider>
  );
}

export default App;
