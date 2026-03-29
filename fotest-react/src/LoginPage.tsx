import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onShowRegister: () => void;
  error: string | null;
  loading: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowRegister, error, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(username, password);
  };

  return (
    <Box className="auth-shell">
      <Paper className="auth-card" elevation={10}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" className="eyebrow">
              Secure Access
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Sign In
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Authenticate to access the person manager.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="firstName.lastName"
                fullWidth
                autoComplete="username"
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                autoComplete="current-password"
                required
              />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Signing In...' : 'Log In'}
              </Button>
              <Button variant="text" onClick={onShowRegister} disabled={loading}>
                Create Account
              </Button>
            </Stack>
          </form>

          <Alert severity="info">
            Username format: <strong>firstName.lastName</strong> (for example <strong>john.doe</strong>). Use the person's password.
          </Alert>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;