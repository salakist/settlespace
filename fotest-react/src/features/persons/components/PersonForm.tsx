import React, { useEffect, useState } from 'react';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { Person } from '../../../shared/types';
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
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onCancel, saveLoading }) => {
  const [values, setValues] = useState<PersonDetailsFormValues>(() => createPersonDetailsValues(person));
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
    setValidationErrors({});
    setSubmitError(null);
  }, [person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const nextValidationErrors = validatePersonDetails(values);
    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors({});

    try {
      await onSave(toPersonPayload(values));
      if (!person) {
        setValues(createPersonDetailsValues());
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