import React, { useMemo } from 'react';
import { Person } from '../../../shared/types';
import { TransactionSearchQuery } from '../types';
import SearchBar from '../../search/components/SearchBar';
import { AppliedSearchFilter } from '../../search/types';
import {
  buildTransactionParameters,
  TransactionSearchParam,
} from '../search/transactionSearchConfig';
import { TRANSACTION_SEARCH_TEST_IDS, TRANSACTION_SEARCH_TEXT } from '../constants';
import {
  EMPTY_TRANSACTION_SEARCH_QUERY,
  fromTransactionSearchValue,
  toTransactionSearchValue,
} from '../search/transactionSearchBridge';

export type SearchFilterOption = AppliedSearchFilter<TransactionSearchParam>;

interface TransactionSearchBarProps {
  onSearch: (query: TransactionSearchQuery) => void;
  initialQuery?: TransactionSearchQuery;
  action?: React.ReactNode;
  persons?: Person[];
}

const TransactionSearchBar: React.FC<TransactionSearchBarProps> = ({
  onSearch,
  initialQuery = EMPTY_TRANSACTION_SEARCH_QUERY,
  action,
  persons,
}) => {
  const initialValue = useMemo(
    () => toTransactionSearchValue(initialQuery, persons),
    [initialQuery, persons],
  );

  const parameters = useMemo(() => buildTransactionParameters(), []);

  return (
    <SearchBar<TransactionSearchParam>
      onSearch={(value) => onSearch(fromTransactionSearchValue(value))}
      initialValue={initialValue}
      action={action}
      parameters={parameters}
      ariaLabel={TRANSACTION_SEARCH_TEXT.ARIA_LABEL}
      freeTextPlaceholder={TRANSACTION_SEARCH_TEXT.DEFAULT_PLACEHOLDER}
      dataTestId={TRANSACTION_SEARCH_TEST_IDS.AUTOCOMPLETE}
    />
  );
};

export default TransactionSearchBar;
