import React, { useEffect, useState } from 'react';
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { getEnumValues, Person, PersonRole, parsePersonRole } from '../../../shared/types';
import { DEFAULT_PERSON_CREATE_ROLE } from '../constants';
import {
  PersonDetailsValidationErrors,
  PersonDetailsFormValues,
  createPersonDetailsValues,
  toPersonPayload,
  validatePersonDetails,
} from '../hooks/personDetailsFormUtils';
import { panelSurfaceSx } from '../../../shared/theme/surfaceStyles';
import PersonDetailsFormFields from './PersonDetailsFormFields';

interface PersonFormProps {
  person?: Person;
  onSave: (person: Omit<Person, 'id'>) => Promise<void>;
  onCancel: () => void;
  saveLoading: boolean;
  canEditRole: boolean;
  defaultRole: PersonRole;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onCancel, saveLoading, canEditRole, defaultRole = DEFAULT_PERSON_CREATE_ROLE }) => {
  const [values, setValues] = useState<PersonDetailsFormValues>(() => createPersonDetailsValues(person));
  const [role, setRole] = useState<PersonRole>(person?.role ?? defaultRole);
  const [validationErrors, setValidationErrors] = useState<PersonDetailsValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  let submitLabel = 'Create';
  if (saveLoading) {
    submitLabel = person ? 'Saving...' : 'Creating...';
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
    <Paper sx={{ ...panelSurfaceSx, mb: 3 }} elevation={0}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'flex-start' }}
            spacing={1.5}
          >
            <Typography variant="h6">
              {person ? 'Edit Person' : 'Create New Person'}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="submit" variant="contained" color="primary" disabled={saveLoading}>
                {submitLabel}
              </Button>
              <Button variant="outlined" onClick={onCancel} disabled={saveLoading}>
                Cancel
              </Button>
            </Stack>
          </Stack>
          {submitError && <Alert severity="error">{submitError}</Alert>}
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
            onChange={(event) => setRole(parsePersonRole(event.target.value) ?? defaultRole)}
            disabled={saveLoading || !canEditRole}
            fullWidth
          >
            {getEnumValues(PersonRole).map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </form>
    </Paper>
  );
};

export default PersonForm;