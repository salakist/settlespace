import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Chip, IconButton, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import { TransactionStatus } from '../../../shared/types';

const TRANSACTION_STATUSES: TransactionStatus[] = ['Pending', 'Completed', 'Cancelled'];
const EMPTY_QUERY: TransactionSearchQuery = {};

export interface SearchFilterOption {
  param: string;
  value: string;
  label: string;
  group: string;
}

interface TransactionSearchBarProps {
  onSearch: (query: TransactionSearchQuery) => void;
  initialQuery?: TransactionSearchQuery;
  action?: React.ReactNode;
}

function buildStatusOptions(): SearchFilterOption[] {
  return TRANSACTION_STATUSES.map((status) => ({
    param: 'status',
    value: status,
    label: status,
    group: 'Status',
  }));
}

function buildQueryFromFilters(
  filters: SearchFilterOption[],
  freeText: string,
): TransactionSearchQuery {
  const query: TransactionSearchQuery = {};

  const trimmed = freeText.trim();
  if (trimmed) {
    query.freeText = trimmed;
  }

  const statuses = filters
    .filter((f) => f.param === 'status')
    .map((f) => f.value);
  if (statuses.length > 0) {
    query.status = statuses;
  }

  return query;
}

function buildFiltersFromQuery(query: TransactionSearchQuery): SearchFilterOption[] {
  const filters: SearchFilterOption[] = [];
  const allStatusOptions = buildStatusOptions();

  if (query.status) {
    for (const status of query.status) {
      const option = allStatusOptions.find((o) => o.value === status);
      if (option) {
        filters.push(option);
      }
    }
  }

  return filters;
}

const TransactionSearchBar: React.FC<TransactionSearchBarProps> = ({
  onSearch,
  initialQuery = EMPTY_QUERY,
  action,
}) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilterOption[]>(() =>
    buildFiltersFromQuery(initialQuery),
  );
  const [inputValue, setInputValue] = useState(initialQuery.freeText ?? '');

  useEffect(() => {
    setActiveFilters(buildFiltersFromQuery(initialQuery));
    setInputValue(initialQuery.freeText ?? '');
  }, [initialQuery]);

  const availableOptions = useMemo(() => {
    const allOptions = buildStatusOptions();
    const activeKeys = new Set(activeFilters.map((f) => `${f.param}:${f.value}`));
    return allOptions.filter((o) => !activeKeys.has(`${o.param}:${o.value}`));
  }, [activeFilters]);

  const handleSelectOption = useCallback(
    (_event: React.SyntheticEvent, option: SearchFilterOption | string | null) => {
      if (!option || typeof option === 'string') {
        return;
      }
      setActiveFilters((prev) => [...prev, option]);
      setInputValue('');
    },
    [],
  );

  const handleRemoveFilter = useCallback((filterToRemove: SearchFilterOption) => {
    setActiveFilters((prev) =>
      prev.filter((f) => !(f.param === filterToRemove.param && f.value === filterToRemove.value)),
    );
  }, []);

  const handleSubmit = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();
      onSearch(buildQueryFromFilters(activeFilters, inputValue));
    },
    [activeFilters, inputValue, onSearch],
  );

  return (
    <Stack spacing={1}>
      <Stack
        component="form"
        onSubmit={handleSubmit}
        direction="row"
        alignItems="center"
        sx={{ gap: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            flex: 1,
            borderRadius: 1,
            '&:focus-within': {
              outline: (theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -1,
            },
            '&:focus-within .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider',
              borderWidth: 1,
            },
          }}
        >
        <Autocomplete
          freeSolo
          options={availableOptions}
          getOptionLabel={(option) =>
            typeof option === 'string' ? option : option.label
          }
          groupBy={(option) => (typeof option === 'string' ? '' : option.group)}
          inputValue={inputValue}
          onInputChange={(_event, newValue, reason) => {
            if (reason !== 'reset') {
              setInputValue(newValue);
            }
          }}
          onChange={handleSelectOption}
          value={null}
          filterOptions={(options, state) => {
            if (!state.inputValue) return [];
            const search = state.inputValue.toLowerCase();
            return options.filter(
              (o) =>
                o.label.toLowerCase().includes(search) ||
                o.group.toLowerCase().includes(search),
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search or filter transactions..."
              inputProps={{
                ...params.inputProps,
                'aria-label': 'Transaction search',
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                },
              }}
            />
          )}
          sx={{ flex: 1 }}
          clearOnBlur={false}
          selectOnFocus={false}
          handleHomeEndKeys={false}
          data-testid="transaction-search-autocomplete"
        />
        <IconButton
          type="submit"
          aria-label="Search"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 0,
            borderTopRightRadius: (theme) => `${theme.shape.borderRadius}px`,
            borderBottomRightRadius: (theme) => `${theme.shape.borderRadius}px`,
            height: 40,
            width: 40,
            border: 1,
            borderColor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark', borderColor: 'primary.dark' },
          }}
        >
          <SearchIcon fontSize="small" />
        </IconButton>
        </Stack>
        {action}
      </Stack>
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {activeFilters.map((filter) => (
            <Chip
              key={`${filter.param}:${filter.value}`}
              label={`${filter.group}: ${filter.label}`}
              onDelete={() => handleRemoveFilter(filter)}
              size="small"
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default TransactionSearchBar;
