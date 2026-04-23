import { PersonRole } from '../../../shared/types';
import { parsePersonSearchQuery, serializePersonSearchQuery } from './personSearchUrl';

const DOB_BEFORE = '2000-01-01';
const DOB_AFTER = '1990-01-01';

test('parses freeText from URL params', () => {
  const params = new URLSearchParams('freeText=john');

  const result = parsePersonSearchQuery(params);

  expect(result.freeText).toBe('john');
});

test('parses array fields from URL params', () => {
  const params = new URLSearchParams(
    'firstName=John&firstName=Jane&lastName=Doe&role=ADMIN&city=London',
  );

  const result = parsePersonSearchQuery(params);

  expect(result.firstName).toEqual(['John', 'Jane']);
  expect(result.lastName).toEqual(['Doe']);
  expect(result.role).toEqual([PersonRole.Admin]);
  expect(result.city).toEqual(['London']);
});

test('parses date range fields', () => {
  const params = new URLSearchParams(
    `dateOfBirthBefore=${DOB_BEFORE}&dateOfBirthAfter=${DOB_AFTER}`,
  );

  const result = parsePersonSearchQuery(params);

  expect(result.dateOfBirthBefore).toBe(DOB_BEFORE);
  expect(result.dateOfBirthAfter).toBe(DOB_AFTER);
});

test('returns empty query for empty params', () => {
  expect(parsePersonSearchQuery(new URLSearchParams(''))).toEqual({});
});

test('serializes a full query to URL params', () => {
  const query = {
    freeText: 'john',
    firstName: ['John'],
    lastName: ['Doe'],
    role: [PersonRole.Admin],
    city: ['London'],
    dateOfBirthBefore: DOB_BEFORE,
    dateOfBirthAfter: DOB_AFTER,
  };

  const params = serializePersonSearchQuery(query);

  expect(params.get('freeText')).toBe('john');
  expect(params.getAll('firstName')).toEqual(['John']);
  expect(params.getAll('lastName')).toEqual(['Doe']);
  expect(params.getAll('role')).toEqual([PersonRole.Admin]);
  expect(params.getAll('city')).toEqual(['London']);
  expect(params.get('dateOfBirthBefore')).toBe(DOB_BEFORE);
  expect(params.get('dateOfBirthAfter')).toBe(DOB_AFTER);
});

test('serializes empty query to empty string', () => {
  expect(serializePersonSearchQuery({}).toString()).toBe('');
});
