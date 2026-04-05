import { TransactionStatus } from '../../shared/types';

export const DEFAULT_TRANSACTION_CURRENCY = 'EUR';
export const DEFAULT_TRANSACTION_STATUS = TransactionStatus.Completed;

export const TRANSACTION_SEARCH_TEXT = {
  ARIA_LABEL: 'Transaction search',
  DEFAULT_PLACEHOLDER: 'Search or filter transactions...',
  PERSON_PLACEHOLDER: 'Type a person name...',
  TEXT_VALUE_PLACEHOLDER: 'Type a value...',
  STATUS_LABEL: 'Status',
  INVOLVEMENT_LABEL: 'Involvement',
  CATEGORY_LABEL: 'Category',
  DESCRIPTION_LABEL: 'Description',
  INVOLVED_LABEL: 'Involved',
  MANAGED_BY_LABEL: 'Managed By',
  PAYER_LABEL: 'Payer',
  PAYEE_LABEL: 'Payee',
} as const;

export const TRANSACTION_SEARCH_TEST_IDS = {
  AUTOCOMPLETE: 'transaction-search-autocomplete',
} as const;

export const TRANSACTION_LIST_STYLE = {
  SECONDARY_TEXT_COLOR: 'text.secondary',
  FLEX_START: 'flex-start',
} as const;

export const TRANSACTION_LIST_TEXT = {
  MANAGED: 'Managed',
  EDIT: 'Edit',
  DELETE: 'Delete',
} as const;
