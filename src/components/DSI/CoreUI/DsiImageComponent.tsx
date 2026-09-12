import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, ImageField, Image, LinkField, Text, } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiImageComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    Image: ImageField;
    ImageCaption: Field<string>;
    TargetUrl: LinkField;
  };
}

//Check if image source is valid (not default/empty)
const isValidImage = (src?: string): boolean => !!src && !src.includes('default_image.svg') && !src.includes('scEmptyImage');

//Check if link field is set
const hasLink = (link?: LinkField): boolean => !!link?.value?.href;

export const Default = (props: DsiImageComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);
  const { Image: imageField, ImageCaption } = props.fields;

  const imageSrc = imageField?.value?.src;

  return (
    <div className={`component dsi-image ${styles}`.trim()} id={id || undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="field-image">
          {isValidImage(imageSrc) ? (
            <Image field={imageField} />
          ) : (
            <Image field={imageField} />
          )}
        </div>

        <Text tag="span" className="image-caption field-imagecaption" field={ImageCaption} />
      </div>
    </div>
  );
};

export const Linked_Image = (props: DsiImageComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);
  const { Image: imageField, ImageCaption, TargetUrl } = props.fields;

  const imageSrc = imageField?.value?.src;
  const linkHref = TargetUrl?.value?.href;
  const linkTarget = TargetUrl?.value?.target || '_self';

  return (
    <div className={`component dsi-image ${styles}`.trim()} id={id || undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="field-image">
          {isValidImage(imageSrc) && hasLink(TargetUrl) ? (
            <a href={linkHref} target={linkTarget}>
              <Image field={imageField} />
            </a>
          ) : (
            <Image field={imageField} />
          )}
        </div>

        <Text tag="span" className="image-caption field-imagecaption" field={ImageCaption} />
      </div>
    </div>
  );
};
