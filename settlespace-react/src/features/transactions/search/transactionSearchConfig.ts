import { personApi } from '../../../shared/api/api';
import { Person, TransactionStatus } from '../../../shared/types';
import {
  SEARCH_PARAMETER_KINDS,
  SEARCH_SELECTION_MODES,
} from '../../search/constants';
import {
  SearchParameterConfig,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../../search/types';

const TRANSACTION_STATUSES: TransactionStatus[] = ['Pending', 'Completed', 'Cancelled'];
const INVOLVEMENT_TYPES = ['Owned', 'Managed'] as const;
const PERSON_PLACEHOLDER = 'Type a person name...';
const TEXT_VALUE_PLACEHOLDER = 'Type a value...';

export const TRANSACTION_SEARCH_PLACEHOLDER = 'Search or filter transactions...';
export const MANAGED_BY_LABEL = 'Managed By';

export const TRANSACTION_SEARCH_PARAMS = {
  STATUS: 'status',
  INVOLVEMENT: 'involvement',
  CATEGORY: 'category',
  DESCRIPTION: 'description',
  INVOLVED: 'involved',
  MANAGED_BY: 'managedBy',
  PAYER: 'payer',
  PAYEE: 'payee',
} as const;

export type TransactionSearchParam =
  typeof TRANSACTION_SEARCH_PARAMS[keyof typeof TRANSACTION_SEARCH_PARAMS];

export function buildStatusOptions(): SearchSuggestionOption[] {
  return TRANSACTION_STATUSES.map((status) => ({
    value: status,
    label: status,
    group: 'Status',
  }));
}

export function buildInvolvementOptions(): SearchSuggestionOption[] {
  return INVOLVEMENT_TYPES.map((type) => ({
    value: type,
    label: type,
    group: 'Involvement',
  }));
}

async function searchPeopleSuggestions(input: string): Promise<SearchSuggestionOption[]> {
  try {
    const response = await personApi.search(input.trim());
    return response.data
      .filter((person): person is Person & { id: string } => Boolean(person.id))
      .map((person) => ({
        value: person.id,
        label: `${person.firstName} ${person.lastName}`,
      }));
  } catch {
    return [];
  }
}

function buildPersonParameter(
  param: TransactionSearchParam,
  label: string,
  selectionMode: SearchSelectionMode = SEARCH_SELECTION_MODES.SINGLE,
): SearchParameterConfig<TransactionSearchParam> {
  return {
    param,
    label,
    kind: SEARCH_PARAMETER_KINDS.ASYNC_SUGGESTIONS,
    selectionMode,
    placeholder: PERSON_PLACEHOLDER,
    getSuggestions: searchPeopleSuggestions,
  };
}

export function buildTransactionParameters(): SearchParameterConfig<TransactionSearchParam>[] {
  return [
    {
      param: TRANSACTION_SEARCH_PARAMS.STATUS,
      label: 'Status',
      kind: SEARCH_PARAMETER_KINDS.FIXED,
      selectionMode: SEARCH_SELECTION_MODES.MULTIPLE,
      options: buildStatusOptions(),
    },
    {
      param: TRANSACTION_SEARCH_PARAMS.INVOLVEMENT,
      label: 'Involvement',
      kind: SEARCH_PARAMETER_KINDS.FIXED,
      selectionMode: SEARCH_SELECTION_MODES.SINGLE,
      options: buildInvolvementOptions(),
    },
    {
      param: TRANSACTION_SEARCH_PARAMS.CATEGORY,
      label: 'Category',
      kind: SEARCH_PARAMETER_KINDS.TEXT_INPUT,
      selectionMode: SEARCH_SELECTION_MODES.SINGLE,
      placeholder: TEXT_VALUE_PLACEHOLDER,
    },
    {
      param: TRANSACTION_SEARCH_PARAMS.DESCRIPTION,
      label: 'Description',
      kind: SEARCH_PARAMETER_KINDS.TEXT_INPUT,
      selectionMode: SEARCH_SELECTION_MODES.SINGLE,
      placeholder: TEXT_VALUE_PLACEHOLDER,
    },
    buildPersonParameter(
      TRANSACTION_SEARCH_PARAMS.INVOLVED,
      'Involved',
      SEARCH_SELECTION_MODES.MULTIPLE,
    ),
    buildPersonParameter(
      TRANSACTION_SEARCH_PARAMS.MANAGED_BY,
      MANAGED_BY_LABEL,
      SEARCH_SELECTION_MODES.MULTIPLE,
    ),
    buildPersonParameter(TRANSACTION_SEARCH_PARAMS.PAYER, 'Payer'),
    buildPersonParameter(TRANSACTION_SEARCH_PARAMS.PAYEE, 'Payee'),
  ];
}
