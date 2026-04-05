import { SEARCH_PLACEHOLDERS } from '../constants';
import {
  AppliedSearchFilter,
  AsyncSearchParameterConfig,
  GenericSearchValue,
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
} from '../types';

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

export function isInputSearchParameter<TParam extends string = string>(
  parameter: SearchParameterConfig<TParam> | null,
): boolean {
  return parameter?.kind === SearchParameterKind.TextInput
    || parameter?.kind === SearchParameterKind.AsyncSuggestions;
}

export function buildAvailableOptions<TParam extends string = string>(
  parameters: SearchParameterConfig<TParam>[],
  activeFilters: AppliedSearchFilter<TParam>[],
): AutocompleteSearchOption<TParam>[] {
  const activeKeys = new Set(activeFilters.map((filter) => `${filter.param}:${filter.value}`));
  const activeParams = new Set(activeFilters.map((filter) => filter.param));

  return parameters.flatMap((parameter) => {
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
): AppliedSearchFilter<TParam>[] {
  const normalizedFilter: AppliedSearchFilter<TParam> = {
    param: nextFilter.param,
    value: nextFilter.value,
    label: nextFilter.label,
    group: nextFilter.group,
  };

  if (selectionMode !== SearchSelectionMode.Single) {
    return [...activeFilters, normalizedFilter];
  }

  return [
    ...activeFilters.filter((filter) => filter.param !== normalizedFilter.param),
    normalizedFilter,
  ];
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
