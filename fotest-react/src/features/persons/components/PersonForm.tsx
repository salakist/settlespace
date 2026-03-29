import React, { useState } from 'react';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Person } from '../../../shared/types';

interface PersonFormProps {
  person?: Person;
  onSave: (person: Omit<Person, 'id'>) => void;
  onCancel: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onSave, onCancel }) => {
  const [firstName, setFirstName] = useState(person?.firstName || '');
  const [lastName, setLastName] = useState(person?.lastName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ firstName, lastName });
    setFirstName('');
    setLastName('');
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={4}>
      <Typography variant="h6" gutterBottom>
        {person ? 'Edit Person' : 'Add New Person'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" color="primary">
              {person ? 'Update' : 'Add'}
            </Button>
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
};

export default PersonForm;