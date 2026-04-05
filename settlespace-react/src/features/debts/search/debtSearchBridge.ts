import { parseDebtDirection } from '../types';
import { createSearchValueBridge } from '../../search/bridges/searchValueBridge';
import { GenericSearchValue } from '../../search/types';
import { DEBT_SEARCH_TEXT } from '../constants';
import {
  buildDebtDirectionOptions,
  DebtSearchParam,
  DebtSearchQuery,
} from './debtSearchConfig';

export const EMPTY_DEBT_SEARCH_QUERY: DebtSearchQuery = {};

const debtSearchBridge = createSearchValueBridge<DebtSearchQuery, DebtSearchParam>({
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
      kind: 'lookup-single',
      param: DebtSearchParam.Direction,
      queryKey: 'direction',
      group: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
      options: buildDebtDirectionOptions,
      parse: (value) => parseDebtDirection(value),
    },
  ],
});

export function toDebtSearchValue(query: DebtSearchQuery) {
  return debtSearchBridge.toSearchValue(query);
}

export function fromDebtSearchValue(value: GenericSearchValue<DebtSearchParam>) {
  return debtSearchBridge.fromSearchValue(value);
}
