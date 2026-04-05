import { personApi } from '../../../shared/api/api';
import {
  getEnumValues,
  Person,
  TransactionInvolvement,
  TransactionStatus,
} from '../../../shared/types';
import { TRANSACTION_SEARCH_TEXT } from '../constants';
import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../../search/types';

export enum TransactionSearchParam {
  Status = 'status',
  Involvement = 'involvement',
  Category = 'category',
  Description = 'description',
  Involved = 'involved',
  ManagedBy = 'managedBy',
  Payer = 'payer',
  Payee = 'payee',
}

export function buildStatusOptions(): SearchSuggestionOption[] {
  return getEnumValues(TransactionStatus).map((status) => ({
    value: status,
    label: status,
    group: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
  }));
}

export function buildInvolvementOptions(): SearchSuggestionOption[] {
  return getEnumValues(TransactionInvolvement).map((type) => ({
    value: type,
    label: type,
    group: TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
  }));
}

async function searchPeopleSuggestions(input: string): Promise<SearchSuggestionOption[]> {
  try {
    const response = await personApi.search(input.trim());
    return response.data
      .filter((person): person is Person & { id: string } => Boolean(person.id))
      .map((person) => ({
        value: person.id,
        label: person.displayName?.trim() || `${person.firstName} ${person.lastName}`.trim(),
      }));
  } catch {
    return [];
  }
}

function buildPersonParameter(
  param: TransactionSearchParam,
  label: string,
  selectionMode: SearchSelectionMode = SearchSelectionMode.Single,
): SearchParameterConfig<TransactionSearchParam> {
  return {
    param,
    label,
    kind: SearchParameterKind.AsyncSuggestions,
    selectionMode,
    placeholder: TRANSACTION_SEARCH_TEXT.PERSON_PLACEHOLDER,
    showGroupLabel: false,
    getSuggestions: searchPeopleSuggestions,
  };
}

export function buildTransactionParameters(): SearchParameterConfig<TransactionSearchParam>[] {
  return [
    {
      param: TransactionSearchParam.Status,
      label: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: buildStatusOptions(),
    },
    {
      param: TransactionSearchParam.Involvement,
      label: TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Single,
      showGroupLabel: false,
      options: buildInvolvementOptions(),
    },
    {
      param: TransactionSearchParam.Category,
      label: TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
      kind: SearchParameterKind.TextInput,
      selectionMode: SearchSelectionMode.Single,
      placeholder: TRANSACTION_SEARCH_TEXT.TEXT_VALUE_PLACEHOLDER,
      showGroupLabel: false,
    },
    {
      param: TransactionSearchParam.Description,
      label: TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
      kind: SearchParameterKind.TextInput,
      selectionMode: SearchSelectionMode.Single,
      placeholder: TRANSACTION_SEARCH_TEXT.TEXT_VALUE_PLACEHOLDER,
      showGroupLabel: false,
    },
    buildPersonParameter(
      TransactionSearchParam.Involved,
      TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
      SearchSelectionMode.Multiple,
    ),
    buildPersonParameter(
      TransactionSearchParam.ManagedBy,
      TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
      SearchSelectionMode.Multiple,
    ),
    buildPersonParameter(TransactionSearchParam.Payer, TRANSACTION_SEARCH_TEXT.PAYER_LABEL),
    buildPersonParameter(TransactionSearchParam.Payee, TRANSACTION_SEARCH_TEXT.PAYEE_LABEL),
  ];
}
