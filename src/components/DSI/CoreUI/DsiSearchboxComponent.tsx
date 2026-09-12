import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, Text, } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface SearchboxComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    searchTextBoxLabel?: Field<string>;
    searchTextBoxText?: Field<string>;
    searchButtonText?: Field<string>;
  };
  // Extra props for runtime logic (optional, can be injected via GraphQL/Layout Service)
  searchTextBoxVisible?: boolean;
  isControlEditable?: boolean;
  label?: string;
  searchResultPageUrl?: string;
  jsonDataProperties?: Record<string, unknown>;
}

export const Default = (props: SearchboxComponentProps): JSX.Element => {
  const { id, styles } = getComponentStyles(props.params);
  const { searchTextBoxVisible = true, isControlEditable = false, label, searchResultPageUrl, jsonDataProperties, } = props;

  const dataProperties = jsonDataProperties ? JSON.stringify(jsonDataProperties) : '{}';
  return (
    <div className={`component search-box ${styles}`} id={id ? id : undefined} data-properties={dataProperties}    >
      <div className="component-content">
        {/* Render label if visible or editable */}
        {searchTextBoxVisible && (
          <>
            {(isControlEditable || label) && props.fields.searchTextBoxLabel && (
              <label htmlFor="textBoxSearch">
                <Text field={props.fields.searchTextBoxLabel} tag="span" />
              </label>
            )}

            {/* Input field */}
            <input type="text" className="search-box-input" autoComplete="off" name="textBoxSearch" maxLength={100} placeholder={props.fields.searchTextBoxText?.value || ''} />
          </>
        )}

        {/* Button based on presence of URL */}
        {props.fields.searchButtonText?.value && (
          <button type="submit" className={searchResultPageUrl ? 'search-box-button-with-redirect' : 'search-box-button'}          >
            <Text field={props.fields.searchButtonText} />
          </button>
        )}
      </div>
    </div>
  );
};
