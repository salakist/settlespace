import React, { useMemo } from 'react';
import SearchBar from '../../search/components/SearchBar';
import { PERSON_SEARCH_TEXT } from '../constants';
import {
  buildPersonSearchParameters,
  PersonSearchParam,
} from '../search/personSearchConfig';
import {
  EMPTY_PERSON_SEARCH_QUERY,
  fromPersonSearchValue,
  toPersonSearchValue,
} from '../search/personSearchBridge';
import { PersonSearchQuery } from '../search/personSearchTypes';

interface PersonSearchBarProps {
  onSearch: (query: PersonSearchQuery) => void;
  placeholder?: string;
  initialQuery?: PersonSearchQuery;
  action?: React.ReactNode;
  ariaLabel?: string;
}

const PersonSearchBar: React.FC<PersonSearchBarProps> = ({
  onSearch,
  placeholder = PERSON_SEARCH_TEXT.DEFAULT_PLACEHOLDER,
  initialQuery = EMPTY_PERSON_SEARCH_QUERY,
  action,
  ariaLabel = PERSON_SEARCH_TEXT.ARIA_LABEL,
}) => {
  const initialValue = useMemo(() => toPersonSearchValue(initialQuery), [initialQuery]);
  const parameters = useMemo(() => buildPersonSearchParameters(), []);

  return (
    <SearchBar<PersonSearchParam>
      onSearch={(value) => onSearch(fromPersonSearchValue(value))}
      initialValue={initialValue}
      action={action}
      parameters={parameters}
      ariaLabel={ariaLabel}
      freeTextPlaceholder={placeholder}
    />
  );
};

export default PersonSearchBar;
