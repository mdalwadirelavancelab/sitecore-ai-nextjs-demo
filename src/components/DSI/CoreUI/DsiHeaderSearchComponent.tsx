import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';
import { useDsiHeaderSearch } from 'lib/DSI/Common/useDsiHeaderSearch';

interface SearchParams extends ComponentParams {
  MinSuggestionsTriggerCharacterCount: string;
  MaxPredictiveResultsCount: string;
  SearchSiteItem: string;
}

interface DsiHeaderSearchComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: SearchParams;
  fields: {
    SearchButtonText: Field<string>;
    TextBoxPlaceholderText: Field<string>;
    SearchTextBoxLabel: Field<string>;
  };
}

const BASE_API_URL = process.env.DSI_SEARCH_API_URL || 'https://idxdhcp.cm.dev.local';
const DEFAULT_SEARCH_ROOT = '/sitecore/content/JSSTenant/dato-dtc';

/** Keeps the existing CMS fallback rules for blank, zero, or invalid numeric values. */
const getSearchNumber = (value: string | undefined, fallback: number): number =>
  parseInt(value || fallback.toString(), 10) || fallback;

/** Converts the Sitecore rendering params into the shared hook settings. */
const getSearchSettings = (params: SearchParams) => ({
  apiBaseUrl: BASE_API_URL,
  searchSiteItem: params.SearchSiteItem || DEFAULT_SEARCH_ROOT,
  minimumCharacters: getSearchNumber(params.MinSuggestionsTriggerCharacterCount, 3),
  maximumResults: getSearchNumber(params.MaxPredictiveResultsCount, 5),
});

export const Default = (props: DsiHeaderSearchComponentProps): JSX.Element => {
  const { id, styles } = getComponentStyles(props.params);
  // console.log("Site Search: " + props.params.SearchSiteItem);
  return (
    <div className={`component dsi-header-search ${styles}`} id={id ? id : undefined}>
      <div className="component-content">
        {props.fields.SearchTextBoxLabel?.value && (
          <label htmlFor="textBoxSearch">
            <Text field={props.fields.SearchTextBoxLabel} />
          </label>
        )}

        <input type="text" className="search-box-input" name="textBoxSearch" maxLength={100} placeholder={props.fields.TextBoxPlaceholderText?.value || ''} />

        {props.fields.SearchButtonText?.value && (
          <button type="submit" className="header-search-button">
            <Text field={props.fields.SearchButtonText} />
          </button>
        )}

        {/* <p>DsiHeaderSearchComponent Component</p> */}

      </div>
    </div>
  );
};

export const LiveSearch = (props: DsiHeaderSearchComponentProps): JSX.Element => {
  const { id, styles } = getComponentStyles(props.params);
  const { query, setQuery, results, loading, error } = useDsiHeaderSearch({
    ...getSearchSettings(props.params),
    liveSearch: true,
  });

  /** Updates the controlled input; the hook performs the debounced live search. */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div className={`component dsi-header-search ${styles}`} id={id ? id : undefined}>
      <div className="component-content">
        {props.fields.SearchTextBoxLabel?.value && (
          <label htmlFor="textBoxSearch">
            <Text field={props.fields.SearchTextBoxLabel} />
          </label>
        )}

        <input type="text" value={query} onChange={handleChange} className="search-box-input form-control" name="textBoxSearch" maxLength={100}
          placeholder={props.fields.TextBoxPlaceholderText?.value || 'Search...'} />

        {loading && <p className="mt-2">Loading...</p>}
        {error && <p className="error-message text-danger">{error}</p>}

        {/* Live Results */}
        {results.length > 0 && (
          <div className="list-group mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {results.map((item, index) => (
              <a key={index} href={item.ItemUrl || '#'} className="list-group-item list-group-item-action" target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>
                <strong>{item.Title || 'No Title'}</strong>
                <p className="mb-0 small">{item.Description || 'No Description'}</p>
              </a>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="no-results mt-2 text-muted">No results found for "{query}".</div>
        )}
      </div>
    </div>
  );
};


export const SearchWithButton = (props: DsiHeaderSearchComponentProps): JSX.Element => {
  const { id, styles } = getComponentStyles(props.params);
  const { query, setQuery, results, loading, error, search } = useDsiHeaderSearch({
    ...getSearchSettings(props.params),
    clearResultsBeforeSearch: true,
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  /** Runs only when the query meets the CMS minimum-character setting. */
  const handleSearch = () => {
    void search(query);
  };

  return (
    <div className={`component dsi-header-search ${styles}`} id={id ? id : undefined}>
      <div className="component-content">
        {props.fields.SearchTextBoxLabel?.value && (
          <label htmlFor="textBoxSearch">
            <Text field={props.fields.SearchTextBoxLabel} />
          </label>
        )}

        <input type="text" name="textBoxSearch" value={query} onChange={handleChange} maxLength={100}
          placeholder={props.fields.TextBoxPlaceholderText?.value || ''} className="search-box-input" />

        {props.fields.SearchButtonText?.value && (
          <button type="button" className="header-search-button" onClick={handleSearch}>
            <Text field={props.fields.SearchButtonText} />
          </button>
        )}

        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}

        {results.length > 0 && (
          <div className="search-results">
            {results.map((item, index) => (
              <div key={index} className="search-result">
                <h3>{item.Title || 'No Title'}</h3>
                <p>{item.Description || 'No Description'}</p>
                {item.ItemUrl && (
                  <a href={item.ItemUrl} target="_blank" rel="noopener noreferrer" style={{ cursor: 'pointer' }}>
                    View More
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <p>No results found for "{query}".</p>
        )}
      </div>
    </div>
  );
};
