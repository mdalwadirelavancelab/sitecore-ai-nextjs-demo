import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, ImageField, Image, RichText, Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiPromoCardComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    PromoText: Field<string>;
    PromoImage: ImageField;
    PromoLink: LinkField;
    PromoText2: Field<string>;
    PromoImage2: ImageField;
    PromoLink2: LinkField;
    PromoText3: Field<string>;
    PromoImage3: ImageField;
    PromoLink3: LinkField;
    PromoText4: Field<string>;
    PromoImage4: ImageField;
    PromoLink4: LinkField;
    PromoLinkAttributes: any
  }
}

// Function to check if the image source is valid
// This function checks if the image source is defined and not a default placeholder image
const isValidImage = (src?: string) =>
  src && !src.includes('default_image.svg');

export const Default = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div>
          <div className="card-icon field-promotext">
            <RichText field={props.fields.PromoText} />
          </div>
          <div className="field-promoimage">
            <Image field={props.fields.PromoImage} />
          </div>
          <div className="field-promolink">
            <Link field={props.fields.PromoLink} className="font-weight-bold" />
          </div>
        </div>
        <div>
          {props.fields.PromoText2?.value && (
            <div className="card-icon field-promotext2">
              <RichText field={props.fields.PromoText2} />
            </div>
          )}
          {isValidImage(props.fields.PromoImage2?.value?.src) && (
            <div className="field-promoimage2">
              <Image field={props.fields.PromoImage2} />
            </div>
          )}
          {props.fields.PromoLink2?.value?.href && (
            <div className="field-promolink2">
              <Link field={props.fields.PromoLink2} className="font-weight-bold" />
            </div>
          )}
        </div>
        <div>
          {props.fields.PromoText3?.value && (
            <div className="card-icon field-promotext3">
              <RichText field={props.fields.PromoText3} />
            </div>
          )}
          {isValidImage(props.fields.PromoImage3?.value?.src) && (
            <div className="field-promoimage3">
              <Image field={props.fields.PromoImage3} />
            </div>
          )}
          {props.fields.PromoLink3?.value?.href && (
            <div className="field-promolink3">
              <Link field={props.fields.PromoLink3} className="font-weight-bold" />
            </div>
          )}
        </div>
        <div>
          {props.fields.PromoText4?.value && (
            <div className="card-icon field-promotext4">
              <RichText field={props.fields.PromoText4} />
            </div>
          )}
          {isValidImage(props.fields.PromoImage4?.value?.src) && (
            <div className="field-promoimage4">
              <Image field={props.fields.PromoImage4} />
            </div>
          )}
          {props.fields.PromoLink4?.value?.href && (
            <div className="field-promolink4">
              <Link field={props.fields.PromoLink4} className="font-weight-bold" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LeftImgWithMobileImgAndRightTextLeftFiveRightSeven = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-5">
            <div className="field-promoimage">
              <Image field={props.fields.PromoImage} />
            </div>
            <div className="field-promoimage2">
              <Image field={props.fields.PromoImage2} />
            </div>
            <div className="field-promotext2">Not actual patients.</div>
          </div>
          <div className="col-12 col-lg-7">
            <div className="field-promotext">
              <RichText field={props.fields.PromoText} />
            </div>
            <Link className={`font-weight-bold ${props.fields.PromoLink.value?.class || ''}`} field={props.fields.PromoLink} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const Left_Eight_TextLink_Right_Four_ImageWithMobileImage = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-8">
            <div className="field-promotext">
              <RichText field={props.fields.PromoText} />
            </div>
            <Link field={props.fields.PromoLink} />
          </div>
          <div className="col-12 col-lg-4">
            <div className="desktopOnly field-promoimage">
              <Image field={props.fields.PromoImage} />
            </div>
            <div className="mobileOnly field-promoimage2">
              <Image field={props.fields.PromoImage2} />
            </div>
            <div className="field-promotext2">
              <RichText field={props.fields.PromoText2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Left_Four_ImageWithLink_And_Right_Eight_Text = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-4">
            <div className="field-promoimage">
              {props.fields.PromoLink?.value?.href ? (
                <a href={props.fields.PromoLink.value.href} target={props.fields.PromoLink.value.target || '_self'}>
                  <Image field={props.fields.PromoImage} />
                </a>
              ) : (
                <Image field={props.fields.PromoImage} />
              )}
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="field-promotext">
              <Link field={props.fields.PromoLink} />
              <RichText field={props.fields.PromoText} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VerticalCenterImage_TopBottomText_SideEffectPage = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-12">
            <div className="field-promotext">
              <RichText field={props.fields.PromoText} />
            </div>
          </div>
          <div className="col-12 col-lg-12 img-popup">
            <div className="img-link field-promoimage">
              {isValidImage(props.fields.PromoImage?.value?.src) ? (
                <div className="field-promoimage">
                  <a href={props.fields.PromoImage?.value?.src}>
                    <Image field={props.fields.PromoImage} />
                  </a>
                </div>
              ) : (
                <div className="field-promoimage">
                  <Image field={props.fields.PromoImage} />
                </div>
              )}
            </div>
            <div className="img-link field-promoimage2">
              {isValidImage(props.fields.PromoImage2?.value?.src) ? (
                <div className="field-promoimage2">
                  <a href={props.fields.PromoImage2?.value?.src}>
                    <Image field={props.fields.PromoImage2} />
                  </a>
                </div>
              ) : (
                <div className="field-promoimage2">
                  <Image field={props.fields.PromoImage2} />
                </div>
              )}
            </div>
          </div>
          <div className="col-12 col-lg-12">
            <div className="field-promotext2">
              <RichText field={props.fields.PromoText2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Vertical_CenterImage_TopBottomText = (props: DsiPromoCardComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-promo-card ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="row">
          <div className="col-12 col-lg-12">
            <div className="field-promotext">
              <RichText field={props.fields.PromoText} />
            </div>
          </div>
          <div className="col-12 col-lg-12">
            {isValidImage(props.fields.PromoImage?.value?.src) ? (
              <div className="field-promoimage">
                <a href={props.fields.PromoImage?.value?.src}>
                  <Image field={props.fields.PromoImage} />
                </a>
              </div>
            ) : (
              <div className="field-promoimage">
                <Image field={props.fields.PromoImage} />
              </div>
            )}

            {isValidImage(props.fields.PromoImage2?.value?.src) ? (
              <div className="field-promoimage2">
                <a href={props.fields.PromoImage2?.value?.src}>
                  <Image field={props.fields.PromoImage2} />
                </a>
              </div>
            ) : (
              <div className="field-promoimage2">
                <Image field={props.fields.PromoImage2} />
              </div>
            )}

          </div>
          <div className="col-12 col-lg-12">
            <div className="field-promotext2">
              <RichText field={props.fields.PromoText2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
