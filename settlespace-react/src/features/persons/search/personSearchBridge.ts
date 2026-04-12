import { parsePersonRole } from '../../../shared/types';
import { createSearchValueBridge } from '../../search/bridges/searchValueBridge';
import { GenericSearchValue } from '../../search/types';
import { formatDateSearchLabel } from '../../search/utils/searchHelpers';
import { PERSON_SEARCH_TEXT } from '../constants';
import { buildRoleOptions, PersonSearchParam } from './personSearchConfig';
import { PersonSearchQuery } from './personSearchTypes';

export const EMPTY_PERSON_SEARCH_QUERY: PersonSearchQuery = {};

const MULTI_TEXT_FIELD_KIND = 'text-multi' as const;

const personSearchBridge = createSearchValueBridge<PersonSearchQuery, PersonSearchParam>({
  createEmptyQuery: () => ({}),
  freeText: {
    get: (query) => query.freeText,
    set: (draft, freeText) => {
      if (freeText) {
        draft.freeText = freeText;
      }
    },
  },
  fields: [
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.FirstName,
      queryKey: 'firstName',
      group: PERSON_SEARCH_TEXT.FIRST_NAME_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.LastName,
      queryKey: 'lastName',
      group: PERSON_SEARCH_TEXT.LAST_NAME_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.PhoneNumber,
      queryKey: 'phoneNumber',
      group: PERSON_SEARCH_TEXT.PHONE_NUMBER_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.Email,
      queryKey: 'email',
      group: PERSON_SEARCH_TEXT.EMAIL_LABEL,
    },
    {
      kind: 'lookup-multi',
      param: PersonSearchParam.Role,
      queryKey: 'role',
      group: PERSON_SEARCH_TEXT.ROLE_LABEL,
      options: buildRoleOptions,
      parse: (value) => parsePersonRole(value) ?? undefined,
    },
    {
      kind: 'resolved-multi',
      param: PersonSearchParam.DateOfBirth,
      queryKey: 'dateOfBirth',
      group: PERSON_SEARCH_TEXT.DATE_OF_BIRTH_LABEL,
      resolveLabel: (value) => formatDateSearchLabel(value),
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.Address,
      queryKey: 'address',
      group: PERSON_SEARCH_TEXT.ADDRESS_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.PostalCode,
      queryKey: 'postalCode',
      group: PERSON_SEARCH_TEXT.POSTAL_CODE_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.City,
      queryKey: 'city',
      group: PERSON_SEARCH_TEXT.CITY_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.StateOrRegion,
      queryKey: 'stateOrRegion',
      group: PERSON_SEARCH_TEXT.STATE_OR_REGION_LABEL,
    },
    {
      kind: MULTI_TEXT_FIELD_KIND,
      param: PersonSearchParam.Country,
      queryKey: 'country',
      group: PERSON_SEARCH_TEXT.COUNTRY_LABEL,
    },
  ],
});

export function toPersonSearchValue(
  query: PersonSearchQuery = EMPTY_PERSON_SEARCH_QUERY,
): GenericSearchValue<PersonSearchParam> {
  return personSearchBridge.toSearchValue(query);
}

export function fromPersonSearchValue(
  value: GenericSearchValue<PersonSearchParam>,
): PersonSearchQuery {
  return personSearchBridge.fromSearchValue(value);
}
