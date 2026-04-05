import {
  AppliedSearchFilter,
  SearchSuggestionOption,
} from '../types';

export function normalizeBridgeFreeText(freeText?: string): string | undefined {
  const trimmed = freeText?.trim();
  return trimmed ? trimmed : undefined;
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
