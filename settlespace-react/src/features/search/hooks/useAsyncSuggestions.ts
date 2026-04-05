import { useEffect, useRef, useState } from 'react';
import { AppliedSearchFilter, AsyncSearchParameterConfig } from '../types';
import { AutocompleteSearchOption, buildAsyncAutocompleteOptions } from '../utils/searchHelpers';

interface UseAsyncSuggestionsArgs<TParam extends string> {
  activeFilters: AppliedSearchFilter<TParam>[];
  inputValue: string;
  pendingParameter: AsyncSearchParameterConfig<TParam> | null;
}

export function useAsyncSuggestions<TParam extends string = string>({
  activeFilters,
  inputValue,
  pendingParameter,
}: UseAsyncSuggestionsArgs<TParam>) {
  const [asyncOptions, setAsyncOptions] = useState<AutocompleteSearchOption<TParam>[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!pendingParameter) {
      setAsyncOptions([]);
      setLoadingSuggestions(false);
      return;
    }

    const query = inputValue.trim();
    const minChars = pendingParameter.minChars ?? 1;
    if (query.length < minChars) {
      setAsyncOptions([]);
      setLoadingSuggestions(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoadingSuggestions(true);

    const timeoutId = globalThis.setTimeout(async () => {
      try {
        const suggestions = await pendingParameter.getSuggestions(query);
        if (requestIdRef.current !== requestId) {
          return;
        }

        setAsyncOptions(buildAsyncAutocompleteOptions(pendingParameter, activeFilters, suggestions));
      } catch {
        if (requestIdRef.current === requestId) {
          setAsyncOptions([]);
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoadingSuggestions(false);
        }
      }
    }, pendingParameter.debounceMs ?? 250);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [activeFilters, inputValue, pendingParameter]);

  return { asyncOptions, loadingSuggestions };
}
