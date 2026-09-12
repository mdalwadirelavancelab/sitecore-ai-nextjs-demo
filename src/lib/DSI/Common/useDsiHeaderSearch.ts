import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

export type DsiHeaderSearchResult = {
  ItemUrl?: string;
  Title?: string;
  Description?: string;
};

type HeaderSearchResponse = {
  IsSuccess?: boolean;
  Data?: {
    HeaderSearchList?: DsiHeaderSearchResult[];
  };
  ErrorMessage?: string;
};

type UseDsiHeaderSearchOptions = {
  apiBaseUrl: string;
  searchSiteItem: string;
  minimumCharacters: number;
  maximumResults: number;
  liveSearch?: boolean;
  clearResultsBeforeSearch?: boolean;
  debounceMilliseconds?: number;
};

type UseDsiHeaderSearchResult = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: DsiHeaderSearchResult[];
  loading: boolean;
  error: string | null;
  search: (searchText: string) => Promise<void>;
};

const DEFAULT_DEBOUNCE_MILLISECONDS = 400;
const DEFAULT_SEARCH_ERROR = 'Search failed.';
const DEFAULT_REQUEST_ERROR = 'An error occurred while searching.';

/**
 * Shared React search behaviour used by the LiveSearch and SearchWithButton variants.
 * Sitecore continues to control the search root and result limits through rendering params.
 */
export const useDsiHeaderSearch = ({
  apiBaseUrl,
  searchSiteItem,
  minimumCharacters,
  maximumResults,
  liveSearch = false,
  clearResultsBeforeSearch = false,
  debounceMilliseconds = DEFAULT_DEBOUNCE_MILLISECONDS,
}: UseDsiHeaderSearchOptions): UseDsiHeaderSearchResult => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DsiHeaderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Sends the existing Sitecore header-search request using the supplied CMS settings. */
  const search = useCallback(
    async (searchText: string) => {
      // LiveSearch originally rejected whitespace after the debounce and cleared its results.
      if (liveSearch && !searchText.trim()) {
        setResults([]);
        return;
      }

      // SearchWithButton originally ignored an invalid query without changing existing results.
      if (!liveSearch && (!searchText || searchText.length < minimumCharacters)) {
        return;
      }

      if (clearResultsBeforeSearch) {
        setResults([]);
      }

      setLoading(true);
      setError(null);

      const searchFilter = {
        SearchText: searchText,
        RootPath: searchSiteItem,
        PageIndex: 0,
        PageSize: maximumResults,
      };

      try {
        const response = await fetch(`${apiBaseUrl}/api/feature/search/headersearch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchFilter),
        });

        const responseData = (await response.json()) as HeaderSearchResponse;

        if (responseData?.IsSuccess) {
          // LiveSearch used optional Data access; SearchWithButton expected Data to be present.
          setResults(
            liveSearch
              ? responseData.Data?.HeaderSearchList || []
              : responseData.Data!.HeaderSearchList || []
          );
        } else {
          if (liveSearch) {
            setResults([]);
            setError(responseData?.ErrorMessage || DEFAULT_SEARCH_ERROR);
          } else {
            setError(responseData.ErrorMessage || DEFAULT_SEARCH_ERROR);
          }
        }
      } catch (requestError: unknown) {
        console.error('Search error:', requestError);
        setError(DEFAULT_REQUEST_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [
      apiBaseUrl,
      clearResultsBeforeSearch,
      liveSearch,
      maximumResults,
      minimumCharacters,
      searchSiteItem,
    ]
  );

  // Keep current values available without making CMS-param changes rerun the original effect.
  const liveSearchSettingsRef = useRef({
    debounceMilliseconds,
    liveSearch,
    minimumCharacters,
    search,
  });
  useEffect(() => {
    liveSearchSettingsRef.current = {
      debounceMilliseconds,
      liveSearch,
      minimumCharacters,
      search,
    };
  }, [debounceMilliseconds, liveSearch, minimumCharacters, search]);

  /**
   * Preserves the original debounce exactly: every query change waits 400 ms, and only the
   * latest timer either searches or clears results when the CMS minimum is not reached.
   */
  useEffect(() => {
    const settings = liveSearchSettingsRef.current;

    if (!settings.liveSearch) {
      return;
    }

    const debounceTimer = setTimeout(() => {
      if (query && query.length >= settings.minimumCharacters) {
        void settings.search(query);
      } else {
        setResults([]);
      }
    }, settings.debounceMilliseconds);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
  };
};
