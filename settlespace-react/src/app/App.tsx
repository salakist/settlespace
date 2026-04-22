import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Container, CssBaseline, Paper, Stack, Tab, Tabs, ThemeProvider, createTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import '../styles/App.css';
import LoginPage from '../features/auth/components/LoginPage';
import RegisterPage from '../features/auth/components/RegisterPage';
import HomePage from '../features/home/components/HomePage';
import PersonsRoutePage from '../features/persons/components/PersonsRoutePage';
import ProfileRoutePage from '../features/profile/components/ProfileRoutePage';
import TransactionsRoutePage from '../features/transactions/components/TransactionsRoutePage';
import DebtsPage from '../features/debts/components/DebtsPage';
import DebtDetailsPage from '../features/debts/components/DebtDetailsPage';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useAppAuth } from './hooks/useAppAuth';
import { APP_ROUTES, PRIMARY_TABS as PRIMARY_NAV_TABS } from './constants';
import { personApi } from '../features/persons/api';
import { logHandledError } from '../shared/api/requestHandling';
import { canAccessPersonsPage } from '../shared/auth/permissions';
import { BRAND_HEADER_ALT_TEXT } from '../shared/components/constants';
import { SESSION_EXPIRED_MESSAGE } from '../shared/constants/messages';
import { BRAND_HEADER_SRC } from '../shared/theme/surfaceStyles';

function getPrimaryTabValue(pathname: string, tabs: readonly { value: string }[]): string | false {
  if (pathname === APP_ROUTES.PROFILE) {
    return false;
  }

  const matchingTab = tabs.find((tab) => pathname === tab.value || pathname.startsWith(`${tab.value}/`));
  if (matchingTab) {
    return matchingTab.value;
  }

  return APP_ROUTES.HOME;
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
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(144, 202, 249, 0.45)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#90caf9',
          },
        },
      },
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
    displayName,
    expireSession,
    isAuthenticated,
    login,
    logout,
    personId,
    role,
    register,
    setAuthDisplayName,
    setAuthPersonId,
    setAuthRole,
    setAuthUsername,
    username,
  } = useAuth();
  const { handleLogin, handleLogout, handleRegister } = useAppAuth({
    login,
    register,
    logout,
  });

  const isProfileRoute = location.pathname === APP_ROUTES.PROFILE;

  useEffect(() => {
    if (!isAuthenticated || (personId && displayName && role)) {
      return;
    }

    let ignore = false;

    const hydrateIdentity = async () => {
      try {
        const response = await personApi.getCurrent();
        if (ignore) {
          return;
        }

        const person = response.data;
        const nextUsername = person.username?.trim() || `${person.firstName}.${person.lastName}`;
        const nextDisplayName = person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim();

        setAuthUsername(nextUsername);
        setAuthDisplayName(nextDisplayName);
        if (person.id) {
          setAuthPersonId(person.id);
        }
        if (person.role) {
          setAuthRole(person.role);
        }
      } catch (error) {
        if (typeof error === 'object' && error && 'response' in error && (error as { response?: { status?: number } }).response?.status === 401) {
          expireSession(SESSION_EXPIRED_MESSAGE);
          return;
        }

        logHandledError(error);
      }
    };

    void hydrateIdentity();

    return () => {
      ignore = true;
    };
  }, [
    displayName,
    expireSession,
    isAuthenticated,
    personId,
    role,
    setAuthDisplayName,
    setAuthPersonId,
    setAuthRole,
    setAuthUsername,
  ]);

  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Routes>
          <Route
            path={APP_ROUTES.LOGIN}
            element={
              <LoginPage
                onLogin={handleLogin}
                onShowRegister={() => {
                  clearAuthError();
                  navigate(APP_ROUTES.REGISTER);
                }}
                error={authError}
                loading={authLoading}
              />
            }
          />
          <Route
            path={APP_ROUTES.REGISTER}
            element={
              <RegisterPage
                onRegister={handleRegister}
                onShowLogin={() => {
                  clearAuthError();
                  navigate(APP_ROUTES.LOGIN);
                }}
                error={authError}
                loading={authLoading}
              />
            }
          />
          <Route path="*" element={<Navigate to={APP_ROUTES.LOGIN} replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  const canAccessPersons = canAccessPersonsPage(role);
  const primaryTabs = PRIMARY_NAV_TABS.filter((tab) => tab.value !== APP_ROUTES.PERSONS || canAccessPersons);
  const primaryTabValue = getPrimaryTabValue(location.pathname, primaryTabs);
  const currentDisplayName = displayName || username;

  const transactionsRoutePageElement = (
    <TransactionsRoutePage
      currentPersonId={personId || undefined}
      role={role}
      expireSession={expireSession}
    />
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="App">
        <Container maxWidth="md">
          <Stack sx={{ pt: 4, mb: 3 }} spacing={1.5}>
            <Box
              component="img"
              src={BRAND_HEADER_SRC}
              alt={BRAND_HEADER_ALT_TEXT}
              sx={{ width: { xs: '100%', sm: 320 }, maxWidth: '100%', height: 'auto' }}
            />

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
                    onClick={() => navigate(APP_ROUTES.PROFILE)}
                    variant={isProfileRoute ? 'contained' : 'outlined'}
                    startIcon={<PersonIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isProfileRoute ? 600 : 500,
                      borderRadius: 1,
                    }}
                  >
                    {currentDisplayName}
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
              path={APP_ROUTES.HOME}
              element={
                <HomePage
                  displayName={currentDisplayName}
                />
              }
            />
            <Route
              path={APP_ROUTES.PROFILE}
              element={(
                <ProfileRoutePage
                  expireSession={expireSession}
                  setAuthUsername={setAuthUsername}
                  setAuthDisplayName={setAuthDisplayName}
                  setAuthRole={setAuthRole}
                  setAuthPersonId={setAuthPersonId}
                />
              )}
            />
            <Route
              path={APP_ROUTES.PERSONS}
              element={(
                <PersonsRoutePage
                  expireSession={expireSession}
                  currentPersonId={personId || undefined}
                  role={role}
                />
              )}
            />
            <Route
              path={APP_ROUTES.PERSON_CREATE}
              element={(
                <PersonsRoutePage
                  expireSession={expireSession}
                  currentPersonId={personId || undefined}
                  role={role}
                />
              )}
            />
            <Route
              path={APP_ROUTES.PERSON_EDIT}
              element={(
                <PersonsRoutePage
                  expireSession={expireSession}
                  currentPersonId={personId || undefined}
                  role={role}
                />
              )}
            />
            <Route path={APP_ROUTES.TRANSACTIONS} element={transactionsRoutePageElement} />
            <Route path={APP_ROUTES.TRANSACTION_CREATE} element={transactionsRoutePageElement} />
            <Route path={APP_ROUTES.TRANSACTION_EDIT} element={transactionsRoutePageElement} />
            <Route
              path={APP_ROUTES.DEBTS}
              element={(
                <DebtsPage
                  expireSession={expireSession}
                />
              )}
            />
            <Route
              path={APP_ROUTES.DEBT_DETAILS}
              element={(
                <DebtDetailsPage
                  expireSession={expireSession}
                />
              )}
            />
            <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
          </Routes>
        </Container>
      </div>
    </ThemeProvider>
  );
}

export default App;
