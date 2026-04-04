import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAsyncSuggestions } from './useAsyncSuggestions';
import {
  AppliedSearchFilter,
  GenericSearchValue,
  SearchParameterConfig,
} from '../types';
import {
  applyFilterSelection,
  AutocompleteSearchOption,
  buildAvailableOptions,
  getAutocompleteOptions,
  getInputPlaceholder,
  getSelectionMode,
  isAsyncSearchParameter,
  normalizeSearchValue,
} from '../utils/searchHelpers';

interface UseGenericSearchControllerArgs<TParam extends string> {
  onSearch: (value: GenericSearchValue<TParam>) => void;
  initialValue?: GenericSearchValue<TParam>;
  parameters?: SearchParameterConfig<TParam>[];
  freeTextPlaceholder: string;
}

function createEmptyValue<TParam extends string>(): GenericSearchValue<TParam> {
  return { filters: [] };
}

export function useGenericSearchController<TParam extends string = string>({
  onSearch,
  initialValue,
  parameters = [],
  freeTextPlaceholder,
}: UseGenericSearchControllerArgs<TParam>) {
  const normalizedInitialValue = initialValue ?? createEmptyValue<TParam>();
  const [activeFilters, setActiveFilters] = useState<AppliedSearchFilter<TParam>[]>(
    normalizedInitialValue.filters ?? [],
  );
  const [inputValue, setInputValue] = useState(normalizedInitialValue.freeText ?? '');
  const [pendingParam, setPendingParam] = useState<TParam | null>(null);

  useEffect(() => {
    const nextInitialValue = initialValue ?? createEmptyValue<TParam>();
    setActiveFilters(nextInitialValue.filters ?? []);
    setInputValue(nextInitialValue.freeText ?? '');
    setPendingParam(null);
  }, [initialValue]);

  const pendingParameter = useMemo(
    () => parameters.find((parameter) => parameter.param === pendingParam) ?? null,
    [parameters, pendingParam],
  );

  const { asyncOptions, loadingSuggestions } = useAsyncSuggestions({
    activeFilters,
    inputValue,
    pendingParameter: isAsyncSearchParameter(pendingParameter) ? pendingParameter : null,
  });

  const availableOptions = useMemo(
    () => buildAvailableOptions(parameters, activeFilters),
    [activeFilters, parameters],
  );

  const autocompleteOptions = useMemo(
    () => getAutocompleteOptions(pendingParameter, asyncOptions, availableOptions),
    [asyncOptions, availableOptions, pendingParameter],
  );

  const placeholder = useMemo(
    () => getInputPlaceholder(pendingParameter, freeTextPlaceholder),
    [freeTextPlaceholder, pendingParameter],
  );

  const emitSearch = useCallback((filters: AppliedSearchFilter<TParam>[], freeText: string) => {
    onSearch(normalizeSearchValue(filters, freeText));
  }, [onSearch]);

  const handleCancelPending = useCallback(() => {
    setPendingParam(null);
    setInputValue('');
  }, []);

  const handleSelectOption = useCallback(
    (_event: React.SyntheticEvent, option: AutocompleteSearchOption<TParam> | string | null) => {
      if (!option || typeof option === 'string') {
        return;
      }

      if (option.isPrompt) {
        setPendingParam(option.param);
        setInputValue('');
        return;
      }

      const parameter = parameters.find((candidate) => candidate.param === option.param);
      const nextFilters = applyFilterSelection(activeFilters, option, getSelectionMode(parameter));

      setActiveFilters(nextFilters);
      setPendingParam(null);
      setInputValue('');
      emitSearch(nextFilters, '');
    },
    [activeFilters, emitSearch, parameters],
  );

  const handleRemoveFilter = useCallback((filterToRemove: AppliedSearchFilter<TParam>) => {
    const nextFilters = activeFilters.filter(
      (filter) => !(filter.param === filterToRemove.param && filter.value === filterToRemove.value),
    );

    setActiveFilters(nextFilters);
    emitSearch(nextFilters, inputValue);
  }, [activeFilters, emitSearch, inputValue]);

  const handleConfirmPending = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!pendingParameter || !trimmed) {
      return;
    }

    const nextFilter: AppliedSearchFilter<TParam> = {
      param: pendingParameter.param,
      value: trimmed,
      label: trimmed,
      group: pendingParameter.label,
    };
    const nextFilters = applyFilterSelection(
      activeFilters,
      nextFilter,
      getSelectionMode(pendingParameter),
    );

    setActiveFilters(nextFilters);
    setInputValue('');
    setPendingParam(null);
    emitSearch(nextFilters, '');
  }, [activeFilters, emitSearch, inputValue, pendingParameter]);

  const handleSubmit = useCallback((event: React.SyntheticEvent) => {
    event.preventDefault();

    if (isAsyncSearchParameter(pendingParameter)) {
      return;
    }

    if (pendingParameter) {
      handleConfirmPending();
      return;
    }

    emitSearch(activeFilters, inputValue);
  }, [activeFilters, emitSearch, handleConfirmPending, inputValue, pendingParameter]);

  return {
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
  };
}
