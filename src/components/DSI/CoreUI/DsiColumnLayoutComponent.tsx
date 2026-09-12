import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiColumnLayoutComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
}

export const Default = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-12">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TwoEqualColumn = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-6">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-6">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThreeEqualColumn = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-4">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-4">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-4">
            <Placeholder name="col-3" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Four_Equal_Column = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-3">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-3">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-3">
            <Placeholder name="col-3" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-3">
            <Placeholder name="col-4" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TwoColumnFourEight = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-4">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-8">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};


export const TwoColumnFiveSeven = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-5">
            <Placeholder name="col-1" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-7">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TwoColumnThreeNine = (props: DsiColumnLayoutComponentProps): JSX.Element => {
  // Get component styles and background style
  // This function extracts styles and background image from the params  
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-col-layout ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-3">
            <Placeholder name="col-3" rendering={props.rendering} />
          </div>
          <div className="col-12 col-lg-9">
            <Placeholder name="col-2" rendering={props.rendering} />
          </div>
        </div>
      </div>
    </div>
  );
};
