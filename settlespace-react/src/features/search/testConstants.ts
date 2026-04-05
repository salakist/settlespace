import { TransactionStatus } from '../../shared/types';

export const SEARCH_TEST_TEXT = {
  GENERIC_ARIA_LABEL: 'Generic search',
  STATUS_LABEL: 'Status',
  PENDING_STATUS: TransactionStatus.Pending,
  INVOLVED_LABEL: 'Involved',
  JANE_SMITH: 'Jane Smith',
  PEOPLE_GROUP: 'People',
} as const;
