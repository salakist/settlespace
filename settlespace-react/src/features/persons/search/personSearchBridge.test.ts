import { PersonRole } from '../../../shared/types';
import {
  EMPTY_PERSON_SEARCH_QUERY,
  fromPersonSearchValue,
  toPersonSearchValue,
} from './personSearchBridge';
import {
  buildPersonSearchParameters,
  buildRoleOptions,
  PersonSearchParam,
} from './personSearchConfig';

const STREET_PLACEHOLDER = 'Type street line 1 or 2...';
const DATE_PLACEHOLDER = 'DD/MM/YYYY';
const SEARCH_FREE_TEXT = 'john';
const LAST_NAME_DOE = 'Doe';
const LAST_NAME_SMITH = 'Smith';
const EMAIL_FRAGMENT = 'john@';
const DATE_OF_BIRTH_ISO = '2001-02-03';
const DATE_OF_BIRTH_LABEL = '03/02/2001';
const STREET_MAIN = 'Main Street';
const CITY_PARIS = 'Paris';
const COUNTRY_FRANCE = 'France';
const COUNTRY_BELGIUM = 'Belgium';

test('buildRoleOptions exposes PascalCase labels for all supported person roles', () => {
  expect(buildRoleOptions()).toEqual([
    { value: PersonRole.Admin, label: 'Administrator', group: 'Role' },
    { value: PersonRole.Manager, label: 'Manager', group: 'Role' },
    { value: PersonRole.User, label: 'User', group: 'Role' },
  ]);
});

test('buildPersonSearchParameters includes the address filters with explicit placeholder copy', () => {
  expect(buildPersonSearchParameters()).toEqual(expect.arrayContaining([
    expect.objectContaining({
      param: PersonSearchParam.Address,
      placeholder: STREET_PLACEHOLDER,
    }),
    expect.objectContaining({
      param: PersonSearchParam.DateOfBirth,
      placeholder: DATE_PLACEHOLDER,
    }),
    expect.objectContaining({ param: PersonSearchParam.PostalCode }),
    expect.objectContaining({ param: PersonSearchParam.City }),
    expect.objectContaining({ param: PersonSearchParam.StateOrRegion }),
    expect.objectContaining({ param: PersonSearchParam.Country }),
  ]));
});

test('person search bridge round-trips core, date, and address structured filters', () => {
  const searchValue = toPersonSearchValue({
    freeText: SEARCH_FREE_TEXT,
    lastName: [LAST_NAME_DOE, LAST_NAME_SMITH],
    email: [EMAIL_FRAGMENT],
    role: [PersonRole.User],
    dateOfBirth: [DATE_OF_BIRTH_ISO],
    address: [STREET_MAIN],
    city: [CITY_PARIS],
    country: [COUNTRY_FRANCE, COUNTRY_BELGIUM],
  });

  expect(searchValue).toEqual({
    freeText: SEARCH_FREE_TEXT,
    filters: [
      { param: PersonSearchParam.LastName, value: LAST_NAME_DOE, label: LAST_NAME_DOE, group: 'Last Name' },
      { param: PersonSearchParam.LastName, value: LAST_NAME_SMITH, label: LAST_NAME_SMITH, group: 'Last Name' },
      { param: PersonSearchParam.Email, value: EMAIL_FRAGMENT, label: EMAIL_FRAGMENT, group: 'Email' },
      { param: PersonSearchParam.Role, value: PersonRole.User, label: 'User', group: 'Role' },
      { param: PersonSearchParam.DateOfBirth, value: DATE_OF_BIRTH_ISO, label: DATE_OF_BIRTH_LABEL, group: 'Date of Birth' },
      { param: PersonSearchParam.Address, value: STREET_MAIN, label: STREET_MAIN, group: 'Address' },
      { param: PersonSearchParam.City, value: CITY_PARIS, label: CITY_PARIS, group: 'City' },
      { param: PersonSearchParam.Country, value: COUNTRY_FRANCE, label: COUNTRY_FRANCE, group: 'Country' },
      { param: PersonSearchParam.Country, value: COUNTRY_BELGIUM, label: COUNTRY_BELGIUM, group: 'Country' },
    ],
  });

  expect(fromPersonSearchValue(searchValue)).toEqual({
    freeText: SEARCH_FREE_TEXT,
    lastName: [LAST_NAME_DOE, LAST_NAME_SMITH],
    email: [EMAIL_FRAGMENT],
    role: [PersonRole.User],
    dateOfBirth: [DATE_OF_BIRTH_ISO],
    address: [STREET_MAIN],
    city: [CITY_PARIS],
    country: [COUNTRY_FRANCE, COUNTRY_BELGIUM],
  });
});

test('empty person query maps to an empty search value', () => {
  expect(toPersonSearchValue(EMPTY_PERSON_SEARCH_QUERY)).toEqual({ filters: [] });
});
