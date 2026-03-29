import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import PersonAddressEditor from './PersonAddressEditor';
import ChangePasswordForm from './ChangePasswordForm';
import { Address, Person } from './types';

interface ProfilePageProps {
  person: Person | null;
  loading: boolean;
  error: string | null;
  saveLoading: boolean;
  passwordLoading: boolean;
  onSave: (person: Omit<Person, 'id'>) => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  person,
  loading,
  error,
  saveLoading,
  passwordLoading,
  onSave,
  onChangePassword,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!person) {
      return;
    }

    setFirstName(person.firstName);
    setLastName(person.lastName);
    setPhoneNumber(person.phoneNumber ?? '');
    setEmail(person.email ?? '');
    setDateOfBirth(person.dateOfBirth?.slice(0, 10) ?? '');
    setAddresses(person.addresses ?? []);
  }, [person]);

  const sanitizeAddresses = (items: Address[]) =>
    items.filter((address) => Object.values(address).some((value) => value?.trim()));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await onSave({
        firstName,
        lastName,
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        addresses: sanitizeAddresses(addresses),
      });
      setSaveSuccess('Profile updated successfully.');
    } catch (submissionError) {
      const axiosError = submissionError as { response?: { data?: { error?: string } } };
      setSaveError(axiosError.response?.data?.error ?? 'Failed to update profile.');
    }
  };

  if (loading && !person) {
    return (
      <Stack alignItems="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }} elevation={4}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" className="eyebrow">
              Personal Settings
            </Typography>
            <Typography variant="h5">Profile</Typography>
            <Typography color="text.secondary">
              Update your account information and contact details.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {saveError && <Alert severity="error">{saveError}</Alert>}
          {saveSuccess && <Alert severity="success">{saveSuccess}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  fullWidth
                  required
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Phone Number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <PersonAddressEditor addresses={addresses} onChange={setAddresses} disabled={saveLoading} />
              <Button type="submit" variant="contained" disabled={saveLoading}>
                {saveLoading ? 'Saving Profile...' : 'Save Profile'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>

      <ChangePasswordForm onSubmit={onChangePassword} loading={passwordLoading} />
    </Stack>
  );
};

export default ProfilePage;