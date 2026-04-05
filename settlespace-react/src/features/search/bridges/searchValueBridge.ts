import {
  AppliedSearchFilter,
  GenericSearchValue,
  SearchSuggestionOption,
} from '../types';

type SearchBridgeOptionsSource = SearchSuggestionOption[] | (() => SearchSuggestionOption[]);

export interface SearchBridgeFreeTextConfig<TQuery> {
  get: (query: TQuery) => string | undefined;
  set: (draft: TQuery, freeText: string | undefined) => void;
}

interface SearchBridgeBaseFieldConfig<TQuery, TParam extends string> {
  param: TParam;
  group: string;
  queryKey?: Extract<keyof TQuery, string>;
}

export interface TextSingleFieldConfig<TQuery, TParam extends string>
  extends SearchBridgeBaseFieldConfig<TQuery, TParam> {
  kind: 'text-single';
  queryKey: Extract<keyof TQuery, string>;
}

interface LookupFieldConfig<TQuery, TParam extends string>
  extends SearchBridgeBaseFieldConfig<TQuery, TParam> {
  options: SearchBridgeOptionsSource;
  parse?: (value: string) => string | null | undefined;
}

export interface LookupSingleFieldConfig<TQuery, TParam extends string>
  extends LookupFieldConfig<TQuery, TParam> {
  kind: 'lookup-single';
  queryKey: Extract<keyof TQuery, string>;
}

export interface LookupMultiFieldConfig<TQuery, TParam extends string>
  extends LookupFieldConfig<TQuery, TParam> {
  kind: 'lookup-multi';
  queryKey: Extract<keyof TQuery, string>;
}

interface ResolvedFieldConfig<TQuery, TParam extends string, TContext>
  extends SearchBridgeBaseFieldConfig<TQuery, TParam> {
  resolveLabel: (value: string, context?: TContext) => string;
}

export interface ResolvedSingleFieldConfig<TQuery, TParam extends string, TContext>
  extends ResolvedFieldConfig<TQuery, TParam, TContext> {
  kind: 'resolved-single';
  queryKey: Extract<keyof TQuery, string>;
}

export interface ResolvedMultiFieldConfig<TQuery, TParam extends string, TContext>
  extends ResolvedFieldConfig<TQuery, TParam, TContext> {
  kind: 'resolved-multi';
  queryKey: Extract<keyof TQuery, string>;
}

export interface CustomSearchBridgeFieldConfig<TQuery, TParam extends string, TContext = undefined> {
  kind: 'custom';
  toFilters: (query: TQuery, context?: TContext) => AppliedSearchFilter<TParam>[];
  applyToQuery: (
    draft: TQuery,
    filters: AppliedSearchFilter<TParam>[],
    context?: TContext,
  ) => void;
}

export type SearchBridgeFieldConfig<TQuery, TParam extends string, TContext = undefined> =
  | TextSingleFieldConfig<TQuery, TParam>
  | LookupSingleFieldConfig<TQuery, TParam>
  | LookupMultiFieldConfig<TQuery, TParam>
  | ResolvedSingleFieldConfig<TQuery, TParam, TContext>
  | ResolvedMultiFieldConfig<TQuery, TParam, TContext>
  | CustomSearchBridgeFieldConfig<TQuery, TParam, TContext>;

export interface SearchBridgeConfig<TQuery, TParam extends string, TContext = undefined> {
  createEmptyQuery: () => TQuery;
  freeText?: SearchBridgeFreeTextConfig<TQuery>;
  fields: SearchBridgeFieldConfig<TQuery, TParam, TContext>[];
}

export interface SearchValueBridge<TQuery, TParam extends string, TContext = undefined> {
  toSearchValue: (query: TQuery, context?: TContext) => GenericSearchValue<TParam>;
  fromSearchValue: (value: GenericSearchValue<TParam>, context?: TContext) => TQuery;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function resolveBridgeOptions(options: SearchBridgeOptionsSource): SearchSuggestionOption[] {
  return typeof options === 'function' ? options() : options;
}

function readQueryValue<TQuery>(
  query: TQuery,
  queryKey: Extract<keyof TQuery, string>,
): unknown {
  return (query as Record<string, unknown>)[queryKey];
}

function readQueryStringValues<TQuery>(
  query: TQuery,
  queryKey: Extract<keyof TQuery, string>,
): string[] {
  const value = readQueryValue(query, queryKey);

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => isNonEmptyString(item));
}

function writeQueryValue<TQuery>(
  draft: TQuery,
  queryKey: Extract<keyof TQuery, string>,
  value: unknown,
): void {
  (draft as Record<string, unknown>)[queryKey] = value;
}

export function normalizeBridgeFreeText(freeText?: string): string | undefined {
  const trimmed = freeText?.trim();
  return trimmed || undefined;
}

export function getSingleFilterValue<TParam extends string = string>(
  filters: AppliedSearchFilter<TParam>[],
  param: TParam,
): string | undefined {
  return filters.find((filter) => filter.param === param)?.value;
}

export function getFilterValues<TParam extends string = string>(
  filters: AppliedSearchFilter<TParam>[],
  param: TParam,
): string[] {
  return filters
    .filter((filter) => filter.param === param)
    .map((filter) => filter.value);
}

export function buildTextSearchFilter<TParam extends string = string>(
  param: TParam,
  value: string,
  group: string,
): AppliedSearchFilter<TParam> {
  return { param, value, label: value, group };
}

export function buildLookupSearchFilter<TParam extends string = string>(
  param: TParam,
  value: string | null | undefined,
  options: SearchSuggestionOption[],
  fallbackGroup: string,
): AppliedSearchFilter<TParam> | null {
  if (!value) {
    return null;
  }

  const match = options.find((option) => option.value === value);
  if (!match) {
    return null;
  }

  return {
    param,
    value: match.value,
    label: match.label,
    group: match.group ?? fallbackGroup,
  };
}

export function buildLookupSearchFilters<TParam extends string = string>(
  param: TParam,
  values: readonly string[] | undefined,
  options: SearchSuggestionOption[],
  fallbackGroup: string,
): AppliedSearchFilter<TParam>[] {
  if (!values?.length) {
    return [];
  }

  return values.flatMap((value) => {
    const filter = buildLookupSearchFilter(param, value, options, fallbackGroup);
    return filter ? [filter] : [];
  });
}

export function buildResolvedSearchFilter<TParam extends string = string>(
  param: TParam,
  value: string | null | undefined,
  group: string,
  resolveLabel: (value: string) => string,
): AppliedSearchFilter<TParam> | null {
  if (!value) {
    return null;
  }

  return {
    param,
    value,
    label: resolveLabel(value),
    group,
  };
}

export function buildResolvedSearchFilters<TParam extends string = string>(
  param: TParam,
  values: readonly string[] | undefined,
  group: string,
  resolveLabel: (value: string) => string,
): AppliedSearchFilter<TParam>[] {
  if (!values?.length) {
    return [];
  }

  return values.map((value) => ({
    param,
    value,
    label: resolveLabel(value),
    group,
  }));
}

export function resolveEntityLabelById<TEntity extends { id?: string }>(
  entityId: string,
  entities: TEntity[] | undefined,
  getLabel: (entity: TEntity) => string | undefined,
): string {
  const entity = entities?.find((candidate) => candidate.id === entityId);
  const label = entity ? getLabel(entity)?.trim() : undefined;

  return label || entityId;
}

function buildFiltersForField<TQuery, TParam extends string, TContext>(
  field: SearchBridgeFieldConfig<TQuery, TParam, TContext>,
  query: TQuery,
  context?: TContext,
): AppliedSearchFilter<TParam>[] {
  switch (field.kind) {
    case 'text-single': {
      const value = readQueryValue(query, field.queryKey);
      return isNonEmptyString(value)
        ? [buildTextSearchFilter(field.param, value, field.group)]
        : [];
    }
    case 'lookup-single': {
      const value = readQueryValue(query, field.queryKey);
      const filter = buildLookupSearchFilter(
        field.param,
        isNonEmptyString(value) ? value : undefined,
        resolveBridgeOptions(field.options),
        field.group,
      );
      return filter ? [filter] : [];
    }
    case 'lookup-multi':
      return buildLookupSearchFilters(
        field.param,
        readQueryStringValues(query, field.queryKey),
        resolveBridgeOptions(field.options),
        field.group,
      );
    case 'resolved-single': {
      const value = readQueryValue(query, field.queryKey);
      const filter = buildResolvedSearchFilter(
        field.param,
        isNonEmptyString(value) ? value : undefined,
        field.group,
        (nextValue) => field.resolveLabel(nextValue, context),
      );
      return filter ? [filter] : [];
    }
    case 'resolved-multi':
      return buildResolvedSearchFilters(
        field.param,
        readQueryStringValues(query, field.queryKey),
        field.group,
        (nextValue) => field.resolveLabel(nextValue, context),
      );
    case 'custom':
      return field.toFilters(query, context);
  }
}

function applyFieldToQuery<TQuery, TParam extends string, TContext>(
  draft: TQuery,
  filters: AppliedSearchFilter<TParam>[],
  field: SearchBridgeFieldConfig<TQuery, TParam, TContext>,
  context?: TContext,
): void {
  switch (field.kind) {
    case 'text-single':
    case 'resolved-single': {
      const nextValue = getSingleFilterValue(filters, field.param);
      if (nextValue) {
        writeQueryValue(draft, field.queryKey, nextValue);
      }
      return;
    }
    case 'lookup-single': {
      const rawValue = getSingleFilterValue(filters, field.param);
      const nextValue = rawValue && field.parse ? field.parse(rawValue) : rawValue;
      if (nextValue) {
        writeQueryValue(draft, field.queryKey, nextValue);
      }
      return;
    }
    case 'lookup-multi': {
      const rawValues = getFilterValues(filters, field.param);
      const nextValues = field.parse
        ? rawValues
          .map((rawValue) => field.parse?.(rawValue))
          .filter((candidate): candidate is string => isNonEmptyString(candidate))
        : rawValues;
      if (nextValues.length > 0) {
        writeQueryValue(draft, field.queryKey, nextValues);
      }
      return;
    }
    case 'resolved-multi': {
      const nextValues = getFilterValues(filters, field.param);
      if (nextValues.length > 0) {
        writeQueryValue(draft, field.queryKey, nextValues);
      }
      return;
    }
    case 'custom':
      field.applyToQuery(draft, filters, context);
      return;
  }
}

export function createSearchValueBridge<TQuery, TParam extends string, TContext = undefined>(
  config: SearchBridgeConfig<TQuery, TParam, TContext>,
): SearchValueBridge<TQuery, TParam, TContext> {
  return {
    toSearchValue: (query, context) => {
      const filters = config.fields.flatMap((field) => buildFiltersForField(field, query, context));
      const freeText = config.freeText
        ? normalizeBridgeFreeText(config.freeText.get(query))
        : undefined;

      return {
        ...(freeText ? { freeText } : {}),
        filters,
      };
    },
    fromSearchValue: (value, context) => {
      const draft = config.createEmptyQuery();

      if (config.freeText) {
        config.freeText.set(draft, normalizeBridgeFreeText(value.freeText));
      }

      for (const field of config.fields) {
        applyFieldToQuery(draft, value.filters, field, context);
      }

      return draft;
    },
  };
}
