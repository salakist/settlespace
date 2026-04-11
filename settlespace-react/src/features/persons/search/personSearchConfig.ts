import { getEnumValues, PersonRole } from '../../../shared/types';
import { formatPersonRoleLabel, PERSON_SEARCH_TEXT } from '../constants';
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
): SearchParameterConfig<PersonSearchParam> {
  return {
    param,
    label,
    kind: SearchParameterKind.TextInput,
    selectionMode: SearchSelectionMode.Multiple,
    placeholder: PERSON_SEARCH_TEXT.TEXT_VALUE_PLACEHOLDER,
    showGroupLabel: false,
  };
}

export function buildPersonSearchParameters(): SearchParameterConfig<PersonSearchParam>[] {
  return [
    buildTextParameter(PersonSearchParam.FirstName, PERSON_SEARCH_TEXT.FIRST_NAME_LABEL),
    buildTextParameter(PersonSearchParam.LastName, PERSON_SEARCH_TEXT.LAST_NAME_LABEL),
    buildTextParameter(PersonSearchParam.PhoneNumber, PERSON_SEARCH_TEXT.PHONE_NUMBER_LABEL),
    buildTextParameter(PersonSearchParam.Email, PERSON_SEARCH_TEXT.EMAIL_LABEL),
    {
      param: PersonSearchParam.Role,
      label: PERSON_SEARCH_TEXT.ROLE_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Multiple,
      showGroupLabel: false,
      options: buildRoleOptions(),
    },
  ];
}
