import React, { useMemo } from 'react';
import { TransactionSearchQuery } from '../../../shared/api/transactionApi';
import { Person } from '../../../shared/types';
import GenericSearchBar from '../../search/components/GenericSearchBar';
import { AppliedSearchFilter } from '../../search/types';
import {
  buildTransactionParameters,
  TransactionSearchParam,
  TRANSACTION_SEARCH_PLACEHOLDER,
} from '../search/transactionSearchConfig';
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
    <GenericSearchBar<TransactionSearchParam>
      onSearch={(value) => onSearch(fromTransactionSearchValue(value))}
      initialValue={initialValue}
      action={action}
      parameters={parameters}
      ariaLabel="Transaction search"
      freeTextPlaceholder={TRANSACTION_SEARCH_PLACEHOLDER}
      dataTestId="transaction-search-autocomplete"
    />
  );
};

export default TransactionSearchBar;
