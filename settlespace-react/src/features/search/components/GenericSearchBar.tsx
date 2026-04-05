import React, { useRef, useState } from 'react';
import { Autocomplete, IconButton, Stack, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ActiveFilterChips from './ActiveFilterChips';
import {
  PendingParameterActions,
  PendingParameterChip,
} from './PendingParameterAdornment';
import { SEARCH_BAR_TEXT, SEARCH_LAYOUT, SEARCH_PLACEHOLDERS } from '../constants';
import { useGenericSearchController } from '../hooks/useGenericSearchController';
import { GenericSearchBarProps } from '../types';
import {
  filterAutocompleteOptions,
  getAutocompleteGroupLabel,
} from '../utils/searchHelpers';

const GenericSearchBar = <TParam extends string = string,>({
  onSearch,
  initialValue,
  action,
  parameters = [],
  ariaLabel = SEARCH_BAR_TEXT.DEFAULT_ARIA_LABEL,
  freeTextPlaceholder = SEARCH_PLACEHOLDERS.DEFAULT,
  dataTestId,
}: GenericSearchBarProps<TParam>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
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
  const hasParameters = parameters.length > 0;

  const handleToggleFilters = () => {
    if (!hasParameters || pendingParameter) {
      return;
    }

    const shouldOpen = !showAllOptions;

    setShowAllOptions(shouldOpen);
    setIsAutocompleteOpen(shouldOpen);

    if (!shouldOpen) {
      inputRef.current?.blur();
    }
  };

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
          {hasParameters && (
            <IconButton
              type="button"
              aria-label={SEARCH_BAR_TEXT.FILTER_BUTTON_ARIA_LABEL}
              onClick={handleToggleFilters}
              disabled={Boolean(pendingParameter)}
              sx={{
                borderRadius: 0,
                borderTopLeftRadius: (theme) => `${theme.shape.borderRadius}px`,
                borderBottomLeftRadius: (theme) => `${theme.shape.borderRadius}px`,
                height: 40,
                width: 40,
                border: 1,
                borderRight: 0,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <FilterListIcon fontSize="small" />
            </IconButton>
          )}
          <Autocomplete
            freeSolo
            open={isAutocompleteOpen && autocompleteOptions.length > 0}
            onClose={() => {
              setIsAutocompleteOpen(false);
              setShowAllOptions(false);
            }}
            options={autocompleteOptions}
            loading={loadingSuggestions}
            loadingText={SEARCH_BAR_TEXT.LOADING}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            groupBy={(option) => (typeof option === 'string' ? '' : getAutocompleteGroupLabel(option))}
            inputValue={inputValue}
            onInputChange={(_event, newValue, reason) => {
              if (reason !== 'reset') {
                setInputValue(newValue);
                setShowAllOptions(false);
                setIsAutocompleteOpen(Boolean(newValue));
              }
            }}
            onChange={handleSelectOption}
            value={null}
            filterOptions={(options, state) => (
              showAllOptions && !state.inputValue
                ? options
                : filterAutocompleteOptions(options, state.inputValue)
            )}
            ListboxProps={{
              sx: {
                scrollbarWidth: 'thin',
                scrollbarColor: (theme) => `${theme.palette.grey[700]} ${theme.palette.background.default}`,
                '&::-webkit-scrollbar': {
                  width: 10,
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'background.default',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'grey.700',
                  borderRadius: 999,
                  border: '2px solid',
                  borderColor: 'background.paper',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: 'grey.600',
                },
              },
            }}
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
                    ...(hasParameters
                      ? {
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }
                      : {}),
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    ...(pendingParameter
                      ? { paddingRight: SEARCH_LAYOUT.INPUT_PADDING_RIGHT }
                      : {}),
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
            aria-label={SEARCH_BAR_TEXT.SEARCH_BUTTON_ARIA_LABEL}
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