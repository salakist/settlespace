import { AppliedSearchFilter } from '../types';
import {
  buildLookupSearchFilter,
  buildLookupSearchFilters,
  buildResolvedSearchFilter,
  buildResolvedSearchFilters,
  buildTextSearchFilter,
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
