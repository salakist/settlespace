import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { SEARCH_PLACEHOLDERS } from '../constants';
import {
  AppliedSearchFilter,
  AsyncSearchParameterConfig,
  GenericSearchValue,
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
} from '../types';

const SEARCH_DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY'];

dayjs.extend(customParseFormat);

export interface AutocompleteSearchOption<TParam extends string = string>
  extends AppliedSearchFilter<TParam> {
  isPrompt?: boolean;
  showGroupLabel?: boolean;
}

export function normalizeSearchValue<TParam extends string = string>(
  filters: AppliedSearchFilter<TParam>[],
  freeText: string,
): GenericSearchValue<TParam> {
  const trimmed = freeText.trim();
  return {
    filters,
    ...(trimmed ? { freeText: trimmed } : {}),
  };
}

export function getSelectionMode<TParam extends string = string>(
  parameter?: SearchParameterConfig<TParam>,
): SearchSelectionMode {
  return parameter?.selectionMode ?? SearchSelectionMode.Single;
}

export function isAsyncSearchParameter<TParam extends string = string>(
  parameter: SearchParameterConfig<TParam> | null,
): parameter is AsyncSearchParameterConfig<TParam> {
  return parameter?.kind === SearchParameterKind.AsyncSuggestions;
}

export function isDateInputSearchParameter<TParam extends string = string>(
  parameter: SearchParameterConfig<TParam> | null,
): boolean {
  return parameter?.kind === SearchParameterKind.DateInput;
}

export function normalizeDateSearchValue(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = dayjs(trimmed, SEARCH_DATE_FORMATS, true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined;
}

export function formatDateSearchLabel(value: string): string {
  const parsed = dayjs(value, SEARCH_DATE_FORMATS, true);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : value;
}

export function isInputSearchParameter<TParam extends string = string>(
  parameter: SearchParameterConfig<TParam> | null,
): boolean {
  return parameter?.kind === SearchParameterKind.TextInput
    || parameter?.kind === SearchParameterKind.AsyncSuggestions
    || parameter?.kind === SearchParameterKind.DateInput;
}

export function buildAvailableOptions<TParam extends string = string>(
  parameters: SearchParameterConfig<TParam>[],
  activeFilters: AppliedSearchFilter<TParam>[],
): AutocompleteSearchOption<TParam>[] {
  const activeKeys = new Set(activeFilters.map((filter) => `${filter.param}:${filter.value}`));
  const activeParams = new Set(activeFilters.map((filter) => filter.param));

  const blockedParams = new Set<TParam>();
  activeFilters.forEach((filter) => {
    const config = parameters.find((p) => p.param === filter.param);
    config?.conflictsWith?.forEach((blocked) => blockedParams.add(blocked));
  });

  return parameters.flatMap((parameter) => {
    if (blockedParams.has(parameter.param)) {
      return [];
    }

    const showGroupLabel = parameter.showGroupLabel ?? true;

    if (parameter.kind !== SearchParameterKind.Fixed) {
      const showPrompt = getSelectionMode(parameter) === SearchSelectionMode.Multiple
        || !activeParams.has(parameter.param);
      return showPrompt
        ? [{
          param: parameter.param,
          value: '',
          label: parameter.label,
          group: parameter.label,
          isPrompt: true,
          showGroupLabel: false,
        }]
        : [];
    }

    if (getSelectionMode(parameter) === SearchSelectionMode.Single && activeParams.has(parameter.param)) {
      return [];
    }

    return parameter.options
      .filter((option) => !activeKeys.has(`${parameter.param}:${option.value}`))
      .map((option) => ({
        param: parameter.param,
        value: option.value,
        label: option.label,
        group: option.group ?? parameter.label,
        showGroupLabel,
      }));
  });
}

export function buildAsyncAutocompleteOptions<TParam extends string = string>(
  parameter: AsyncSearchParameterConfig<TParam>,
  activeFilters: AppliedSearchFilter<TParam>[],
  suggestions: { value: string; label: string; group?: string }[],
): AutocompleteSearchOption<TParam>[] {
  const existingValues = new Set(
    activeFilters
      .filter((filter) => filter.param === parameter.param)
      .map((filter) => filter.value),
  );

  return suggestions
    .filter((option) => option.value && !existingValues.has(option.value))
    .map((option) => ({
      param: parameter.param,
      value: option.value,
      label: option.label,
      group: option.group ?? parameter.label,
      showGroupLabel: false,
    }));
}

export function getAutocompleteGroupLabel<TParam extends string = string>(
  option: AutocompleteSearchOption<TParam>,
): string {
  return option.showGroupLabel ? option.group : '';
}

export function applyFilterSelection<TParam extends string = string>(
  activeFilters: AppliedSearchFilter<TParam>[],
  nextFilter: AppliedSearchFilter<TParam>,
  selectionMode: SearchSelectionMode,
  parameters: SearchParameterConfig<TParam>[] = [],
): AppliedSearchFilter<TParam>[] {
  const normalizedFilter: AppliedSearchFilter<TParam> = {
    param: nextFilter.param,
    value: nextFilter.value,
    label: nextFilter.label,
    group: nextFilter.group,
  };

  const incomingConfig = parameters.find((p) => p.param === normalizedFilter.param);
  const conflictsWithIncoming = new Set(incomingConfig?.conflictsWith ?? []);

  const filtersWithoutConflicts = activeFilters.filter((filter) => {
    if (conflictsWithIncoming.has(filter.param)) {
      return false;
    }
    const existingConfig = parameters.find((p) => p.param === filter.param);
    return !existingConfig?.conflictsWith?.includes(normalizedFilter.param);
  });

  return selectionMode === SearchSelectionMode.Single
    ? [
      ...filtersWithoutConflicts.filter((filter) => filter.param !== normalizedFilter.param),
      normalizedFilter,
    ]
    : [...filtersWithoutConflicts, normalizedFilter];
}

export function getAutocompleteOptions<TParam extends string = string>(
  pendingParameter: SearchParameterConfig<TParam> | null,
  asyncOptions: AutocompleteSearchOption<TParam>[],
  availableOptions: AutocompleteSearchOption<TParam>[],
): AutocompleteSearchOption<TParam>[] {
  if (isAsyncSearchParameter(pendingParameter)) {
    return asyncOptions;
  }

  if (isInputSearchParameter(pendingParameter)) {
    return [];
  }

  return availableOptions;
}

export function getInputPlaceholder<TParam extends string = string>(
  pendingParameter: SearchParameterConfig<TParam> | null,
  freeTextPlaceholder: string,
): string {
  if (pendingParameter?.kind === SearchParameterKind.TextInput) {
    return pendingParameter.placeholder ?? SEARCH_PLACEHOLDERS.TEXT_INPUT;
  }

  if (pendingParameter?.kind === SearchParameterKind.AsyncSuggestions) {
    return pendingParameter.placeholder ?? SEARCH_PLACEHOLDERS.ASYNC_SUGGESTIONS;
  }

  if (pendingParameter?.kind === SearchParameterKind.DateInput) {
    return pendingParameter.placeholder ?? SEARCH_PLACEHOLDERS.DATE_INPUT;
  }

  return freeTextPlaceholder;
}

export function filterAutocompleteOptions<TParam extends string = string>(
  options: AutocompleteSearchOption<TParam>[],
  searchTerm: string,
): AutocompleteSearchOption<TParam>[] {
  if (!searchTerm) {
    return [];
  }

  const normalizedSearch = searchTerm.toLowerCase();
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalizedSearch)
      || option.group.toLowerCase().includes(normalizedSearch),
  );
}
