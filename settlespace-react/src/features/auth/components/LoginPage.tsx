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
import { BRAND_HEADER_ALT_TEXT } from '../../../shared/components/constants';
import { authCardSurfaceSx, BRAND_HEADER_SRC } from '../../../shared/theme/surfaceStyles';
import { AUTH_UI_TEXT } from '../constants';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onShowRegister: () => void;
  error: string | null;
  loading: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onShowRegister, error, loading }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(username, password);
  };

  return (
    <Box className="auth-shell">
      <Paper elevation={0} sx={{ ...authCardSurfaceSx, maxWidth: 460 }}>
        <Stack spacing={3} alignItems="center">
          <Box
            component="img"
            src={BRAND_HEADER_SRC}
            alt={BRAND_HEADER_ALT_TEXT}
            sx={{ width: '100%', maxWidth: 360, height: 'auto' }}
          />

          <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
            {AUTH_UI_TEXT.SIGN_IN_HEADING}
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Stack spacing={2.5}>
              <TextField
                label="Username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={AUTH_UI_TEXT.USERNAME_PLACEHOLDER}
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
                {loading ? AUTH_UI_TEXT.LOGIN_BUTTON_LOADING : AUTH_UI_TEXT.LOGIN_BUTTON}
              </Button>
              <Button variant="text" onClick={onShowRegister} disabled={loading}>
                {AUTH_UI_TEXT.CREATE_ACCOUNT_LINK}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;