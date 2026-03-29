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
import PersonAddressEditor from './PersonAddressEditor';
import { Address, RegisterRequest } from './types';

interface RegisterPageProps {
  onRegister: (request: RegisterRequest) => Promise<void>;
  onShowLogin: () => void;
  error: string | null;
  loading: boolean;
}

const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onShowLogin,
  error,
  loading,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sanitizeAddresses = (items: Address[]) =>
    items.filter((address) => Object.values(address).some((value) => value?.trim()));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Password confirmation does not match.');
      return;
    }

    await onRegister({
      firstName,
      lastName,
      password,
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      addresses: sanitizeAddresses(addresses),
    });
  };

  return (
    <Box className="auth-shell">
      <Paper className="auth-card" elevation={10}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" className="eyebrow">
              First-Time Access
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Register
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your account and get signed in automatically.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {validationError && <Alert severity="error">{validationError}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                fullWidth
                required
              />
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                fullWidth
                required
              />
              <TextField
                label="Phone Number"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                autoComplete="tel"
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                fullWidth
              />
              <TextField
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <PersonAddressEditor addresses={addresses} onChange={setAddresses} disabled={loading} />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                fullWidth
                required
              />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register & Sign In'}
              </Button>
              <Button variant="text" onClick={onShowLogin} disabled={loading}>
                Back to Login
              </Button>
            </Stack>
          </form>

          <Alert severity="info">
            Password rules: at least 8 characters, including uppercase, lowercase, number, and special character.
          </Alert>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterPage;