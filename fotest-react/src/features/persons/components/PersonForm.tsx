import React, { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Person, PersonRole } from '../../../shared/types';
import {
  PersonDetailsValidationErrors,
  PersonDetailsFormValues,
  createPersonDetailsValues,
  toPersonPayload,
  validatePersonDetails,
} from '../hooks/personDetailsFormUtils';
import PersonDetailsFormFields from './PersonDetailsFormFields';

interface PersonFormProps {
  person?: Person;
  onSave: (person: Omit<Person, 'id'>) => Promise<void>;
  onCancel: () => void;
  saveLoading: boolean;
  canEditRole: boolean;
  defaultRole: PersonRole;
}

const ROLE_VALUES: PersonRole[] = ['ADMIN', 'MANAGER', 'USER'];

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onCancel, saveLoading, canEditRole, defaultRole }) => {
  const [values, setValues] = useState<PersonDetailsFormValues>(() => createPersonDetailsValues(person));
  const [role, setRole] = useState<PersonRole>(person?.role ?? defaultRole);
  const [validationErrors, setValidationErrors] = useState<PersonDetailsValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  let submitLabel = 'Add';
  if (saveLoading) {
    submitLabel = 'Saving...';
  } else if (person) {
    submitLabel = 'Update';
  }

  useEffect(() => {
    setValues(createPersonDetailsValues(person));
    setRole(person?.role ?? defaultRole);
    setValidationErrors({});
    setSubmitError(null);
  }, [defaultRole, person]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextValidationErrors = validatePersonDetails(values);
    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors({});

    try {
      await onSave({
        ...toPersonPayload(values),
        role,
      });
      if (!person) {
        setValues(createPersonDetailsValues());
        setRole(defaultRole);
      }
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      setSubmitError(axiosError.response?.data?.error ?? 'Failed to save person.');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={4}>
      <Typography variant="h6" gutterBottom>
        {person ? 'Edit Person' : 'Add New Person'}
      </Typography>
      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <PersonDetailsFormFields
            values={values}
            onChange={setValues}
            errors={validationErrors}
            disabled={saveLoading}
          />
          <TextField
            select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as PersonRole)}
            disabled={saveLoading || !canEditRole}
            fullWidth
          >
            {ROLE_VALUES.map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" color="primary" disabled={saveLoading}>
              {submitLabel}
            </Button>
            <Button variant="outlined" onClick={onCancel} disabled={saveLoading}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};

export default PersonForm;