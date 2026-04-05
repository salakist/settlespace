import React, { useMemo } from 'react';
import GenericSearchBar from '../../search/components/GenericSearchBar';
import { GenericSearchValue } from '../../search/types';

interface PersonSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  action?: React.ReactNode;
  ariaLabel?: string;
}

function buildInitialValue(initialQuery: string): GenericSearchValue {
  const trimmedQuery = initialQuery.trim();

  return {
    filters: [],
    ...(trimmedQuery ? { freeText: trimmedQuery } : {}),
  };
}

const PersonSearchBar: React.FC<PersonSearchBarProps> = ({
  onSearch,
  placeholder = 'Search by first or last name',
  initialQuery = '',
  action,
  ariaLabel = 'Search',
}) => {
  const initialValue = useMemo(() => buildInitialValue(initialQuery), [initialQuery]);

  return (
    <GenericSearchBar
      onSearch={(value) => onSearch(value.freeText ?? '')}
      initialValue={initialValue}
      action={action}
      ariaLabel={ariaLabel}
      freeTextPlaceholder={placeholder}
    />
  );
};

export default PersonSearchBar;
