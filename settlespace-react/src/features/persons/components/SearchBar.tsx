import React, { useEffect, useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  action?: React.ReactNode;
  ariaLabel?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search by first or last name',
  initialQuery = '',
  action,
  ariaLabel = 'Search',
}) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', md: 'center' }}
      useFlexGap
    >
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        inputProps={{ 'aria-label': ariaLabel }}
      />
      <Button variant="contained" type="submit" sx={{ minWidth: { md: 96 }, px: 1.5, whiteSpace: 'nowrap' }}>
        Search
      </Button>
      {action}
    </Stack>
  );
};

export default SearchBar;