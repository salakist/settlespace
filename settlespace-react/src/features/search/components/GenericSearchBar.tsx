import React, { useRef } from 'react';
import { Autocomplete, Chip, IconButton, Stack, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { SEARCH_PLACEHOLDERS } from '../constants';
import { useGenericSearchController } from '../hooks/useGenericSearchController';
import { GenericSearchBarProps } from '../types';
import {
  filterAutocompleteOptions,
  isAsyncSearchParameter,
} from '../utils/searchHelpers';

const INPUT_PADDING_RIGHT = '72px';

const GenericSearchBar = <TParam extends string = string,>({
  onSearch,
  initialValue,
  action,
  parameters = [],
  ariaLabel = 'Search',
  freeTextPlaceholder = SEARCH_PLACEHOLDERS.DEFAULT,
  dataTestId,
}: GenericSearchBarProps<TParam>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    activeFilters,
    autocompleteOptions,
    handleCancelPending,
    handleConfirmPending,
    handleRemoveFilter,
    handleSelectOption,
    handleSubmit,
    inputValue,
    loadingSuggestions,
    pendingParameter,
    placeholder,
    setInputValue,
  } = useGenericSearchController({
    onSearch,
    initialValue,
    parameters,
    freeTextPlaceholder,
  });

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
            options={autocompleteOptions}
            loading={loadingSuggestions}
            loadingText="Loading..."
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            groupBy={(option) => (typeof option === 'string' ? '' : option.group)}
            inputValue={inputValue}
            onInputChange={(_event, newValue, reason) => {
              if (reason !== 'reset') {
                setInputValue(newValue);
              }
            }}
            onChange={handleSelectOption}
            value={null}
            filterOptions={(options, state) => filterAutocompleteOptions(options, state.inputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder={placeholder}
                inputRef={inputRef}
                inputProps={{
                  ...params.inputProps,
                  'aria-label': ariaLabel,
                }}
                InputProps={{
                  ...params.InputProps,
                  ...(pendingParameter ? {
                    startAdornment: (
                      <Chip
                        label={pendingParameter.label}
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
                        {!isAsyncSearchParameter(pendingParameter) && (
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
                  if (!pendingParameter) {
                    return;
                  }

                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    handleCancelPending();
                  } else if (event.key === 'Backspace' && !inputValue) {
                    event.preventDefault();
                    handleCancelPending();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    ...(pendingParameter ? { paddingRight: INPUT_PADDING_RIGHT } : {}),
                  },
                }}
              />
            )}
            sx={{ flex: 1 }}
            clearOnBlur={false}
            selectOnFocus={false}
            handleHomeEndKeys={false}
            data-testid={dataTestId}
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

export default GenericSearchBar;