import { Person } from '../../../shared/types';
import {
  parseTransactionInvolvement,
  parseTransactionStatus,
  TransactionSearchQuery,
} from '../types';
import {
  createSearchValueBridge,
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

type TransactionSearchContext = {
  persons?: Person[];
};

const transactionSearchBridge = createSearchValueBridge<
  TransactionSearchQuery,
  TransactionSearchParam,
  TransactionSearchContext
>({
  createEmptyQuery: () => ({}),
  freeText: {
    get: (query) => query.freeText,
    set: (draft, freeText) => {
      if (freeText) {
        draft.freeText = freeText;
      }
    },
  },
  fields: [
    {
      kind: 'lookup-multi',
      param: TransactionSearchParam.Status,
      queryKey: 'status',
      group: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
      options: buildStatusOptions,
      parse: (value) => parseTransactionStatus(value) ?? undefined,
    },
    {
      kind: 'lookup-single',
      param: TransactionSearchParam.Involvement,
      queryKey: 'involvement',
      group: TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
      options: buildInvolvementOptions,
      parse: (value) => parseTransactionInvolvement(value) ?? undefined,
    },
    {
      kind: 'text-single',
      param: TransactionSearchParam.Category,
      queryKey: 'category',
      group: TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
    },
    {
      kind: 'text-single',
      param: TransactionSearchParam.Description,
      queryKey: 'description',
      group: TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
    },
    {
      kind: 'resolved-multi',
      param: TransactionSearchParam.Involved,
      queryKey: 'involved',
      group: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
      resolveLabel: (personId, context) => resolvePersonName(personId, context?.persons),
    },
    {
      kind: 'resolved-multi',
      param: TransactionSearchParam.ManagedBy,
      queryKey: 'managedBy',
      group: TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
      resolveLabel: (personId, context) => resolvePersonName(personId, context?.persons),
    },
    {
      kind: 'resolved-single',
      param: TransactionSearchParam.Payer,
      queryKey: 'payer',
      group: TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
      resolveLabel: (personId, context) => resolvePersonName(personId, context?.persons),
    },
    {
      kind: 'resolved-single',
      param: TransactionSearchParam.Payee,
      queryKey: 'payee',
      group: TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
      resolveLabel: (personId, context) => resolvePersonName(personId, context?.persons),
    },
  ],
});

export function buildQueryFromFilters(
  filters: AppliedSearchFilter<TransactionSearchParam>[],
  freeText?: string,
): TransactionSearchQuery {
  return transactionSearchBridge.fromSearchValue({
    ...(freeText === undefined ? {} : { freeText }),
    filters,
  });
}

export function buildFiltersFromQuery(
  query: TransactionSearchQuery,
  persons?: Person[],
): AppliedSearchFilter<TransactionSearchParam>[] {
  return transactionSearchBridge.toSearchValue(query, { persons }).filters;
}

export function toTransactionSearchValue(
  query: TransactionSearchQuery = EMPTY_TRANSACTION_SEARCH_QUERY,
  persons?: Person[],
): GenericSearchValue<TransactionSearchParam> {
  return transactionSearchBridge.toSearchValue(query, { persons });
}

export function fromTransactionSearchValue(
  value: GenericSearchValue<TransactionSearchParam>,
): TransactionSearchQuery {
  return transactionSearchBridge.fromSearchValue(value);
}
