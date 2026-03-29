import React, { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, CircularProgress, Container, CssBaseline, Stack, Typography, ThemeProvider, createTheme } from '@mui/material';
import '../styles/App.css';
import { RegisterRequest } from '../shared/types';
import PersonList from '../features/persons/components/PersonList';
import PersonForm from '../features/persons/components/PersonForm';
import SearchBar from '../features/persons/components/SearchBar';
import LoginPage from '../features/auth/components/LoginPage';
import RegisterPage from '../features/auth/components/RegisterPage';
import ProfilePage from '../features/profile/components/ProfilePage';
import HomePage from '../features/home/components/HomePage';
import { useAuth } from '../features/auth/hooks/useAuth';
import { usePersons } from '../features/persons/hooks/usePersons';
import { useProfile } from '../features/profile/hooks/useProfile';

const ROUTE_LOGIN = '/login';
const ROUTE_REGISTER = '/register';
const ROUTE_HOME = '/home';
const ROUTE_PERSONS = '/persons';
const ROUTE_PROFILE = '/profile';

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
  const navigate = useNavigate();
  const location = useLocation();
  const {
    authError,
    authLoading,
    clearAuthError,
    expireSession,
    isAuthenticated,
    login,
    logout,
    register,
    setAuthUsername,
    username,
  } = useAuth();
  const {
    clearPersonsError,
    clearPersonsState,
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
    setDirectoryIdle,
    setPersonInList,
    showCreateForm,
    showForm,
  } = usePersons({ expireSession });
  const handleUnauthorized = useCallback(() => {
    clearPersonsState();
    expireSession('Your session expired. Please log in again.');
  }, [clearPersonsState, expireSession]);

  const {
    clearProfileState,
    currentPerson,
    handlePasswordChange,
    handleProfileSave,
    loadCurrentPerson,
    passwordLoading,
    profileError,
    profileLoading,
    profileSaveLoading,
    setProfileIdle,
  } = useProfile({
    handleUnauthorized,
    setAuthUsername,
    setPersonInList,
  });

  useEffect(() => {
    if (isAuthenticated) {
      void loadPersons();
      void loadCurrentPerson();
      return;
    }

    setDirectoryIdle();
    setProfileIdle();
  }, [isAuthenticated, loadCurrentPerson, loadPersons, setDirectoryIdle, setProfileIdle]);

  const handleLogin = async (loginUsername: string, loginPassword: string) => {
    const success = await login(loginUsername, loginPassword);
    if (success) {
      clearPersonsError();
    }
  };

  const handleRegister = async (request: RegisterRequest) => {
    const success = await register(request);
    if (success) {
      clearPersonsError();
    }
  };

  const handleLogout = () => {
    clearPersonsState();
    clearProfileState();
    logout();
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Routes>
          <Route
            path={ROUTE_LOGIN}
            element={
              <LoginPage
                onLogin={handleLogin}
                onShowRegister={() => {
                  clearAuthError();
                  navigate(ROUTE_REGISTER);
                }}
                error={authError}
                loading={authLoading}
              />
            }
          />
          <Route
            path={ROUTE_REGISTER}
            element={
              <RegisterPage
                onRegister={handleRegister}
                onShowLogin={() => {
                  clearAuthError();
                  navigate(ROUTE_LOGIN);
                }}
                error={authError}
                loading={authLoading}
              />
            }
          />
          <Route path="*" element={<Navigate to={ROUTE_LOGIN} replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  const isHomeRoute = location.pathname === ROUTE_HOME;
  const isPersonsRoute = location.pathname === ROUTE_PERSONS;
  const isProfileRoute = location.pathname === ROUTE_PROFILE;

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
              {!isHomeRoute && (
                <Button
                  variant="outlined"
                  onClick={() => navigate(ROUTE_HOME)}
                >
                  Back to Home
                </Button>
              )}
              <Button
                variant={isPersonsRoute ? 'contained' : 'outlined'}
                onClick={() => navigate(ROUTE_PERSONS)}
                disabled={isPersonsRoute}
              >
                Persons
              </Button>
              <Button
                variant={isProfileRoute ? 'contained' : 'outlined'}
                onClick={() => navigate(ROUTE_PROFILE)}
                disabled={isProfileRoute}
              >
                Profile
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Log Out
              </Button>
            </Stack>
          </Stack>

          <Routes>
            <Route
              path={ROUTE_HOME}
              element={
                <HomePage
                  displayName={currentPerson ? `${currentPerson.firstName} ${currentPerson.lastName}` : username}
                />
              }
            />
            <Route
              path={ROUTE_PROFILE}
              element={
                <ProfilePage
                  person={currentPerson}
                  loading={profileLoading}
                  error={profileError}
                  saveLoading={profileSaveLoading}
                  passwordLoading={passwordLoading}
                  onSave={handleProfileSave}
                  onChangePassword={handlePasswordChange}
                />
              }
            />
            <Route
              path={ROUTE_PERSONS}
              element={
                <>
                  <SearchBar onSearch={handleSearch} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="subtitle1">Manage persons in the database</Typography>
                    <Button variant="contained" onClick={showCreateForm} disabled={showForm}>
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
              }
            />
            <Route path="*" element={<Navigate to={ROUTE_HOME} replace />} />
          </Routes>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
