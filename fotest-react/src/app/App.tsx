import React, { useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button, Container, CssBaseline, Paper, Stack, Tab, Tabs, Typography, ThemeProvider, createTheme } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ErrorIcon from '@mui/icons-material/Error';
import '../styles/App.css';
import LoginPage from '../features/auth/components/LoginPage';
import RegisterPage from '../features/auth/components/RegisterPage';
import ProfilePage from '../features/profile/components/ProfilePage';
import HomePage from '../features/home/components/HomePage';
import PersonsPage from '../features/persons/components/PersonsPage';
import TransactionsPage from '../features/transactions/components/TransactionsPage';
import DebtsPage from '../features/debts/components/DebtsPage';
import { useAuth } from '../features/auth/hooks/useAuth';
import { usePersons } from '../features/persons/hooks/usePersons';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useAppAuth } from './hooks/useAppAuth';
import {
  canAccessPersonsPage,
  canDeletePerson,
  canEditRole,
  canUpdatePerson,
} from '../shared/auth/permissions';
import { Person } from '../shared/types';

const ROUTE_LOGIN = '/login';
const ROUTE_REGISTER = '/register';
const ROUTE_HOME = '/home';
const ROUTE_PERSONS = '/persons';
const ROUTE_PROFILE = '/profile';
const ROUTE_TRANSACTIONS = '/transactions';
const ROUTE_DEBTS = '/debts';

const PRIMARY_TABS = [
  { label: 'Home', value: ROUTE_HOME, icon: HomeIcon },
  { label: 'Persons', value: ROUTE_PERSONS, icon: GroupIcon },
  { label: 'Transactions', value: ROUTE_TRANSACTIONS, icon: CompareArrowsIcon },
  { label: 'Debts', value: ROUTE_DEBTS, icon: ErrorIcon },
] as const;

function getPrimaryTabValue(pathname: string, tabs: readonly { value: string }[]): string | false {
  if (pathname === ROUTE_PROFILE) {
    return false;
  }

  if (tabs.some((tab) => tab.value === pathname)) {
    return pathname;
  }

  return ROUTE_HOME;
}

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
    role,
    register,
    setAuthRole,
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
    saveLoading,
    setDirectoryIdle,
    setPersonInList,
    showCreateForm,
    showForm,
  } = usePersons({ expireSession, role });
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
    setAuthRole,
    setAuthUsername,
    setPersonInList,
  });

  const { handleLogin, handleLogout, handleRegister } = useAppAuth({
    login,
    register,
    logout,
    clearPersonsError,
    clearPersonsState,
    clearProfileState,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const loadInitialData = async () => {
        await loadPersons();
        await loadCurrentPerson();
      };

      loadInitialData().catch((error) => {
        console.error(error);
      });
      return;
    }

    setDirectoryIdle();
    setProfileIdle();
  }, [isAuthenticated, loadCurrentPerson, loadPersons, setDirectoryIdle, setProfileIdle]);

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

  const canAccessPersons = canAccessPersonsPage(role);
  const primaryTabs = PRIMARY_TABS.filter((tab) => tab.value !== ROUTE_PERSONS || canAccessPersons);
  const primaryTabValue = getPrimaryTabValue(location.pathname, primaryTabs);
  const isProfileRoute = location.pathname === ROUTE_PROFILE;
  const visiblePersons = currentPerson?.id
    ? persons.filter((person) => person.id !== currentPerson.id)
    : persons;
  const canCreateManagedPerson = role === 'ADMIN' || role === 'MANAGER';

  const canEditManagedPerson = (person: Person) =>
    canUpdatePerson(role, currentPerson?.id, person, person.role ?? 'USER');

  const canDeleteManagedPerson = (person: Person) => canDeletePerson(role, person);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <Container maxWidth="md">
          <Stack sx={{ pt: 4, mb: 3 }} spacing={1.5}>
            <Typography variant="overline" className="eyebrow">
              Authenticated Session
            </Typography>
            <Typography variant="h3">
              FoTest Person Manager
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                px: { xs: 1, sm: 2 },
                py: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(144, 202, 249, 0.08) 0%, rgba(244, 143, 177, 0.04) 100%)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1}
              >
                <Tabs
                  value={primaryTabValue}
                  onChange={(_, value: string) => navigate(value)}
                  aria-label="Primary navigation"
                  sx={{
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                  }}
                >
                  {primaryTabs.map((tab) => {
                    const Icon = tab.icon;

                    return (
                      <Tab
                        key={tab.value}
                        icon={<Icon sx={{ mr: 0.5 }} />}
                        label={tab.label}
                        value={tab.value}
                        sx={{ textTransform: 'none', fontWeight: 500 }}
                      />
                    );
                  })}
                </Tabs>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ minWidth: 'fit-content' }}
                >
                  <Button
                    onClick={() => navigate(ROUTE_PROFILE)}
                    variant={isProfileRoute ? 'contained' : 'outlined'}
                    startIcon={<PersonIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isProfileRoute ? 600 : 500,
                      borderRadius: 1,
                    }}
                  >
                    {currentPerson ? `${currentPerson.firstName} ${currentPerson.lastName}` : username}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleLogout}
                    sx={{ textTransform: 'none', fontWeight: 500 }}
                  >
                    Log Out
                  </Button>
                </Stack>
              </Stack>
            </Paper>
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
                canAccessPersons
                  ? (
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
                    )
                  : <Navigate to={ROUTE_HOME} replace />
              }
            />
            <Route
              path={ROUTE_TRANSACTIONS}
              element={(
                <TransactionsPage
                  persons={persons}
                  currentPersonId={currentPerson?.id}
                  role={role}
                  expireSession={expireSession}
                />
              )}
            />
            <Route
              path={ROUTE_DEBTS}
              element={<DebtsPage />}
            />
            <Route path="*" element={<Navigate to={ROUTE_HOME} replace />} />
          </Routes>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
