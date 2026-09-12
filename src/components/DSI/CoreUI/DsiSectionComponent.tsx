import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Page, AppPlaceholder } from '@sitecore-content-sdk/nextjs';
import componentMap from '.sitecore/component-map';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiSectionComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  page: Page;
}

export const Default = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <AppPlaceholder page={props.page} componentMap={componentMap} name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const FixedWidth = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section container ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <AppPlaceholder page={props.page} componentMap={componentMap} name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const FullPageWidth = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section container-fluid ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <AppPlaceholder page={props.page} componentMap={componentMap} name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const EmptyPlaceholder = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <AppPlaceholder page={props.page} componentMap={componentMap} name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};
