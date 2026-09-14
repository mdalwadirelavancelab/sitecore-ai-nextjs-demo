import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, LinkField, Link as ContentSdkLink, } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiLinkComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields?: {
    Link?: LinkField;
  };
}

export const Default = (props: DsiLinkComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component link dsi-link ${styles}`} id={id || undefined}>
      <div className="component-content" style={backgroundStyle}>
        {props.fields?.Link && <ContentSdkLink field={props.fields.Link} />}
      </div>
    </div>
  );
};
