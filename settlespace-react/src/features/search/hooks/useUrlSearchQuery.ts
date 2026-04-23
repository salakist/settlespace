import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

function useUrlSearchQuery<TQuery>(
  parse: (params: URLSearchParams) => TQuery,
  serialize: (query: TQuery) => URLSearchParams,
): [TQuery, (query: TQuery) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsedQuery = useMemo(() => parse(searchParams), [parse, searchParams]);

  const setQueryToUrl = useCallback(
    (query: TQuery) => {
      setSearchParams(serialize(query));
    },
    [serialize, setSearchParams],
  );

  return [parsedQuery, setQueryToUrl];
}

export default useUrlSearchQuery;
