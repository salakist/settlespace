import { DebtDirection, getEnumValues } from '../../../shared/types';
import {
  SearchParameterConfig,
  SearchParameterKind,
  SearchSelectionMode,
  SearchSuggestionOption,
} from '../../search/types';
import { DEBT_DIRECTION_LABELS, DEBT_SEARCH_TEXT } from '../constants';

export interface DebtSearchQuery {
  freeText?: string;
  direction?: DebtDirection;
}

export enum DebtSearchParam {
  Direction = 'direction',
}

export function buildDebtDirectionOptions(): SearchSuggestionOption[] {
  return getEnumValues(DebtDirection).map((direction) => ({
    value: direction,
    label: DEBT_DIRECTION_LABELS[direction],
    group: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
  }));
}

export function buildDebtSearchParameters(): SearchParameterConfig<DebtSearchParam>[] {
  return [
    {
      param: DebtSearchParam.Direction,
      label: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
      kind: SearchParameterKind.Fixed,
      selectionMode: SearchSelectionMode.Single,
      showGroupLabel: true,
      options: buildDebtDirectionOptions(),
    },
  ];
}
