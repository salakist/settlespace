import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Chip, IconButton, Stack, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import { Person, TransactionStatus } from '../../../shared/types';

const TRANSACTION_STATUSES: TransactionStatus[] = ['Pending', 'Completed', 'Cancelled'];
const INVOLVEMENT_TYPES = ['Owned', 'Managed'] as const;
const TEXT_INPUT_PARAMS = ['category', 'description'] as const;
const EMPTY_QUERY: TransactionSearchQuery = {};

export interface SearchFilterOption {
  param: string;
  value: string;
  label: string;
  group: string;
  isPrompt?: boolean;
}

interface TransactionSearchBarProps {
  onSearch: (query: TransactionSearchQuery) => void;
  initialQuery?: TransactionSearchQuery;
  action?: React.ReactNode;
  persons?: Person[];
}

function buildStatusOptions(): SearchFilterOption[] {
  return TRANSACTION_STATUSES.map((status) => ({
    param: 'status',
    value: status,
    label: status,
    group: 'Status',
  }));
}

function buildInvolvementOptions(): SearchFilterOption[] {
  return INVOLVEMENT_TYPES.map((type) => ({
    param: 'involvement',
    value: type,
    label: type,
    group: 'Involvement',
  }));
}

function buildTextInputPrompts(): SearchFilterOption[] {
  return TEXT_INPUT_PARAMS.map((param) => ({
    param,
    value: '',
    label: param.charAt(0).toUpperCase() + param.slice(1),
    group: param.charAt(0).toUpperCase() + param.slice(1),
    isPrompt: true,
  }));
}

const MANAGED_BY_LABEL = 'Managed By';

function buildPersonSearchPrompts(): SearchFilterOption[] {
  return [
    { param: 'involved', value: '', label: 'Involved', group: 'Involved', isPrompt: true },
    { param: 'managedBy', value: '', label: MANAGED_BY_LABEL, group: MANAGED_BY_LABEL, isPrompt: true },
    { param: 'payer', value: '', label: 'Payer', group: 'Payer', isPrompt: true },
    { param: 'payee', value: '', label: 'Payee', group: 'Payee', isPrompt: true },
  ];
}

const PERSON_SEARCH_PARAMS = new Set(['involved', 'managedBy', 'payer', 'payee']);
const SINGLE_PERSON_PARAMS = new Set(['payer', 'payee']);

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

  const involvement = filters.find((f) => f.param === 'involvement');
  if (involvement) {
    query.involvement = involvement.value;
  }

  const category = filters.find((f) => f.param === 'category');
  if (category) {
    query.category = category.value;
  }

  const description = filters.find((f) => f.param === 'description');
  if (description) {
    query.description = description.value;
  }

  const involvedIds = filters
    .filter((f) => f.param === 'involved')
    .map((f) => f.value);
  if (involvedIds.length > 0) {
    query.involved = involvedIds;
  }

  const managedByIds = filters
    .filter((f) => f.param === 'managedBy')
    .map((f) => f.value);
  if (managedByIds.length > 0) {
    query.managedBy = managedByIds;
  }

  const payer = filters.find((f) => f.param === 'payer');
  if (payer) {
    query.payer = payer.value;
  }

  const payee = filters.find((f) => f.param === 'payee');
  if (payee) {
    query.payee = payee.value;
  }

  return query;
}

function buildTextFilter(param: string, value: string, group: string): SearchFilterOption {
  return { param, value, label: value, group };
}

function resolvePersonName(personId: string, persons?: Person[]): string {
  const person = persons?.find((p) => p.id === personId);
  return person ? `${person.firstName} ${person.lastName}` : personId;
}

function buildFiltersFromQuery(query: TransactionSearchQuery, persons?: Person[]): SearchFilterOption[] {
  const filters: SearchFilterOption[] = [];

  if (query.status) {
    const allStatusOptions = buildStatusOptions();
    filters.push(...query.status.flatMap((s) => allStatusOptions.filter((o) => o.value === s)));
  }

  if (query.involvement) {
    const match = buildInvolvementOptions().find((o) => o.value === query.involvement);
    if (match) filters.push(match);
  }

  if (query.category) {
    filters.push(buildTextFilter('category', query.category, 'Category'));
  }

  if (query.description) {
    filters.push(buildTextFilter('description', query.description, 'Description'));
  }

  if (query.involved) {
    for (const personId of query.involved) {
      filters.push({
        param: 'involved',
        value: personId,
        label: resolvePersonName(personId, persons),
        group: 'Involved',
      });
    }
  }

  if (query.managedBy) {
    for (const personId of query.managedBy) {
      filters.push({
        param: 'managedBy',
        value: personId,
        label: resolvePersonName(personId, persons),
        group: MANAGED_BY_LABEL,
      });
    }
  }

  if (query.payer) {
    filters.push({
      param: 'payer',
      value: query.payer,
      label: resolvePersonName(query.payer, persons),
      group: 'Payer',
    });
  }

  if (query.payee) {
    filters.push({
      param: 'payee',
      value: query.payee,
      label: resolvePersonName(query.payee, persons),
      group: 'Payee',
    });
  }

  return filters;
}

function getAutocompleteOptions(
  pendingParam: string | null,
  personOptions: SearchFilterOption[],
  availableOptions: SearchFilterOption[],
): SearchFilterOption[] {
  if (pendingParam && PERSON_SEARCH_PARAMS.has(pendingParam)) return personOptions;
  if (pendingParam) return [];
  return availableOptions;
}

function getPlaceholder(pendingParam: string | null): string {
  if (pendingParam && PERSON_SEARCH_PARAMS.has(pendingParam)) return 'Type a person name...';
  if (pendingParam) return 'Type a value...';
  return 'Search or filter transactions...';
}

const TransactionSearchBar: React.FC<TransactionSearchBarProps> = ({
  onSearch,
  initialQuery = EMPTY_QUERY,
  action,
  persons,
}) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilterOption[]>(() =>
    buildFiltersFromQuery(initialQuery, persons),
  );
  const [inputValue, setInputValue] = useState(initialQuery.freeText ?? '');
  const [pendingParam, setPendingParam] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveFilters(buildFiltersFromQuery(initialQuery, persons));
    setInputValue(initialQuery.freeText ?? '');
    setPendingParam(null);
  }, [initialQuery, persons]);

  const personOptions = useMemo(() => {
    if (!persons || !pendingParam || !PERSON_SEARCH_PARAMS.has(pendingParam)) return [];
    const existingIds = new Set(
      activeFilters.filter((f) => f.param === pendingParam).map((f) => f.value),
    );
    const groupLabel = pendingParam === 'managedBy' ? MANAGED_BY_LABEL
      : pendingParam.charAt(0).toUpperCase() + pendingParam.slice(1);
    return persons
      .filter((p): p is Person & { id: string } => {
        const personId = p.id;
        return personId !== undefined && personId !== '' && !existingIds.has(personId);
      })
      .map((p) => ({
        param: pendingParam,
        value: p.id,
        label: `${p.firstName} ${p.lastName}`,
        group: groupLabel,
      }));
  }, [persons, activeFilters, pendingParam]);

  const availableOptions = useMemo(() => {
    const allOptions: SearchFilterOption[] = [
      ...buildStatusOptions(),
      ...buildInvolvementOptions(),
      ...buildTextInputPrompts(),
      ...buildPersonSearchPrompts(),
    ];
    const activeKeys = new Set(activeFilters.map((f) => `${f.param}:${f.value}`));
    const hasInvolvement = activeFilters.some((f) => f.param === 'involvement');
    const activeParamNames = new Set(activeFilters.map((f) => f.param));
    const multiPersonParams = new Set(['involved', 'managedBy']);
    return allOptions.filter(
      (o) =>
        !activeKeys.has(`${o.param}:${o.value}`) &&
        !(o.param === 'involvement' && hasInvolvement) &&
        !(o.isPrompt && activeParamNames.has(o.param) && !multiPersonParams.has(o.param)),
    );
  }, [activeFilters]);

  const handleSelectOption = useCallback(
    (_event: React.SyntheticEvent, option: SearchFilterOption | string | null) => {
      if (!option || typeof option === 'string') {
        return;
      }
      if (option.isPrompt) {
        setPendingParam(option.param);
        setInputValue('');
        return;
      }
      if (pendingParam) {
        setPendingParam(null);
      }
      let base = activeFilters;
      if (SINGLE_PERSON_PARAMS.has(option.param)) {
        base = base.filter((f) => f.param !== option.param);
      }
      const nextFilters = [...base, option];
      setActiveFilters(nextFilters);
      setInputValue('');
      onSearch(buildQueryFromFilters(nextFilters, ''));
    },
    [activeFilters, onSearch, pendingParam],
  );

  const handleRemoveFilter = useCallback((filterToRemove: SearchFilterOption) => {
    const nextFilters = activeFilters.filter(
      (f) => !(f.param === filterToRemove.param && f.value === filterToRemove.value),
    );
    setActiveFilters(nextFilters);
    onSearch(buildQueryFromFilters(nextFilters, inputValue));
  }, [activeFilters, inputValue, onSearch]);

  const handleCancelPending = useCallback(() => {
    setPendingParam(null);
    setInputValue('');
  }, []);

  const handleConfirmPending = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!pendingParam || !trimmed) {
      return;
    }
    const paramLabel = pendingParam.charAt(0).toUpperCase() + pendingParam.slice(1);
    const newFilter: SearchFilterOption = {
      param: pendingParam,
      value: trimmed,
      label: trimmed,
      group: paramLabel,
    };
    const nextFilters = [...activeFilters, newFilter];
    setActiveFilters(nextFilters);
    setInputValue('');
    setPendingParam(null);
    onSearch(buildQueryFromFilters(nextFilters, ''));
  }, [activeFilters, inputValue, onSearch, pendingParam]);

  const handleSubmit = useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();
      if (pendingParam && PERSON_SEARCH_PARAMS.has(pendingParam)) {
        return;
      }
      if (pendingParam) {
        handleConfirmPending();
        return;
      }
      onSearch(buildQueryFromFilters(activeFilters, inputValue));
    },
    [activeFilters, handleConfirmPending, inputValue, onSearch, pendingParam],
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
          options={getAutocompleteOptions(pendingParam, personOptions, availableOptions)}
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
              placeholder={getPlaceholder(pendingParam)}
              inputRef={inputRef}
              inputProps={{
                ...params.inputProps,
                'aria-label': 'Transaction search',
              }}
              InputProps={{
                ...params.InputProps,
                ...(pendingParam ? {
                  startAdornment: (
                    <Chip
                      label={pendingParam.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()}
                      size="small"
                      sx={{ mr: 0.5 }}
                      data-testid="pending-param-chip"
                    />
                  ),
                  endAdornment: (
                    <Stack
                      direction="row"
                      spacing={0}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label="Cancel filter"
                        onClick={handleCancelPending}
                        tabIndex={-1}
                      >
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      {pendingParam && !PERSON_SEARCH_PARAMS.has(pendingParam) && (
                      <IconButton
                        size="small"
                        aria-label="Confirm filter"
                        onClick={handleConfirmPending}
                        disabled={!inputValue.trim()}
                        tabIndex={-1}
                      >
                        <CheckIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      )}
                    </Stack>
                  ),
                } : {}),
              }}
              onKeyDown={(event) => {
                if (pendingParam) {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    handleCancelPending();
                  } else if (event.key === 'Backspace' && !inputValue) {
                    event.preventDefault();
                    handleCancelPending();
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  ...(pendingParam ? { paddingRight: '72px' } : {}),
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
