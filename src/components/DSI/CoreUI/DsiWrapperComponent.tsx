import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiWrapperComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const Default = (props: DsiWrapperComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-wrapper ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <Placeholder name="wrapper" rendering={props.rendering} />
      </div>
    </div>
  );
};
