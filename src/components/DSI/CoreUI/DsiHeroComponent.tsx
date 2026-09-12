import React, { JSX } from 'react';
import { ComponentParams, ComponentRendering, Field, ImageField, Image, RichText, Link, LinkField } from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

interface DsiHeroComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    HeroTitle: Field<string>;
    HeroSubtitle: Field<string>;
    HeroImage: ImageField;
    HeroLink: LinkField;
    HeroMeta1: Field<string>;
    HeroMeta2: Field<string>;
    HeroDesktopImage: ImageField;
    HeroMobileImage: ImageField;
  }
}

export const Default = (props: DsiHeroComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-hero ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="dsi-inner-hero">
          <div className="container">
            <Image className="HeroDesktopImage" field={props.fields.HeroDesktopImage} />
            <Image className="HeroMobileImage" field={props.fields.HeroMobileImage} />
            <h1 className="dsi_page_hero_title">
              <RichText field={props.fields.HeroTitle} />
            </h1>
            <h3 className="dsi_page_hero_subtitle">
              <RichText field={props.fields.HeroSubtitle} />
            </h3>
            <Link field={props.fields.HeroLink} className="font-weight-bold" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MainHero = (props: DsiHeroComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-hero ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="rv-dsi-main-hero">
          <div className="dsi_main_hero_image_row">
            <div className="dsi_main_hero_desktop_image field-herodesktopimage">
              <Image className="HeroDesktopImage" field={props.fields.HeroDesktopImage} />
            </div>
            <div className="dsi_main_hero_mobile_image field-heromobileimage">
              <Image className="HeroMobileImage" field={props.fields.HeroMobileImage} />
            </div>
          </div>
          <div></div>
          <div className="dsi_main_hero_title_row">
            <div className="dsi_main_hero_title field-herotitle">
              <RichText field={props.fields.HeroTitle} />
            </div>
            <div className="dsi_main_hero_subtitle field-herosubtitle">
              <RichText field={props.fields.HeroSubtitle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DatoDTCBigBannerVideoHero = (props: DsiHeroComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-hero ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="rv-dsi-main-hero">
          <div className="dsi_main_hero_image_row">
            <div className="dsi_main_hero_desktop_image field-herodesktopimage">
              <Image className="HeroDesktopImage" field={props.fields.HeroDesktopImage} />
            </div>
            <div className="dsi_main_hero_mobile_image field-heromobileimage">
              <Image className="HeroMobileImage" field={props.fields.HeroMobileImage} />
            </div>
            <div className="video-section field-herometa1">
              <RichText field={props.fields.HeroMeta1} />
            </div>
          </div>
          <div className="dsi_main_hero_title_row">
            <div className="dsi_main_hero_title field-herotitle">
              <RichText field={props.fields.HeroTitle} />
            </div>
          </div>
          <div className="dsi_main_hero_subtitle_row">
            <div className="dsi_main_hero_subtitle hero-button field-herosubtitle">
              <RichText field={props.fields.HeroSubtitle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DatoDTCSmallBannerVideoHero = (props: DsiHeroComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-hero dsi-inner-hero ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="inner-banner-video">
          <div className="dsi_page_hero_herometa1">
            <RichText field={props.fields.HeroMeta1} />
          </div>
        </div>

        <div className="inner-banner-content">
          <div className="container">
            <div className="dsi_page_hero_title">
              <RichText field={props.fields.HeroTitle} />
            </div>
          </div>
          <div className="container">
            <span className="dsi_page_hero_subtitle">
              <RichText field={props.fields.HeroSubtitle} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Hero_Splash_IdxdHCP = (props: DsiHeroComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  return (
    <div className={`component dsi-hero ${styles}`} id={id ? id : undefined}>
      <div className="component-content" style={backgroundStyle}>
        <div className="rv-dsi-splash-hero">
          <div className="dsi_main_hero_image_row">
            <div className="dsi_main_hero_image_row">
              <div className="dsi_main_hero_desktop_image field-herodesktopimage">
                <Image className="HeroDesktopImage" field={props.fields.HeroDesktopImage} />
              </div>
              <div className="dsi_main_hero_mobile_image field-heromobileimage">
                <Image className="HeroMobileImage" field={props.fields.HeroMobileImage} />
              </div>
            </div>
          </div>
          <div className="dsi_main_hero_title_row">
            <div className="dsi_main_hero_title field-herotitle">
              <RichText field={props.fields.HeroTitle} />
            </div>
          </div>
          <div className="dsi_main_hero_subtitle_row">
            <div className="hero-button field-herosubtitle">
              <RichText field={props.fields.HeroSubtitle} />
            </div>
          </div>
          <div className="dsi_main_hero_link_row">
            <Link field={props.fields.HeroLink} className="font-weight-bold" />
          </div>
          <div className="dsi_main_hero_Meta1_row">
            <div className="hero-button field-herometa1">
              <RichText field={props.fields.HeroMeta1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
