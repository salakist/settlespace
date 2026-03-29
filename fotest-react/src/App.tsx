import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Container, CssBaseline, Stack, Typography, ThemeProvider, createTheme } from '@mui/material';
import './App.css';
import { Person, RegisterRequest } from './types';
import { authApi, authStorage, personApi } from './api';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import SearchBar from './SearchBar';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProfilePage from './ProfilePage';

type AuthView = 'login' | 'register';
type AppView = 'directory' | 'profile';

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
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(authStorage.isAuthenticated());
  const [username, setUsername] = useState(authStorage.getUsername() ?? '');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [appView, setAppView] = useState<AppView>('directory');

  const normalizePerson = (person: Person): Person => ({
    ...person,
    dateOfBirth: person.dateOfBirth?.slice(0, 10),
    addresses: person.addresses ?? [],
  });

  const formatUsername = (person: Pick<Person, 'firstName' | 'lastName'>) => `${person.firstName}.${person.lastName}`;

  const handleUnauthorized = useCallback(() => {
    authStorage.clearSession();
    setIsAuthenticated(false);
    setUsername('');
    setCurrentPerson(null);
    setAuthError('Your session expired. Please log in again.');
    setPersons([]);
    setAppView('directory');
  }, []);

  const loadPersons = useCallback(async () => {
    try {
      setLoading(true);
      const response = await personApi.getAll();
      setPersons(response.data.map(normalizePerson));
      setError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setError('Failed to load persons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  const loadCurrentPerson = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await personApi.getCurrent();
      const person = normalizePerson(response.data);
      setCurrentPerson(person);
      const nextUsername = formatUsername(person);
      setUsername(nextUsername);
      authStorage.setUsername(nextUsername);
      setProfileError(null);
    } catch (err) {
      if (typeof err === 'object' && err && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        handleUnauthorized();
        return;
      }

      setProfileError('Failed to load your profile.');
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadPersons();
      void loadCurrentPerson();
      return;
    }

    setLoading(false);
    setProfileLoading(false);
  }, [isAuthenticated, loadCurrentPerson, loadPersons]);

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

  const handleRegister = async (request: RegisterRequest) => {
    try {
      setLoading(true);
      const response = await authApi.register(request);
      authStorage.saveSession(response.data);
      setUsername(response.data.username);
      setIsAuthenticated(true);
      setAuthError(null);
      setError(null);
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setAuthError(axiosError.response?.data?.error ?? 'Registration failed.');
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
    setCurrentPerson(null);
    setEditingPerson(undefined);
    setShowForm(false);
    setError(null);
    setProfileError(null);
    setAppView('directory');
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setPasswordLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
    } finally {
      setPasswordLoading(false);
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
        await personApi.update(editingPerson.id, {
          ...editingPerson,
          ...personData,
          addresses: editingPerson.addresses ?? [],
        });
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

  const handleProfileSave = async (personData: Omit<Person, 'id'>) => {
    setProfileSaveLoading(true);
    try {
      await personApi.updateCurrent(personData);
      await Promise.all([loadCurrentPerson(), loadPersons()]);
    } finally {
      setProfileSaveLoading(false);
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
        {authView === 'login' ? (
          <LoginPage
            onLogin={handleLogin}
            onShowRegister={() => {
              setAuthError(null);
              setAuthView('register');
            }}
            error={authError}
            loading={loading}
          />
        ) : (
          <RegisterPage
            onRegister={handleRegister}
            onShowLogin={() => {
              setAuthError(null);
              setAuthView('login');
            }}
            error={authError}
            loading={loading}
          />
        )}
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
                Signed in as {currentPerson ? `${currentPerson.firstName} ${currentPerson.lastName}` : username}
              </Typography>
            </div>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                onClick={() => setAppView((view) => (view === 'profile' ? 'directory' : 'profile'))}
              >
                {appView === 'profile' ? 'Back to Persons' : 'Profile'}
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Log Out
              </Button>
            </Stack>
          </Stack>

          {appView === 'profile' ? (
            <ProfilePage
              person={currentPerson}
              loading={profileLoading}
              error={profileError}
              saveLoading={profileSaveLoading}
              passwordLoading={passwordLoading}
              onSave={handleProfileSave}
              onChangePassword={handlePasswordChange}
            />
          ) : (
            <>
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
            </>
          )}
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
