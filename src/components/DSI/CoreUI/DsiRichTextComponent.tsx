import React, { JSX } from 'react';
import { Field, RichText as JssRichText } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

// --- Type Definitions ---

interface Fields {
  Text: Field<string>;
}

export type DsiRichTextComponentProps = {
  params: { [key: string]: string };
  fields: Fields;
};

// --- Component ---

export const Default = (props: DsiRichTextComponentProps): JSX.Element => {
  const { fields, params } = props;
  const { id, styles, backgroundStyle } = getComponentStyles(params);

  const content = fields?.Text ? (
    <JssRichText field={fields.Text} />
  ) : (
    <span className="is-empty-hint">Rich text</span>
  );

  return (
    <div className={`component rich-text dsi-richtext ex-rich-text ${styles}`} id={id || undefined}>
      <div className="component-content" style={backgroundStyle}>
        {content}
      </div>
    </div>
  );
};
