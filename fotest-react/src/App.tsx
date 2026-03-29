import React, { useState, useEffect } from 'react';
import { Alert, Button, CircularProgress, Container, CssBaseline, Stack, Typography, ThemeProvider, createTheme } from '@mui/material';
import './App.css';
import { Person } from './types';
import { authApi, authStorage, personApi } from './api';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import SearchBar from './SearchBar';
import LoginPage from './LoginPage';

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
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [username, setUsername] = useState(authStorage.getUsername() ?? '');

  useEffect(() => {
    if (isAuthenticated) {
      loadPersons();
      return;
    }

    setLoading(false);
  }, [isAuthenticated]);

  const loadPersons = async () => {
    try {
      setLoading(true);
      const response = await personApi.getAll();
      setPersons(response.data);
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        authStorage.clearSession();
        setIsAuthenticated(false);
        setUsername('');
        setAuthError('Your session expired. Please log in again.');
        setPersons([]);
        return;
      }
      setError('Failed to load persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loginUsername: string, loginPassword: string) => {
    try {
      setLoading(true);
      const response = await authApi.login({ username: loginUsername, password: loginPassword });
      authStorage.saveSession(response.data);
      setUsername(response.data.username);
      setIsAuthenticated(true);
      setAuthError(null);
      setError(null);
    } catch (err) {
      setAuthError('Invalid username or password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsername('');
    setPersons([]);
    setEditingPerson(undefined);
    setShowForm(false);
    setError(null);
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

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <LoginPage onLogin={handleLogin} error={authError} loading={loading} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <Container maxWidth="md">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ pt: 4, mb: 3 }} spacing={2}>
            <div>
              <Typography variant="overline" className="eyebrow">
                Authenticated Session
              </Typography>
              <Typography variant="h3" gutterBottom>
                FoTest Person Manager
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Signed in as {username}
              </Typography>
            </div>
            <Button variant="outlined" color="secondary" onClick={handleLogout}>
              Log Out
            </Button>
          </Stack>

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

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Stack alignItems="center" sx={{ mt: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <PersonList persons={persons} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
