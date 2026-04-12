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
  ADDRESS_VALUE_PLACEHOLDER: 'Type street line 1 or 2...',
  FIRST_NAME_LABEL: 'First Name',
  LAST_NAME_LABEL: 'Last Name',
  PHONE_NUMBER_LABEL: 'Phone Number',
  EMAIL_LABEL: 'Email',
  ROLE_LABEL: 'Role',
  DATE_OF_BIRTH_LABEL: 'Date of Birth',
  DATE_OF_BIRTH_BEFORE_LABEL: 'Date of Birth Before',
  DATE_OF_BIRTH_AFTER_LABEL: 'Date of Birth After',
  ADDRESS_LABEL: 'Address',
  POSTAL_CODE_LABEL: 'Postal Code',
  CITY_LABEL: 'City',
  STATE_OR_REGION_LABEL: 'State or Region',
  COUNTRY_LABEL: 'Country',
} as const;

export const PERSON_LIST_TEXT = {
  VIEW_TRANSACTIONS: 'View transactions',
  VIEW_DEBTS: 'View debts',
  EDIT: 'Edit',
  DELETE: 'Delete',
} as const;
