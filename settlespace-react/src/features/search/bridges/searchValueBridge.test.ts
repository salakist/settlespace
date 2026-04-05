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

test('normalizeBridgeFreeText trims meaningful text and omits empty values', () => {
  expect(normalizeBridgeFreeText('  hello  ')).toBe('hello');
  expect(normalizeBridgeFreeText('   ')).toBeUndefined();
  expect(normalizeBridgeFreeText(undefined)).toBeUndefined();
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
  expect(buildTextSearchFilter('category', 'Travel', 'Category')).toEqual({
    param: 'category',
    value: 'Travel',
    label: 'Travel',
    group: 'Category',
  });

  expect(buildLookupSearchFilter('status', 'Pending', [{ value: 'Pending', label: 'Pending' }], 'Status')).toEqual({
    param: 'status',
    value: 'Pending',
    label: 'Pending',
    group: 'Status',
  });

  expect(buildLookupSearchFilters('status', ['Pending', 'Completed'], [
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed', group: 'Lifecycle' },
  ], 'Status')).toEqual([
    { param: 'status', value: 'Pending', label: 'Pending', group: 'Status' },
    { param: 'status', value: 'Completed', label: 'Completed', group: 'Lifecycle' },
  ]);

  expect(buildResolvedSearchFilter('payer', 'p1', 'Payer', (value) => `User ${value}`)).toEqual({
    param: 'payer',
    value: 'p1',
    label: 'User p1',
    group: 'Payer',
  });

  expect(buildResolvedSearchFilters('payer', ['p1', 'p2'], 'Payer', (value) => `User ${value}`)).toEqual([
    { param: 'payer', value: 'p1', label: 'User p1', group: 'Payer' },
    { param: 'payer', value: 'p2', label: 'User p2', group: 'Payer' },
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

  const bridge = createSearchValueBridge<SampleQuery, SampleParam, { labels: Record<string, string> }>({
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

  expect(bridge.toSearchValue({
    search: '  coffee  ',
    status: ['Pending', 'Completed'],
    priority: 'high',
    category: 'Travel',
    owner: 'p1',
    reviewers: ['p2'],
    specialOwner: 'p3',
  }, {
    labels: {
      p1: 'Jane Doe',
      p2: 'Sam Smith',
    },
  })).toEqual({
    freeText: 'coffee',
    filters: [
      { param: SampleParam.Status, value: 'Pending', label: 'Pending', group: 'Status' },
      { param: SampleParam.Status, value: 'Completed', label: 'Completed', group: 'Status' },
      { param: SampleParam.Priority, value: 'high', label: 'High', group: 'Priority' },
      { param: SampleParam.Category, value: 'Travel', label: 'Travel', group: 'Category' },
      { param: SampleParam.Owner, value: 'p1', label: 'Jane Doe', group: 'Owner' },
      { param: SampleParam.Reviewer, value: 'p2', label: 'Sam Smith', group: 'Reviewer' },
      { param: SampleParam.Special, value: 'p3', label: 'Special p3', group: 'Special' },
    ],
  });
});

test('createSearchValueBridge maps GenericSearchValue back to a query and supports the custom escape hatch', () => {
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

  const bridge = createSearchValueBridge<SampleQuery, SampleParam, { labels: Record<string, string> }>({
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

  expect(bridge.fromSearchValue({
    freeText: '  coffee  ',
    filters: [
      { param: SampleParam.Status, value: 'Pending', label: 'Pending', group: 'Status' },
      { param: SampleParam.Status, value: 'Completed', label: 'Completed', group: 'Status' },
      { param: SampleParam.Priority, value: 'high', label: 'High', group: 'Priority' },
      { param: SampleParam.Category, value: 'Travel', label: 'Travel', group: 'Category' },
      { param: SampleParam.Owner, value: 'p1', label: 'Jane Doe', group: 'Owner' },
      { param: SampleParam.Reviewer, value: 'p2', label: 'Sam Smith', group: 'Reviewer' },
      { param: SampleParam.Special, value: 'p3', label: 'Special p3', group: 'Special' },
    ],
  }, {
    labels: {
      p1: 'Jane Doe',
      p2: 'Sam Smith',
    },
  })).toEqual({
    search: 'coffee',
    status: ['Pending', 'Completed'],
    priority: 'high',
    category: 'Travel',
    owner: 'p1',
    reviewers: ['p2'],
    specialOwner: 'p3',
  });
});
