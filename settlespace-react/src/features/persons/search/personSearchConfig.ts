import { getEnumValues, PersonRole } from '../../../shared/types';
import { formatPersonRoleLabel, PERSON_SEARCH_TEXT } from '../constants';
import { SEARCH_PLACEHOLDERS } from '../../search/constants';
import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../../search/types';

export enum PersonSearchParam {
  FirstName = 'firstName',
  LastName = 'lastName',
  PhoneNumber = 'phoneNumber',
  Email = 'email',
  Role = 'role',
  DateOfBirth = 'dateOfBirth',
  DateOfBirthBefore = 'dateOfBirthBefore',
  DateOfBirthAfter = 'dateOfBirthAfter',
  Address = 'address',
  PostalCode = 'postalCode',
  City = 'city',
  StateOrRegion = 'stateOrRegion',
  Country = 'country',
}

export function buildRoleOptions(): SearchSuggestionOption[] {
  return getEnumValues(PersonRole).map((role) => ({
    value: role,
    label: formatPersonRoleLabel(role),
    group: PERSON_SEARCH_TEXT.ROLE_LABEL,
  }));
}

function buildTextParameter(
  param: PersonSearchParam,
  label: string,
  placeholder: string = PERSON_SEARCH_TEXT.TEXT_VALUE_PLACEHOLDER,
): SearchParameterConfig<PersonSearchParam> {
  return {
    param,
    label,
    kind: SearchParameterKind.TextInput,
    selectionMode: SearchSelectionMode.Multiple,
    placeholder,
    showGroupLabel: false,
  };
}

function buildDateParameter(
  param: PersonSearchParam,
  label: string,
  {
    selectionMode = SearchSelectionMode.Multiple,
    conflictsWith,
  }: {
    selectionMode?: SearchSelectionMode;
    conflictsWith?: PersonSearchParam[];
  } = {},
): SearchParameterConfig<PersonSearchParam> {
  return {
    param,
    label,
    kind: SearchParameterKind.DateInput,
    selectionMode,
    placeholder: SEARCH_PLACEHOLDERS.DATE_INPUT,
    showGroupLabel: false,
    ...(conflictsWith ? { conflictsWith } : {}),
  };
}

export function buildPersonSearchParameters(): SearchParameterConfig<PersonSearchParam>[] {
  return [
    buildTextParameter(PersonSearchParam.FirstName, PERSON_SEARCH_TEXT.FIRST_NAME_LABEL),
    buildTextParameter(PersonSearchParam.LastName, PERSON_SEARCH_TEXT.LAST_NAME_LABEL),
    {
      param: PersonSearchParam.Role,
      label: PERSON_SEARCH_TEXT.ROLE_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: buildRoleOptions(),
    },
    buildTextParameter(PersonSearchParam.PhoneNumber, PERSON_SEARCH_TEXT.PHONE_NUMBER_LABEL),
    buildTextParameter(PersonSearchParam.Email, PERSON_SEARCH_TEXT.EMAIL_LABEL),
    buildDateParameter(PersonSearchParam.DateOfBirth, PERSON_SEARCH_TEXT.DATE_OF_BIRTH_LABEL, {
      conflictsWith: [PersonSearchParam.DateOfBirthBefore, PersonSearchParam.DateOfBirthAfter],
    }),
    buildDateParameter(PersonSearchParam.DateOfBirthBefore, PERSON_SEARCH_TEXT.DATE_OF_BIRTH_BEFORE_LABEL, {
      selectionMode: SearchSelectionMode.Single,
      conflictsWith: [PersonSearchParam.DateOfBirth, PersonSearchParam.DateOfBirthAfter],
    }),
    buildDateParameter(PersonSearchParam.DateOfBirthAfter, PERSON_SEARCH_TEXT.DATE_OF_BIRTH_AFTER_LABEL, {
      selectionMode: SearchSelectionMode.Single,
      conflictsWith: [PersonSearchParam.DateOfBirth, PersonSearchParam.DateOfBirthBefore],
    }),
    buildTextParameter(
      PersonSearchParam.Address,
      PERSON_SEARCH_TEXT.ADDRESS_LABEL,
      PERSON_SEARCH_TEXT.ADDRESS_VALUE_PLACEHOLDER,
    ),
    buildTextParameter(PersonSearchParam.PostalCode, PERSON_SEARCH_TEXT.POSTAL_CODE_LABEL),
    buildTextParameter(PersonSearchParam.City, PERSON_SEARCH_TEXT.CITY_LABEL),
    buildTextParameter(PersonSearchParam.StateOrRegion, PERSON_SEARCH_TEXT.STATE_OR_REGION_LABEL),
    buildTextParameter(PersonSearchParam.Country, PERSON_SEARCH_TEXT.COUNTRY_LABEL),
  ];
}
