import { PersonRole } from '../../shared/types';

export const DEFAULT_PERSON_CREATE_ROLE = PersonRole.User;

export const PERSON_LIST_TEXT = {
  EMPTY_STATE: 'No persons found.',
  VIEW_TRANSACTIONS: 'View transactions',
  VIEW_DEBTS: 'View debts',
  EDIT: 'Edit',
  DELETE: 'Delete',
} as const;
