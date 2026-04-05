import { APP_ROUTES } from '../../app/constants';
import { SESSION_EXPIRED_MESSAGE } from '../../shared/constants/messages';
import {
  Person,
  PersonRole,
  TransactionStatus,
} from '../../shared/types';
import { TransactionInvolvement } from './types';
import { SEARCH_TEST_IDS } from '../search/constants';
import { TRANSACTION_SEARCH_TEXT } from './constants';

export const TRANSACTION_PAGE_TEST_TEXT = {
  LIST_TITLE: 'Transaction List',
  FORM_TITLE: 'Transaction Form',
  GENERIC_ERROR: 'Something went wrong',
} as const;

export const TRANSACTION_TEST_TEXT = {
  SEARCH_ARIA_LABEL: TRANSACTION_SEARCH_TEXT.ARIA_LABEL,
  STATUS_PENDING_CHIP: `Status: ${TransactionStatus.Pending}`,
  STATUS_COMPLETED_CHIP: `Status: ${TransactionStatus.Completed}`,
  INVOLVEMENT_OWNED_CHIP: `Involvement: ${TransactionInvolvement.Owned}`,
  INVOLVEMENT_MANAGED_CHIP: `Involvement: ${TransactionInvolvement.Managed}`,
  MANAGED_BY_OPTION: TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
  MANAGED_BY_JOHN_DOE_CHIP: `${TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL}: John Doe`,
  SESSION_EXPIRED: SESSION_EXPIRED_MESSAGE,
  JANE_SMITH: 'Jane Smith',
  JOHN_DOE: 'John Doe',
  ALICE_JOHNSON: 'Alice Johnson',
  CATEGORY_LABEL: TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
  DESCRIPTION_LABEL: TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
  INVOLVED_LABEL: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
  PAYER_LABEL: TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
  PAYEE_LABEL: TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
  DINNER: 'Dinner',
  LUNCH: 'Lunch',
  BLOCKED_EDIT: 'Blocked edit',
} as const;

export const TRANSACTION_TEST_IDS = {
  PENDING_PARAM_CHIP: SEARCH_TEST_IDS.PENDING_PARAMETER_CHIP,
} as const;

export const TRANSACTION_TEST_ROUTES = {
  LIST: APP_ROUTES.TRANSACTIONS,
  CREATE: APP_ROUTES.TRANSACTION_CREATE,
} as const;

export const TRANSACTION_TEST_VALUES = {
  CURRENT_PERSON_ID: 'p1',
  SECOND_PERSON_ID: 'p2',
  THIRD_PERSON_ID: 'p3',
  FIRST_TRANSACTION_ID: 'tx-1',
  SECOND_TRANSACTION_ID: 'tx-2',
  DATE_UTC: '2026-03-29T00:00:00Z',
} as const;

export const DEFAULT_TRANSACTION_TEST_PERSONS: Person[] = [
  {
    id: TRANSACTION_TEST_VALUES.CURRENT_PERSON_ID,
    firstName: 'John',
    lastName: 'Doe',
    addresses: [],
    role: PersonRole.User,
  },
  {
    id: TRANSACTION_TEST_VALUES.SECOND_PERSON_ID,
    firstName: 'Jane',
    lastName: 'Smith',
    addresses: [],
    role: PersonRole.User,
  },
  {
    id: TRANSACTION_TEST_VALUES.THIRD_PERSON_ID,
    firstName: 'Alice',
    lastName: 'Johnson',
    addresses: [],
    role: PersonRole.User,
  },
];
