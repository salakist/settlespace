import { DebtDirection } from '../../../shared/types';
import { GenericSearchValue } from '../../search/types';
import { DEBT_SEARCH_TEXT } from '../constants';
import {
  EMPTY_DEBT_SEARCH_QUERY,
  fromDebtSearchValue,
  toDebtSearchValue,
} from './debtSearchBridge';
import { DebtSearchParam, DebtSearchQuery } from './debtSearchConfig';

describe('debtSearchBridge', () => {
  test('maps a debt query to generic search value', () => {
    const query: DebtSearchQuery = {
      freeText: 'Jane',
      direction: DebtDirection.YouOweThem,
    };

    expect(toDebtSearchValue(query)).toEqual({
      freeText: 'Jane',
      filters: [
        {
          param: DebtSearchParam.Direction,
          value: DebtDirection.YouOweThem,
          label: 'You owe them',
          group: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
        },
      ],
    });
  });

  test('maps generic search filters back to a debt query', () => {
    const value: GenericSearchValue<DebtSearchParam> = {
      freeText: '  Sam  ',
      filters: [
        {
          param: DebtSearchParam.Direction,
          value: DebtDirection.Settled,
          label: 'Settled',
          group: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
        },
      ],
    };

    expect(fromDebtSearchValue(value)).toEqual({
      freeText: 'Sam',
      direction: DebtDirection.Settled,
    });
  });

  test('returns the empty debt query when filters are absent or invalid', () => {
    const value: GenericSearchValue<DebtSearchParam> = {
      freeText: '   ',
      filters: [
        {
          param: DebtSearchParam.Direction,
          value: 'NotADirection' as DebtDirection,
          label: 'Invalid',
          group: DEBT_SEARCH_TEXT.DIRECTION_LABEL,
        },
      ],
    };

    expect(fromDebtSearchValue(value)).toEqual(EMPTY_DEBT_SEARCH_QUERY);
  });
});
