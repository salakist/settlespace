import React, { useState } from 'react';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { insetSurfaceSx } from '../../../shared/theme/surfaceStyles';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = 'Search by first or last name' }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Paper elevation={0} sx={{ ...insetSurfaceSx, mb: 3 }}>
      <Stack component="form" onSubmit={handleSubmit} spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          Find entries quickly by name or keyword.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            fullWidth
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
          <Button variant="contained" type="submit">
            Search
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default SearchBar;