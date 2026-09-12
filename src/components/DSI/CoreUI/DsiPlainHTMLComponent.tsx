import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiPlainHTMLComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    HtmlCode: Field<string>;
  }
}

export const Default = (props: DsiPlainHTMLComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);
  const rawHtml = props.fields?.HtmlCode?.value;

  if (!rawHtml?.trim()) {
    return <></>;
  }

  // Normalize line endings
  const normalizedHtml = rawHtml.replace(/\r\n/g, '\n');

  return (
    <div className={`component plain-html ${styles}`} id={id ? id : undefined}>
      {/* <div className="component-content" style={backgroundStyle}> */}
      {/* <Text field={props.fields.HtmlCode} /> */}
      {/* <RichText field={props.fields.HtmlCode} /> */}
      <div className="component-content" style={backgroundStyle} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: normalizedHtml }} />
      {/* </div> */}
    </div>
  );
};
