import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import {
  Person,
  parseTransactionInvolvement,
  parseTransactionStatus,
} from '../../../shared/types';
import {
  buildLookupSearchFilter,
  buildLookupSearchFilters,
  buildResolvedSearchFilter,
  buildResolvedSearchFilters,
  buildTextSearchFilter,
  getFilterValues,
  getSingleFilterValue,
  normalizeBridgeFreeText,
  resolveEntityLabelById,
} from '../../search/bridges/searchValueBridge';
import { AppliedSearchFilter, GenericSearchValue } from '../../search/types';
import { TRANSACTION_SEARCH_TEXT } from '../constants';
import {
  buildInvolvementOptions,
  buildStatusOptions,
  TransactionSearchParam,
} from './transactionSearchConfig';

export const EMPTY_TRANSACTION_SEARCH_QUERY: TransactionSearchQuery = {};

export function resolvePersonName(personId: string, persons?: Person[]): string {
  return resolveEntityLabelById(
    personId,
    persons,
    (person) => person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim(),
  );
}

export function buildQueryFromFilters(
  filters: AppliedSearchFilter<TransactionSearchParam>[],
  freeText?: string,
): TransactionSearchQuery {
  const query: TransactionSearchQuery = {};

  const trimmed = normalizeBridgeFreeText(freeText);
  if (trimmed) {
    query.freeText = trimmed;
  }

  const statuses = getFilterValues(filters, TransactionSearchParam.Status)
    .map((value) => parseTransactionStatus(value))
    .filter((status): status is NonNullable<typeof status> => status !== null);
  if (statuses.length > 0) {
    query.status = statuses;
  }

  const involvementValue = getSingleFilterValue(filters, TransactionSearchParam.Involvement);
  const parsedInvolvement = parseTransactionInvolvement(involvementValue);
  if (parsedInvolvement) {
    query.involvement = parsedInvolvement;
  }

  const category = getSingleFilterValue(filters, TransactionSearchParam.Category);
  if (category) {
    query.category = category;
  }

  const description = getSingleFilterValue(filters, TransactionSearchParam.Description);
  if (description) {
    query.description = description;
  }

  const involvedIds = getFilterValues(filters, TransactionSearchParam.Involved);
  if (involvedIds.length > 0) {
    query.involved = involvedIds;
  }

  const managedByIds = getFilterValues(filters, TransactionSearchParam.ManagedBy);
  if (managedByIds.length > 0) {
    query.managedBy = managedByIds;
  }

  const payer = getSingleFilterValue(filters, TransactionSearchParam.Payer);
  if (payer) {
    query.payer = payer;
  }

  const payee = getSingleFilterValue(filters, TransactionSearchParam.Payee);
  if (payee) {
    query.payee = payee;
  }

  return query;
}

export function buildFiltersFromQuery(
  query: TransactionSearchQuery,
  persons?: Person[],
): AppliedSearchFilter<TransactionSearchParam>[] {
  const filters: AppliedSearchFilter<TransactionSearchParam>[] = [];

  filters.push(
    ...buildLookupSearchFilters(
      TransactionSearchParam.Status,
      query.status,
      buildStatusOptions(),
      TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
    ),
  );

  const involvementFilter = buildLookupSearchFilter(
    TransactionSearchParam.Involvement,
    query.involvement,
    buildInvolvementOptions(),
    TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
  );
  if (involvementFilter) {
    filters.push(involvementFilter);
  }

  if (query.category) {
    filters.push(
      buildTextSearchFilter(
        TransactionSearchParam.Category,
        query.category,
        TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
      ),
    );
  }

  if (query.description) {
    filters.push(
      buildTextSearchFilter(
        TransactionSearchParam.Description,
        query.description,
        TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
      ),
    );
  }

  filters.push(
    ...buildResolvedSearchFilters(
      TransactionSearchParam.Involved,
      query.involved,
      TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
      (personId) => resolvePersonName(personId, persons),
    ),
  );

  filters.push(
    ...buildResolvedSearchFilters(
      TransactionSearchParam.ManagedBy,
      query.managedBy,
      TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
      (personId) => resolvePersonName(personId, persons),
    ),
  );

  const payerFilter = buildResolvedSearchFilter(
    TransactionSearchParam.Payer,
    query.payer,
    TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
    (personId) => resolvePersonName(personId, persons),
  );
  if (payerFilter) {
    filters.push(payerFilter);
  }

  const payeeFilter = buildResolvedSearchFilter(
    TransactionSearchParam.Payee,
    query.payee,
    TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
    (personId) => resolvePersonName(personId, persons),
  );
  if (payeeFilter) {
    filters.push(payeeFilter);
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
