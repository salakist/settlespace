import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import {
  Person,
  TransactionInvolvement,
  TransactionStatus,
} from '../../../shared/types';
import { TRANSACTION_SEARCH_TEXT } from '../constants';
import {
  buildFiltersFromQuery,
  buildQueryFromFilters,
  fromTransactionSearchValue,
  resolvePersonName,
  toTransactionSearchValue,
} from './transactionSearchBridge';
import { TransactionSearchParam } from './transactionSearchConfig';

const UNKNOWN_PERSON_ID = 'missing-person';

const persons: Person[] = [
  {
    id: 'p1',
    firstName: 'Jane',
    lastName: 'Doe',
    displayName: 'Jane Doe',
    addresses: [],
  },
  {
    id: 'p2',
    firstName: 'Sam',
    lastName: 'Smith',
    addresses: [],
  },
];

test('buildQueryFromFilters parses free text and all transaction filter groups', () => {
  const filters = [
    {
      param: TransactionSearchParam.Status,
      value: TransactionStatus.Pending,
      label: TransactionStatus.Pending,
      group: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
    },
    {
      param: TransactionSearchParam.Status,
      value: TransactionStatus.Completed,
      label: TransactionStatus.Completed,
      group: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
    },
    {
      param: TransactionSearchParam.Involvement,
      value: TransactionInvolvement.Managed,
      label: TransactionInvolvement.Managed,
      group: TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
    },
    {
      param: TransactionSearchParam.Category,
      value: 'Travel',
      label: 'Travel',
      group: TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
    },
    {
      param: TransactionSearchParam.Description,
      value: 'Hotel',
      label: 'Hotel',
      group: TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
    },
    {
      param: TransactionSearchParam.Involved,
      value: 'p1',
      label: 'Jane Doe',
      group: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
    },
    {
      param: TransactionSearchParam.ManagedBy,
      value: 'p2',
      label: 'Sam Smith',
      group: TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
    },
    {
      param: TransactionSearchParam.Payer,
      value: 'p1',
      label: 'Jane Doe',
      group: TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
    },
    {
      param: TransactionSearchParam.Payee,
      value: 'p2',
      label: 'Sam Smith',
      group: TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
    },
  ];

  expect(buildQueryFromFilters(filters, '  trip to paris  ')).toEqual({
    freeText: 'trip to paris',
    status: [TransactionStatus.Pending, TransactionStatus.Completed],
    involvement: TransactionInvolvement.Managed,
    category: 'Travel',
    description: 'Hotel',
    involved: ['p1'],
    managedBy: ['p2'],
    payer: 'p1',
    payee: 'p2',
  });
});

test('buildFiltersFromQuery resolves option labels and falls back to ids for unknown persons', () => {
  const query: TransactionSearchQuery = {
    status: [TransactionStatus.Pending],
    involvement: TransactionInvolvement.Owned,
    category: 'Travel',
    description: 'Hotel',
    involved: ['p1', UNKNOWN_PERSON_ID],
    managedBy: ['p2'],
    payer: 'p1',
    payee: UNKNOWN_PERSON_ID,
  };

  expect(buildFiltersFromQuery(query, persons)).toEqual([
    {
      param: TransactionSearchParam.Status,
      value: TransactionStatus.Pending,
      label: TransactionStatus.Pending,
      group: TRANSACTION_SEARCH_TEXT.STATUS_LABEL,
    },
    {
      param: TransactionSearchParam.Involvement,
      value: TransactionInvolvement.Owned,
      label: TransactionInvolvement.Owned,
      group: TRANSACTION_SEARCH_TEXT.INVOLVEMENT_LABEL,
    },
    {
      param: TransactionSearchParam.Category,
      value: 'Travel',
      label: 'Travel',
      group: TRANSACTION_SEARCH_TEXT.CATEGORY_LABEL,
    },
    {
      param: TransactionSearchParam.Description,
      value: 'Hotel',
      label: 'Hotel',
      group: TRANSACTION_SEARCH_TEXT.DESCRIPTION_LABEL,
    },
    {
      param: TransactionSearchParam.Involved,
      value: 'p1',
      label: 'Jane Doe',
      group: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
    },
    {
      param: TransactionSearchParam.Involved,
      value: UNKNOWN_PERSON_ID,
      label: UNKNOWN_PERSON_ID,
      group: TRANSACTION_SEARCH_TEXT.INVOLVED_LABEL,
    },
    {
      param: TransactionSearchParam.ManagedBy,
      value: 'p2',
      label: 'Sam Smith',
      group: TRANSACTION_SEARCH_TEXT.MANAGED_BY_LABEL,
    },
    {
      param: TransactionSearchParam.Payer,
      value: 'p1',
      label: 'Jane Doe',
      group: TRANSACTION_SEARCH_TEXT.PAYER_LABEL,
    },
    {
      param: TransactionSearchParam.Payee,
      value: UNKNOWN_PERSON_ID,
      label: UNKNOWN_PERSON_ID,
      group: TRANSACTION_SEARCH_TEXT.PAYEE_LABEL,
    },
  ]);
});

test('toTransactionSearchValue and fromTransactionSearchValue round-trip a representative query', () => {
  const query: TransactionSearchQuery = {
    freeText: 'coffee',
    status: [TransactionStatus.Cancelled],
    involvement: TransactionInvolvement.Managed,
    category: 'Food',
    description: 'Latte',
    involved: ['p1'],
    managedBy: ['p2'],
    payer: 'p1',
    payee: 'p2',
  };

  expect(fromTransactionSearchValue(toTransactionSearchValue(query, persons))).toEqual(query);
});

test('resolvePersonName prefers display name, then full name, then raw id', () => {
  expect(resolvePersonName('p1', persons)).toBe('Jane Doe');
  expect(resolvePersonName('p2', persons)).toBe('Sam Smith');
  expect(resolvePersonName(UNKNOWN_PERSON_ID, persons)).toBe(UNKNOWN_PERSON_ID);
});
