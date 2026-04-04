import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import ChangePasswordForm from '../../auth/components/ChangePasswordForm';
import { Person } from '../../../shared/types';
import PersonDetailsFormFields from '../../persons/components/PersonDetailsFormFields';
import {
  PersonDetailsFormValues,
  PersonDetailsValidationErrors,
  createPersonDetailsValues,
  toPersonPayload,
  validatePersonDetails,
} from '../../persons/hooks/personDetailsFormUtils';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';

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
  const [values, setValues] = useState<PersonDetailsFormValues>(() => createPersonDetailsValues());
  const [validationErrors, setValidationErrors] = useState<PersonDetailsValidationErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    setValues(createPersonDetailsValues(person ?? undefined));
    setValidationErrors({});
  }, [person]);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const nextValidationErrors = validatePersonDetails(values);
    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors({});

    try {
      await onSave(toPersonPayload(values));
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
      <Paper sx={panelSurfaceSx} elevation={0}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5">Profile</Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {saveError && <Alert severity="error">{saveError}</Alert>}
          {saveSuccess && <Alert severity="success">{saveSuccess}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Role"
                value={person?.role ?? ''}
                fullWidth
                disabled
              />
              <PersonDetailsFormFields
                values={values}
                onChange={setValues}
                errors={validationErrors}
                disabled={saveLoading}
              />
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