import { PersonRole } from '../../../shared/types';
import {
  EMPTY_PERSON_SEARCH_QUERY,
  fromPersonSearchValue,
  toPersonSearchValue,
} from './personSearchBridge';
import { buildRoleOptions, PersonSearchParam } from './personSearchConfig';

test('buildRoleOptions exposes PascalCase labels for all supported person roles', () => {
  expect(buildRoleOptions()).toEqual([
    { value: PersonRole.Admin, label: 'Administrator', group: 'Role' },
    { value: PersonRole.Manager, label: 'Manager', group: 'Role' },
    { value: PersonRole.User, label: 'User', group: 'Role' },
  ]);
});

test('person search bridge round-trips core structured filters', () => {
  const searchValue = toPersonSearchValue({
    freeText: 'john',
    lastName: ['Doe', 'Smith'],
    email: ['john@'],
    role: [PersonRole.User],
  });

  expect(searchValue).toEqual({
    freeText: 'john',
    filters: [
      { param: PersonSearchParam.LastName, value: 'Doe', label: 'Doe', group: 'Last Name' },
      { param: PersonSearchParam.LastName, value: 'Smith', label: 'Smith', group: 'Last Name' },
      { param: PersonSearchParam.Email, value: 'john@', label: 'john@', group: 'Email' },
      { param: PersonSearchParam.Role, value: PersonRole.User, label: 'User', group: 'Role' },
    ],
  });

  expect(fromPersonSearchValue(searchValue)).toEqual({
    freeText: 'john',
    lastName: ['Doe', 'Smith'],
    email: ['john@'],
    role: [PersonRole.User],
  });
});

test('empty person query maps to an empty search value', () => {
  expect(toPersonSearchValue(EMPTY_PERSON_SEARCH_QUERY)).toEqual({ filters: [] });
});
