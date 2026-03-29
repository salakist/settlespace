import React from 'react';
import { Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Address } from './types';

interface PersonAddressEditorProps {
  addresses: Address[];
  onChange: (addresses: Address[]) => void;
  disabled?: boolean;
}

export const createEmptyAddress = (): Address => ({
  label: '',
  streetLine1: '',
  streetLine2: '',
  postalCode: '',
  city: '',
  stateOrRegion: '',
  country: '',
});

const PersonAddressEditor: React.FC<PersonAddressEditorProps> = ({ addresses, onChange, disabled = false }) => {
  const updateAddress = (index: number, field: keyof Address, value: string) => {
    const nextAddresses = [...addresses];
    nextAddresses[index] = {
      ...nextAddresses[index],
      [field]: value,
    };

    onChange(nextAddresses);
  };

  const handleAddAddress = () => {
    onChange([...addresses, createEmptyAddress()]);
  };

  const handleRemoveAddress = (index: number) => {
    onChange(addresses.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Addresses</Typography>
        <Button variant="outlined" onClick={handleAddAddress} disabled={disabled}>
          Add Address
        </Button>
      </Stack>

      {addresses.length === 0 ? (
        <Typography color="text.secondary">No addresses added yet.</Typography>
      ) : (
        addresses.map((address, index) => (
          <Paper key={`${address.label}-${index}`} variant="outlined" sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Address {index + 1}</Typography>
                <IconButton
                  aria-label={`remove address ${index + 1}`}
                  onClick={() => handleRemoveAddress(index)}
                  disabled={disabled}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              <TextField
                label="Label"
                value={address.label}
                onChange={(event) => updateAddress(index, 'label', event.target.value)}
                fullWidth
              />
              <TextField
                label="Street Line 1"
                value={address.streetLine1}
                onChange={(event) => updateAddress(index, 'streetLine1', event.target.value)}
                fullWidth
              />
              <TextField
                label="Street Line 2"
                value={address.streetLine2 ?? ''}
                onChange={(event) => updateAddress(index, 'streetLine2', event.target.value)}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Postal Code"
                  value={address.postalCode}
                  onChange={(event) => updateAddress(index, 'postalCode', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="City"
                  value={address.city}
                  onChange={(event) => updateAddress(index, 'city', event.target.value)}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="State / Region"
                  value={address.stateOrRegion ?? ''}
                  onChange={(event) => updateAddress(index, 'stateOrRegion', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={address.country}
                  onChange={(event) => updateAddress(index, 'country', event.target.value)}
                  fullWidth
                />
              </Stack>
            </Stack>
          </Paper>
        ))
      )}
    </Stack>
  );
};

export default PersonAddressEditor;