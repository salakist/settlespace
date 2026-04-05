import React, { useMemo } from 'react';
import SearchBar from '../../search/components/SearchBar';
import { DEBT_SEARCH_TEXT } from '../constants';
import {
  EMPTY_DEBT_SEARCH_QUERY,
  fromDebtSearchValue,
  toDebtSearchValue,
} from '../search/debtSearchBridge';
import {
  buildDebtSearchParameters,
  DebtSearchParam,
  DebtSearchQuery,
} from '../search/debtSearchConfig';

interface DebtSearchBarProps {
  onSearch: (query: DebtSearchQuery) => void;
  initialQuery?: DebtSearchQuery;
  action?: React.ReactNode;
}

const DebtSearchBar: React.FC<DebtSearchBarProps> = ({
  onSearch,
  initialQuery = EMPTY_DEBT_SEARCH_QUERY,
  action,
}) => {
  const initialValue = useMemo(() => toDebtSearchValue(initialQuery), [initialQuery]);
  const parameters = useMemo(() => buildDebtSearchParameters(), []);

  return (
    <SearchBar<DebtSearchParam>
      onSearch={(value) => onSearch(fromDebtSearchValue(value))}
      initialValue={initialValue}
      action={action}
      parameters={parameters}
      ariaLabel={DEBT_SEARCH_TEXT.ARIA_LABEL}
      freeTextPlaceholder={DEBT_SEARCH_TEXT.DEFAULT_PLACEHOLDER}
    />
  );
};

export default DebtSearchBar;
