import React from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import DateInputField from '../../../shared/components/DateInputField';
import PersonAddressEditor from './PersonAddressEditor';
import { PersonDetailsFormValues, PersonDetailsValidationErrors } from '../hooks/personDetailsFormUtils';

interface PersonDetailsFormFieldsProps {
  values: PersonDetailsFormValues;
  onChange: (nextValues: PersonDetailsFormValues) => void;
  errors?: PersonDetailsValidationErrors;
  disabled?: boolean;
}

const PersonDetailsFormFields: React.FC<PersonDetailsFormFieldsProps> = ({
  values,
  onChange,
  errors,
  disabled = false,
}) => {
  const setField = (field: keyof PersonDetailsFormValues, value: string) => {
    onChange({
      ...values,
      [field]: value,
    });
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="First Name"
          value={values.firstName}
          onChange={(event) => setField('firstName', event.target.value)}
          fullWidth
          required
          disabled={disabled}
          error={Boolean(errors?.firstName)}
          helperText={errors?.firstName}
        />
        <TextField
          label="Last Name"
          value={values.lastName}
          onChange={(event) => setField('lastName', event.target.value)}
          fullWidth
          required
          disabled={disabled}
          error={Boolean(errors?.lastName)}
          helperText={errors?.lastName}
        />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Phone Number"
          type="tel"
          value={values.phoneNumber}
          onChange={(event) => setField('phoneNumber', event.target.value)}
          fullWidth
          disabled={disabled}
          error={Boolean(errors?.phoneNumber)}
          helperText={errors?.phoneNumber}
        />
        <TextField
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => setField('email', event.target.value)}
          fullWidth
          disabled={disabled}
          error={Boolean(errors?.email)}
          helperText={errors?.email}
        />
      </Stack>
      <DateInputField
        label="Date of Birth"
        value={values.dateOfBirth}
        onChange={(event) => setField('dateOfBirth', event.target.value)}
        fullWidth
        disabled={disabled}
        error={Boolean(errors?.dateOfBirth)}
        helperText={errors?.dateOfBirth}
      />
      <PersonAddressEditor
        addresses={values.addresses}
        onChange={(addresses) => onChange({ ...values, addresses })}
        disabled={disabled}
      />
      {errors?.addresses && (
        <Typography color="error" variant="body2">
          {errors.addresses}
        </Typography>
      )}
    </Stack>
  );
};

export default PersonDetailsFormFields;
