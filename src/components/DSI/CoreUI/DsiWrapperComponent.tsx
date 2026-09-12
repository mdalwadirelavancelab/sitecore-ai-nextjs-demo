import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Page, AppPlaceholder } from '@sitecore-content-sdk/nextjs';
import componentMap from '.sitecore/component-map';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiWrapperComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  page: Page;
}

export const Default = (props: DsiWrapperComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-wrapper ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <AppPlaceholder page={props.page} componentMap={componentMap} name="wrapper" rendering={props.rendering} />
      </div>
    </div>
  );
};
