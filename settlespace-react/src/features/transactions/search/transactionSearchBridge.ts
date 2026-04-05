import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import { Person } from '../../../shared/types';
import { AppliedSearchFilter, GenericSearchValue } from '../../search/types';
import {
  buildInvolvementOptions,
  buildStatusOptions,
  MANAGED_BY_LABEL,
  TRANSACTION_SEARCH_PARAMS,
  TransactionSearchParam,
} from './transactionSearchConfig';

export const EMPTY_TRANSACTION_SEARCH_QUERY: TransactionSearchQuery = {};

function buildTextFilter(
  param: TransactionSearchParam,
  value: string,
  group: string,
): AppliedSearchFilter<TransactionSearchParam> {
  return { param, value, label: value, group };
}

export function resolvePersonName(personId: string, persons?: Person[]): string {
  const person = persons?.find((candidate) => candidate.id === personId);
  return person ? person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim() : personId;
}

export function buildQueryFromFilters(
  filters: AppliedSearchFilter<TransactionSearchParam>[],
  freeText?: string,
): TransactionSearchQuery {
  const query: TransactionSearchQuery = {};

  const trimmed = freeText?.trim();
  if (trimmed) {
    query.freeText = trimmed;
  }

  const statuses = filters
    .filter((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.STATUS)
    .map((filter) => filter.value);
  if (statuses.length > 0) {
    query.status = statuses;
  }

  const involvement = filters.find(
    (filter) => filter.param === TRANSACTION_SEARCH_PARAMS.INVOLVEMENT,
  );
  if (involvement) {
    query.involvement = involvement.value;
  }

  const category = filters.find((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.CATEGORY);
  if (category) {
    query.category = category.value;
  }

  const description = filters.find(
    (filter) => filter.param === TRANSACTION_SEARCH_PARAMS.DESCRIPTION,
  );
  if (description) {
    query.description = description.value;
  }

  const involvedIds = filters
    .filter((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.INVOLVED)
    .map((filter) => filter.value);
  if (involvedIds.length > 0) {
    query.involved = involvedIds;
  }

  const managedByIds = filters
    .filter((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.MANAGED_BY)
    .map((filter) => filter.value);
  if (managedByIds.length > 0) {
    query.managedBy = managedByIds;
  }

  const payer = filters.find((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.PAYER);
  if (payer) {
    query.payer = payer.value;
  }

  const payee = filters.find((filter) => filter.param === TRANSACTION_SEARCH_PARAMS.PAYEE);
  if (payee) {
    query.payee = payee.value;
  }

  return query;
}

export function buildFiltersFromQuery(
  query: TransactionSearchQuery,
  persons?: Person[],
): AppliedSearchFilter<TransactionSearchParam>[] {
  const filters: AppliedSearchFilter<TransactionSearchParam>[] = [];

  if (query.status) {
    const allStatusOptions = buildStatusOptions();
    filters.push(
      ...query.status.flatMap((status) => allStatusOptions
        .filter((option) => option.value === status)
        .map((option) => ({
          param: TRANSACTION_SEARCH_PARAMS.STATUS,
          value: option.value,
          label: option.label,
          group: option.group ?? 'Status',
        }))),
    );
  }

  if (query.involvement) {
    const match = buildInvolvementOptions().find((option) => option.value === query.involvement);
    if (match) {
      filters.push({
        param: TRANSACTION_SEARCH_PARAMS.INVOLVEMENT,
        value: match.value,
        label: match.label,
        group: match.group ?? 'Involvement',
      });
    }
  }

  if (query.category) {
    filters.push(buildTextFilter(TRANSACTION_SEARCH_PARAMS.CATEGORY, query.category, 'Category'));
  }

  if (query.description) {
    filters.push(
      buildTextFilter(TRANSACTION_SEARCH_PARAMS.DESCRIPTION, query.description, 'Description'),
    );
  }

  if (query.involved) {
    for (const personId of query.involved) {
      filters.push({
        param: TRANSACTION_SEARCH_PARAMS.INVOLVED,
        value: personId,
        label: resolvePersonName(personId, persons),
        group: 'Involved',
      });
    }
  }

  if (query.managedBy) {
    for (const personId of query.managedBy) {
      filters.push({
        param: TRANSACTION_SEARCH_PARAMS.MANAGED_BY,
        value: personId,
        label: resolvePersonName(personId, persons),
        group: MANAGED_BY_LABEL,
      });
    }
  }

  if (query.payer) {
    filters.push({
      param: TRANSACTION_SEARCH_PARAMS.PAYER,
      value: query.payer,
      label: resolvePersonName(query.payer, persons),
      group: 'Payer',
    });
  }

  if (query.payee) {
    filters.push({
      param: TRANSACTION_SEARCH_PARAMS.PAYEE,
      value: query.payee,
      label: resolvePersonName(query.payee, persons),
      group: 'Payee',
    });
  }

  return filters;
}

export function toTransactionSearchValue(
  query: TransactionSearchQuery = EMPTY_TRANSACTION_SEARCH_QUERY,
  persons?: Person[],
): GenericSearchValue<TransactionSearchParam> {
  return {
    ...(query.freeText ? { freeText: query.freeText } : {}),
    filters: buildFiltersFromQuery(query, persons),
  };
}

export function fromTransactionSearchValue(
  value: GenericSearchValue<TransactionSearchParam>,
): TransactionSearchQuery {
  return buildQueryFromFilters(value.filters, value.freeText);
}
