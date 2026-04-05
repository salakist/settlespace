import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import {
  Person,
  parseTransactionInvolvement,
  parseTransactionStatus,
} from '../../../shared/types';
import { AppliedSearchFilter, GenericSearchValue } from '../../search/types';
import { TRANSACTION_SEARCH_TEXT } from '../constants';
import {
  buildInvolvementOptions,
  buildStatusOptions,
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
    .filter((filter) => filter.param === TransactionSearchParam.Status)
    .map((filter) => parseTransactionStatus(filter.value))
    .filter((status): status is NonNullable<typeof status> => status !== null);
  if (statuses.length > 0) {
    query.status = statuses;
  }

  const involvement = filters.find(
    (filter) => filter.param === TransactionSearchParam.Involvement,
  );
  if (involvement) {
    const parsedInvolvement = parseTransactionInvolvement(involvement.value);
    if (parsedInvolvement) {
      query.involvement = parsedInvolvement;
    }
  }

  const category = filters.find((filter) => filter.param === TransactionSearchParam.Category);
  if (category) {
    query.category = category.value;
  }

  const description = filters.find(
    (filter) => filter.param === TransactionSearchParam.Description,
  );
  if (description) {
    query.description = description.value;
  }

  const involvedIds = filters
    .filter((filter) => filter.param === TransactionSearchParam.Involved)
    .map((filter) => filter.value);
  if (involvedIds.length > 0) {
    query.involved = involvedIds;
  }

  const managedByIds = filters
    .filter((filter) => filter.param === TransactionSearchParam.ManagedBy)
    .map((filter) => filter.value);
  if (managedByIds.length > 0) {
    query.managedBy = managedByIds;
  }

  const payer = filters.find((filter) => filter.param === TransactionSearchParam.Payer);
  if (payer) {
    query.payer = payer.value;
  }

  const payee = filters.find((filter) => filter.param === TransactionSearchParam.Payee);
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
          param: TransactionSearchParam.Status,
          value: option.value,
          label: option.label,
          group: option.group ?? TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
        }))),
    );
  }

  if (query.involvement) {
    const match = buildInvolvementOptions().find((option) => option.value === query.involvement);
    if (match) {
      filters.push({
        param: TransactionSearchParam.Involvement,
        value: match.value,
        label: match.label,
        group: match.group ?? TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
      });
    }
  }

  if (query.category) {
    filters.push(buildTextFilter(
      TransactionSearchParam.Category,
      query.category,
      TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
    ));
  }

  if (query.description) {
    filters.push(
      buildTextFilter(
        TransactionSearchParam.Description,
        query.description,
        TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
      ),
    );
  }

  if (query.involved) {
    for (const personId of query.involved) {
      filters.push({
        param: TransactionSearchParam.Involved,
        value: personId,
        label: resolvePersonName(personId, persons),
        group: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
      });
    }
  }

  if (query.managedBy) {
    for (const personId of query.managedBy) {
      filters.push({
        param: TransactionSearchParam.ManagedBy,
        value: personId,
        label: resolvePersonName(personId, persons),
        group: TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
      });
    }
  }

  if (query.payer) {
    filters.push({
      param: TransactionSearchParam.Payer,
      value: query.payer,
      label: resolvePersonName(query.payer, persons),
      group: TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
    });
  }

  if (query.payee) {
    filters.push({
      param: TransactionSearchParam.Payee,
      value: query.payee,
      label: resolvePersonName(query.payee, persons),
      group: TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
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
