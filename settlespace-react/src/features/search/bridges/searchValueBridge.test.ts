import { AppliedSearchFilter } from '../types';
import {
  buildLookupSearchFilter,
  buildLookupSearchFilters,
  buildResolvedSearchFilter,
  buildResolvedSearchFilters,
  buildTextSearchFilter,
  createSearchValueBridge,
  getFilterValues,
  getSingleFilterValue,
  normalizeBridgeFreeText,
  resolveEntityLabelById,
} from './searchValueBridge';

enum SampleParam {
  Status = 'status',
  Priority = 'priority',
  Category = 'category',
  Owner = 'owner',
  Reviewer = 'reviewer',
  Special = 'special',
}

type SampleQuery = {
  search?: string;
  status?: string[];
  priority?: string;
  category?: string;
  owner?: string;
  reviewers?: string[];
  specialOwner?: string;
};

type SampleBridgeContext = {
  labels: Record<string, string>;
};

function createSampleBridge() {
  return createSearchValueBridge<SampleQuery, SampleParam, SampleBridgeContext>({
    createEmptyQuery: () => ({}),
    freeText: {
      get: (query) => query.search,
      set: (draft, freeText) => {
        if (freeText) {
          draft.search = freeText;
        }
      },
    },
    fields: [
      {
        kind: 'lookup-multi',
        param: SampleParam.Status,
        queryKey: 'status',
        group: 'Status',
        options: [
          { value: 'Pending', label: 'Pending' },
          { value: 'Completed', label: 'Completed' },
        ],
      },
      {
        kind: 'lookup-single',
        param: SampleParam.Priority,
        queryKey: 'priority',
        group: 'Priority',
        options: [{ value: 'high', label: 'High' }],
      },
      {
        kind: 'text-single',
        param: SampleParam.Category,
        queryKey: 'category',
        group: 'Category',
      },
      {
        kind: 'resolved-single',
        param: SampleParam.Owner,
        queryKey: 'owner',
        group: 'Owner',
        resolveLabel: (value, context) => context?.labels[value] ?? value,
      },
      {
        kind: 'resolved-multi',
        param: SampleParam.Reviewer,
        queryKey: 'reviewers',
        group: 'Reviewer',
        resolveLabel: (value, context) => context?.labels[value] ?? value,
      },
      {
        kind: 'custom',
        toFilters: (query) => query.specialOwner
          ? [{
            param: SampleParam.Special,
            value: query.specialOwner,
            label: `Special ${query.specialOwner}`,
            group: 'Special',
          }]
          : [],
        applyToQuery: (draft, filters) => {
          const special = getSingleFilterValue(filters, SampleParam.Special);
          if (special) {
            draft.specialOwner = special;
          }
        },
      },
    ],
  });
}

const sampleBridgeContext: SampleBridgeContext = {
  labels: {
    p1: 'Jane Doe',
    p2: 'Sam Smith',
  },
};

function createExpectedFilter<TParam extends string>(
  param: TParam,
  value: string,
  label: string,
  group: string,
): AppliedSearchFilter<TParam> {
  return { param, value, label, group };
}

const sampleBridgeFilters: AppliedSearchFilter<SampleParam>[] = [
  createExpectedFilter(SampleParam.Status, 'Pending', 'Pending', 'Status'),
  createExpectedFilter(SampleParam.Status, 'Completed', 'Completed', 'Status'),
  createExpectedFilter(SampleParam.Priority, 'high', 'High', 'Priority'),
  createExpectedFilter(SampleParam.Category, 'Travel', 'Travel', 'Category'),
  createExpectedFilter(SampleParam.Owner, 'p1', 'Jane Doe', 'Owner'),
  createExpectedFilter(SampleParam.Reviewer, 'p2', 'Sam Smith', 'Reviewer'),
  createExpectedFilter(SampleParam.Special, 'p3', 'Special p3', 'Special'),
];

test('normalizeBridgeFreeText trims meaningful text and omits empty values', () => {
  expect(normalizeBridgeFreeText('  hello  ')).toBe('hello');
  expect(normalizeBridgeFreeText('   ')).toBeUndefined();
  expect(normalizeBridgeFreeText()).toBeUndefined();
});

test('filter helpers read single and multi values by param', () => {
  const filters: AppliedSearchFilter<'status' | 'category'>[] = [
    { param: 'status', value: 'Pending', label: 'Pending', group: 'Status' },
    { param: 'status', value: 'Completed', label: 'Completed', group: 'Status' },
    { param: 'category', value: 'Travel', label: 'Travel', group: 'Category' },
  ];

  expect(getSingleFilterValue(filters, 'category')).toBe('Travel');
  expect(getFilterValues(filters, 'status')).toEqual(['Pending', 'Completed']);
});

test('build helpers create lookup, text, and resolved filters with expected labels', () => {
  expect(buildTextSearchFilter('category', 'Travel', 'Category')).toEqual(
    createExpectedFilter('category', 'Travel', 'Travel', 'Category'),
  );

  expect(buildLookupSearchFilter('status', 'Pending', [{ value: 'Pending', label: 'Pending' }], 'Status')).toEqual(
    createExpectedFilter('status', 'Pending', 'Pending', 'Status'),
  );

  expect(buildLookupSearchFilters('status', ['Pending', 'Completed'], [
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed', group: 'Lifecycle' },
  ], 'Status')).toEqual([
    createExpectedFilter('status', 'Pending', 'Pending', 'Status'),
    createExpectedFilter('status', 'Completed', 'Completed', 'Lifecycle'),
  ]);

  expect(buildResolvedSearchFilter('payer', 'p1', 'Payer', (value) => `User ${value}`)).toEqual(
    createExpectedFilter('payer', 'p1', 'User p1', 'Payer'),
  );

  expect(buildResolvedSearchFilters('payer', ['p1', 'p2'], 'Payer', (value) => `User ${value}`)).toEqual([
    createExpectedFilter('payer', 'p1', 'User p1', 'Payer'),
    createExpectedFilter('payer', 'p2', 'User p2', 'Payer'),
  ]);
});

test('resolveEntityLabelById returns resolved labels and falls back to raw ids', () => {
  const entities = [
    { id: 'p1', label: 'Jane Doe' },
    { id: 'p2', label: 'Sam Smith' },
  ];

  expect(resolveEntityLabelById('p1', entities, (entity) => entity.label)).toBe('Jane Doe');
  expect(resolveEntityLabelById('missing', entities, (entity) => entity.label)).toBe('missing');
});

test('createSearchValueBridge maps queries to GenericSearchValue with declarative field configs', () => {
  const bridge = createSampleBridge();

  expect(bridge.toSearchValue({
    search: '  coffee  ',
    status: ['Pending', 'Completed'],
    priority: 'high',
    category: 'Travel',
    owner: 'p1',
    reviewers: ['p2'],
    specialOwner: 'p3',
  }, sampleBridgeContext)).toEqual({
    freeText: 'coffee',
    filters: sampleBridgeFilters,
  });
});

test('createSearchValueBridge maps GenericSearchValue back to a query and supports the custom escape hatch', () => {
  const bridge = createSampleBridge();

  expect(bridge.fromSearchValue({
    freeText: '  coffee  ',
    filters: sampleBridgeFilters,
  }, sampleBridgeContext)).toEqual({
    search: 'coffee',
    status: ['Pending', 'Completed'],
    priority: 'high',
    category: 'Travel',
    owner: 'p1',
    reviewers: ['p2'],
    specialOwner: 'p3',
  });
});
