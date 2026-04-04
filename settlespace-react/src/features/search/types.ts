import React from 'react';
import {
  SEARCH_PARAMETER_KINDS,
  SEARCH_SELECTION_MODES,
} from './constants';

export type SearchSelectionMode =
  typeof SEARCH_SELECTION_MODES[keyof typeof SEARCH_SELECTION_MODES];
export type SearchParameterKind =
  typeof SEARCH_PARAMETER_KINDS[keyof typeof SEARCH_PARAMETER_KINDS];

export interface AppliedSearchFilter<TParam extends string = string> {
  param: TParam;
  value: string;
  label: string;
  group: string;
}

export interface SearchSuggestionOption {
  value: string;
  label: string;
  group?: string;
}

export interface BaseSearchParameterConfig<TParam extends string = string> {
  param: TParam;
  label: string;
  selectionMode?: SearchSelectionMode;
  placeholder?: string;
  showGroupLabel?: boolean;
}

export interface FixedSearchParameterConfig<TParam extends string = string>
  extends BaseSearchParameterConfig<TParam> {
  kind: typeof SEARCH_PARAMETER_KINDS.FIXED;
  options: SearchSuggestionOption[];
}

export interface TextInputSearchParameterConfig<TParam extends string = string>
  extends BaseSearchParameterConfig<TParam> {
  kind: typeof SEARCH_PARAMETER_KINDS.TEXT_INPUT;
}

export interface AsyncSearchParameterConfig<TParam extends string = string>
  extends BaseSearchParameterConfig<TParam> {
  kind: typeof SEARCH_PARAMETER_KINDS.ASYNC_SUGGESTIONS;
  minChars?: number;
  debounceMs?: number;
  getSuggestions: (input: string) => Promise<SearchSuggestionOption[]>;
}

export type SearchParameterConfig<TParam extends string = string> =
  | FixedSearchParameterConfig<TParam>
  | TextInputSearchParameterConfig<TParam>
  | AsyncSearchParameterConfig<TParam>;

export interface GenericSearchValue<TParam extends string = string> {
  freeText?: string;
  filters: AppliedSearchFilter<TParam>[];
}

export interface GenericSearchBarProps<TParam extends string = string> {
  onSearch: (value: GenericSearchValue<TParam>) => void;
  initialValue?: GenericSearchValue<TParam>;
  action?: React.ReactNode;
  parameters?: SearchParameterConfig<TParam>[];
  ariaLabel?: string;
  freeTextPlaceholder?: string;
  dataTestId?: string;
}
