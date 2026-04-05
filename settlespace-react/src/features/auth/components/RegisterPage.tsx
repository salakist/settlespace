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
import { authCardSurfaceSx, BRAND_HEADER_SRC } from '../../../shared/theme/surfaceStyles';
import DateInputField from '../../../shared/components/DateInputField';
import { Address } from '../../../shared/types';
import PersonAddressEditor from '../../persons/components/PersonAddressEditor';
import { RegisterRequest } from '../types';

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

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
      <Paper elevation={0} sx={{ ...authCardSurfaceSx, maxWidth: 560 }}>
        <Stack spacing={3} alignItems="center">
          <Box
            component="img"
            src={BRAND_HEADER_SRC}
            alt="SettleSpace header"
            sx={{ width: '100%', maxWidth: 420, height: 'auto' }}
          />

          <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Register
          </Typography>

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
          {validationError && <Alert severity="error" sx={{ width: '100%' }}>{validationError}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
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
              <Stack spacing={1.5}>
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
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  fullWidth
                  required
                />
                <Alert severity="info">
                  Password rules: at least 8 characters, including uppercase, lowercase, number, and special character.
                </Alert>
              </Stack>
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
              <DateInputField
                label="Date of Birth"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                fullWidth
              />
              <PersonAddressEditor addresses={addresses} onChange={setAddresses} disabled={loading} />
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register & Sign In'}
              </Button>
              <Button variant="text" onClick={onShowLogin} disabled={loading}>
                Login
              </Button>
            </Stack>
          </Box>

        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterPage;