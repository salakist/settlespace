import React, { useState } from 'react';
import { Button, Paper, Stack, TextField } from '@mui/material';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by first or last name"
          />
          <Button variant="contained" type="submit">
            Search
          </Button>
        </Stack>
      </form>
    </Paper>
  );
};

export default SearchBar;