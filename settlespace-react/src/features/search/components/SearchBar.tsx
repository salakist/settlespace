import React, { useRef, useState } from 'react';
import { Autocomplete, IconButton, Popover, Stack, TextField } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ActiveFilterChips from './ActiveFilterChips';
import {
  PendingParameterActions,
  PendingParameterChip,
} from './PendingParameterAdornment';
import { SEARCH_BAR_TEXT, SEARCH_LAYOUT, SEARCH_PLACEHOLDERS } from '../constants';
import { useGenericSearchController } from '../hooks/useGenericSearchController';
import { SearchBarProps, SearchParameterKind } from '../types';
import {
  filterAutocompleteOptions,
  formatDateSearchLabel,
  getAutocompleteGroupLabel,
  isAsyncSearchParameter,
  normalizeDateSearchValue,
} from '../utils/searchHelpers';

function parseCalendarValue(value: string) {
  const normalizedValue = normalizeDateSearchValue(value);
  return normalizedValue ? dayjs(normalizedValue, 'YYYY-MM-DD', true) : null;
}

const CALENDAR_SURFACE = 'background.paper';
const CALENDAR_TEXT = 'text.primary';
const SCROLLBAR_TRACK = 'background.default';
const SCROLLBAR_THUMB = 'grey.700';
const SCROLLBAR_THUMB_HOVER = 'grey.600';
const THIN_SCROLLBAR = 'thin';

const sharedScrollbarSx = {
  scrollbarWidth: THIN_SCROLLBAR,
  scrollbarColor: (theme: any) => `${theme.palette.grey[700]} ${theme.palette.background.default}`,
  '&::-webkit-scrollbar': {
    width: 10,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: SCROLLBAR_TRACK,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: SCROLLBAR_THUMB,
    borderRadius: 999,
    border: '2px solid',
    borderColor: CALENDAR_SURFACE,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: SCROLLBAR_THUMB_HOVER,
  },
};

const SearchBar = <TParam extends string = string,>({
  onSearch,
  initialValue,
  action,
  parameters = [],
  ariaLabel = SEARCH_BAR_TEXT.DEFAULT_ARIA_LABEL,
  freeTextPlaceholder = SEARCH_PLACEHOLDERS.DEFAULT,
  dataTestId,
}: SearchBarProps<TParam>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
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

    if (shouldOpen) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  };

  const isTargetInsideSearchBar = (target: EventTarget | null) => (
    target instanceof Node && Boolean(containerRef.current?.contains(target))
  );

  const handleAutocompleteClose = (
    event: React.SyntheticEvent,
    reason: string,
  ) => {
    if (reason === 'toggleInput' && isTargetInsideSearchBar(event.target)) {
      return;
    }

    if (reason === 'blur') {
      const nextFocusTarget = 'relatedTarget' in event
        ? (event.relatedTarget as EventTarget | null)
        : null;

      if (
        isTargetInsideSearchBar(nextFocusTarget)
        || isTargetInsideSearchBar(document.activeElement)
      ) {
        return;
      }
    }

    setIsAutocompleteOpen(false);
    setShowAllOptions(false);
  };

  const handleInputFocus = () => {
    if (
      pendingParameter
      && isAsyncSearchParameter(pendingParameter)
      && Boolean(inputValue.trim())
    ) {
      setIsAutocompleteOpen(true);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      pendingParameter
      && isAsyncSearchParameter(pendingParameter)
      && event.key === 'Enter'
    ) {
      const inputElement = event.target as HTMLInputElement | null;
      const hasHighlightedOption = Boolean(
        inputElement?.getAttribute('aria-activedescendant'),
      );

      if (!hasHighlightedOption) {
        event.preventDefault();
        event.stopPropagation();
        (
          event as React.KeyboardEvent<HTMLInputElement> & {
            defaultMuiPrevented?: boolean;
          }
        ).defaultMuiPrevented = true;
        setIsAutocompleteOpen(true);
        return;
      }
    }

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
          ref={containerRef}
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
          {pendingParameter?.kind === SearchParameterKind.DateInput ? (
            <>
            <TextField
              value={inputValue}
              onChange={(event) => {
                setInputValue(event.target.value);
                setShowAllOptions(false);
                setIsAutocompleteOpen(false);
              }}
              size="small"
              placeholder={placeholder}
              inputRef={inputRef}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              slotProps={{
                htmlInput: {
                  'aria-label': ariaLabel,
                },
                input: {
                  startAdornment: <PendingParameterChip pendingParameter={pendingParameter} />,
                  endAdornment: (
                    <PendingParameterActions
                      pendingParameter={pendingParameter}
                      inputValue={inputValue}
                      onCancel={handleCancelPending}
                      onConfirm={handleConfirmPending}
                      showCalendarButton
                      onOpenCalendar={() => setIsDatePickerOpen(true)}
                    />
                  ),
                },
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  ...(hasParameters
                    ? {
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }
                    : {}),
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  paddingRight: SEARCH_LAYOUT.DATE_INPUT_PADDING_RIGHT,
                },
              }}
            />
            <Popover
              open={isDatePickerOpen}
              anchorEl={inputRef.current}
              onClose={() => setIsDatePickerOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    bgcolor: CALENDAR_SURFACE,
                    color: CALENDAR_TEXT,
                    '& .MuiPickersCalendarHeader-root, & .MuiDayCalendar-header': {
                      color: CALENDAR_TEXT,
                    },
                    '& .MuiPickersFadeTransitionGroup-root, & .MuiDayCalendar-weekContainer': {
                      color: CALENDAR_TEXT,
                    },
                    '& .MuiPickersYear-yearButton.Mui-selected, & .MuiPickersDay-root.Mui-selected': {
                      bgcolor: (theme) => theme.palette.primary.main,
                    },
                    '& .MuiPickersLayout-contentWrapper': {
                      ...sharedScrollbarSx,
                    },
                  },
                },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                <DateCalendar
                  value={parseCalendarValue(inputValue)}
                  onChange={(nextValue) => {
                    if (!nextValue?.isValid()) {
                      return;
                    }

                    setInputValue(formatDateSearchLabel(nextValue.format('YYYY-MM-DD')));
                    setIsDatePickerOpen(false);
                    inputRef.current?.focus();
                  }}
                />
              </LocalizationProvider>
            </Popover>
            </>
          ) : (
            <Autocomplete
              freeSolo
              open={isAutocompleteOpen && autocompleteOptions.length > 0}
              onClose={handleAutocompleteClose}
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
              slotProps={{
                listbox: {
                  sx: sharedScrollbarSx,
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  placeholder={placeholder}
                  inputRef={inputRef}
                  onFocus={handleInputFocus}
                  slotProps={{
                    htmlInput: {
                      ...params.inputProps,
                      'aria-label': ariaLabel,
                    },
                    input: {
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
                    },
                  }}
                  onKeyDown={handleInputKeyDown}
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
          )}
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

export default SearchBar;