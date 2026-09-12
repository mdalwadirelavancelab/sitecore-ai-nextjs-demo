import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiSectionComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const Default = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <Placeholder name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const FixedWidth = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section container ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <Placeholder name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const FullPageWidth = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section container-fluid ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <Placeholder name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};

export const EmptyPlaceholder = (props: DsiSectionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-section ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <Placeholder name="section" rendering={props.rendering} />
      </div>
    </div>
  );
};
