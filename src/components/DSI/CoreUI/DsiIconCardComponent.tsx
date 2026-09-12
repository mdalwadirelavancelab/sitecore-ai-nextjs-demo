import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, ImageField, Image, RichText, Link, LinkField } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiIconCardComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    CardIcon: ImageField;
    MobileCardIcon: ImageField;
    CardTitle: Field<string>;
    CardBody: Field<string>;
    CardFooterText: Field<string>;
    CardLink: LinkField;
    CardLinkText: Field<string>;
  }
}

export const Default = (props: DsiIconCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="card-icon field-cardicon">
          <Image field={props.fields.CardIcon} />
        </div>
        <div className="mobilecard-icon field-mobilecardicon">
          <Image field={props.fields.MobileCardIcon} />
        </div>
        <div className="field-cardfootertext">
          <RichText field={props.fields.CardFooterText} />
        </div>
        <div>
          <div className="field-cardbody">
            <RichText field={props.fields.CardBody} />
          </div>
          <div className="field-cardtitle">
            <RichText field={props.fields.CardTitle} />
          </div>
          <div className="field-cardlink">
            <Link field={props.fields.CardLink} className="font-weight-bold" />
          </div>
          <div className="field-cardlinktext">
            <RichText field={props.fields.CardLinkText} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TopIconBottomText = (props: DsiIconCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-icon-card dsi-rv-top-icon-bottom-text ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div>
          <div className="icon-wrapper">
            <div className="card-icon field-cardicon">
              <Image field={props.fields.CardIcon} />
            </div>
          </div>
          <div>
            <div className="field-cardtitle">
              <RichText field={props.fields.CardTitle} />
            </div>
            <div className="field-cardbody">
              <RichText field={props.fields.CardBody} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Left_Icon_Right_Text = (props: DsiIconCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-icon-card dsi-rv-left-icon-right-text ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="icon-wrapper">
          <div className="card-icon field-cardicon">
            <Image field={props.fields.CardIcon} />
          </div>
        </div>
        <div>
          <div className="field-cardtitle">
            <RichText field={props.fields.CardTitle} />
          </div>
          <div className="field-cardbody">
            <RichText field={props.fields.CardBody} />
          </div>
        </div>
      </div>
    </div>
  );
};
