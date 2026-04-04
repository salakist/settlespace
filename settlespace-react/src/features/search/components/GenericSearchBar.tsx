import React, { useRef } from 'react';
import { Autocomplete, IconButton, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ActiveFilterChips from './ActiveFilterChips';
import {
  PendingParameterActions,
  PendingParameterChip,
} from './PendingParameterAdornment';
import { SEARCH_PLACEHOLDERS } from '../constants';
import { useGenericSearchController } from '../hooks/useGenericSearchController';
import { GenericSearchBarProps } from '../types';
import {
  filterAutocompleteOptions,
  getAutocompleteGroupLabel,
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
            groupBy={(option) => (typeof option === 'string' ? '' : getAutocompleteGroupLabel(option))}
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
                    startAdornment: <PendingParameterChip pendingParameter={pendingParameter} />,
                    endAdornment: (
                      <PendingParameterActions
                        pendingParameter={pendingParameter}
                        inputValue={inputValue}
                        onCancel={handleCancelPending}
                        onConfirm={handleConfirmPending}
                      />
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
      <ActiveFilterChips filters={activeFilters} onRemove={handleRemoveFilter} />
    </Stack>
  );
};

export default GenericSearchBar;