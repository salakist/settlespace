import { PersonRole } from '../../shared/types';

export const DEFAULT_PERSON_CREATE_ROLE = PersonRole.User;

export function formatPersonRoleLabel(role: PersonRole): string {
  switch (role) {
    case PersonRole.Admin:
      return 'Administrator';
    case PersonRole.Manager:
      return 'Manager';
    case PersonRole.User:
      return 'User';
    default:
      return role;
  }
}

export const PERSON_SEARCH_TEXT = {
  ARIA_LABEL: 'Search people',
  DEFAULT_PLACEHOLDER: 'Search or filter people...',
  TEXT_VALUE_PLACEHOLDER: 'Type a value...',
  FIRST_NAME_LABEL: 'First Name',
  LAST_NAME_LABEL: 'Last Name',
  PHONE_NUMBER_LABEL: 'Phone Number',
  EMAIL_LABEL: 'Email',
  ROLE_LABEL: 'Role',
} as const;

export const PERSON_LIST_TEXT = {
  VIEW_TRANSACTIONS: 'View transactions',
  VIEW_DEBTS: 'View debts',
  EDIT: 'Edit',
  DELETE: 'Delete',
} as const;
