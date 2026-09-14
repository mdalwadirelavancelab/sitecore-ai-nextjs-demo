'use client';

import React, { JSX, MouseEvent } from 'react';
import {
  Field,
  ImageField,
  Image,
  RichText,
  Link,
  LinkField,
  ComponentParams,
  ComponentRendering,
  useSitecore,
} from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';
import {
  getDsiCarouselBoolean,
  getDsiCarouselNavigation,
  getDsiCarouselTimeout,
  getDsiCarouselTransition,
  useDsiCarousel,
} from 'lib/DSI/Common/useDsiCarousel';

type ChildRenderingProps = {
  name: string;
  fields: {
    SlideImage: ImageField;
    SlideText: Field<string>;
    SlideLink: LinkField;
  };
};

interface CarouselParams extends ComponentParams {
  Navigation: string;
  Transition: string;
  Timeout: string;
  PauseOnHover: string;
}

interface DsiCarouselComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: CarouselParams;
  fields: {
    items: ChildRenderingProps[];
  };
}

export const Default = (props: DsiCarouselComponentProps): JSX.Element => {
  const { page } = useSitecore();
  const isEditing = page.mode.isEditing;
  const { id, styles } = getComponentStyles(props.params);
  const carouselId = id || `carousel-${props.rendering.uid}`;
  const _id = id || props.rendering.uid;
  const slides = props.fields?.items ?? [];

  // Convert Sitecore parameter item names into the values used by the SXA-style behaviour.
  const navigationType = getDsiCarouselNavigation(props.params?.Navigation);
  const transition = getDsiCarouselTransition(props.params?.Transition);
  const pauseOnHover = getDsiCarouselBoolean(props.params?.PauseOnHover);
  const slideDisplayTime = getDsiCarouselTimeout(props.params?.Timeout);

  // All interaction state lives in the shared React hook so Default and future variants can reuse it.
  const {
    showPrevious,
    showNext,
    rootRef,
    wrapperRef,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    activeIndex,
    getSlideStyle,
    slideInfoMinHeight,
    handleNavigationFocus,
    handleNavigationBlur,
    goToSlide,
    handleNavigationKeyDown,
  } = useDsiCarousel({
    slideCount: slides.length,
    timeout: slideDisplayTime,
    pauseOnHover,
    transition,
  });

  const showsPreviousNext =
    navigationType === 'bullets-prevnext' ||
    navigationType === 'numbers-prevnext' ||
    navigationType === 'prevnext';
  const showsSlideNavigation =
    navigationType === 'bullets' ||
    navigationType === 'bullets-prevnext' ||
    navigationType === 'numbers' ||
    navigationType === 'numbers-prevnext';
  const showsNumbers = navigationType === 'numbers' || navigationType === 'numbers-prevnext';

  const handlePrevious = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    showPrevious();
  };

  const handleNext = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    showNext();
  };

  return (
    <div
      ref={rootRef}
      className={`component dsi-carousel carousel ${styles}`}
      id={_id}
      data-timeout={slideDisplayTime}
      data-pause={pauseOnHover}
      data-navigation={navigationType}
      data-transition={transition}
    >
      <div className="component-content">
        <div className="carousel-inner" id={carouselId}>
          <div
            ref={wrapperRef}
            className="wrapper"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            {isEditing && slides.length === 0 && (
              <div className="carousel-editing-placeholder">
                <Image
                  field={{ value: { src: '/DSI/CoreUI/images/default-image.svg', alt: '' } }}
                  editable={false}
                />
                <p>Carousel — select a datasource and add slides.</p>
              </div>
            )}
            <ul className="slides">
              {slides.map((item, index) => (
                <li
                  key={index}
                  className={`slide ${index === activeIndex ? 'active' : ''}`}
                  style={getSlideStyle(index)}
                >
                  <div className="row">
                    <div className="component content col-12">
                      <div className="component-content">
                        <div className="field-slideimage">
                          {isEditing && !item.fields.SlideImage?.value?.src && (
                            <div className="carousel-editing-placeholder">
                              <Image
                                field={{ value: { src: '/DSI/CoreUI/images/default-image.svg', alt: '' } }}
                                editable={false}
                              />
                              <p>Carousel slide — select an image.</p>
                            </div>
                          )}
                          <Image field={item.fields.SlideImage} />
                        </div>
                        <div
                          className="slide-info"
                          style={
                            slideInfoMinHeight
                              ? { minHeight: `${slideInfoMinHeight}px` }
                              : undefined
                          }
                        >
                          <div className="field-slidetext">
                            <RichText field={item.fields.SlideText} />
                          </div>
                          <div className="field-slidelink">
                            <Link field={item.fields.SlideLink} className="font-weight-bold" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Keep the Sitecore SXA navigation classes so all existing Carousel CSS still applies. */}
            {navigationType !== 'none' && !(isEditing && slides.length === 0) && (
              <div
                className="nav"
                onFocusCapture={handleNavigationFocus}
                onBlurCapture={handleNavigationBlur}
              >
                {showsPreviousNext && (
                  <a
                    href="#"
                    className="prev-text"
                    aria-label="Previous"
                    onClick={handlePrevious}
                  ></a>
                )}

                {showsSlideNavigation && (
                  <div className="nav-items">
                    {slides.map((_item, index) => {
                      const isActive = index === activeIndex;
                      return (
                        <div
                          key={index}
                          tabIndex={isActive ? 0 : -1}
                          className={`${showsNumbers ? 'sxa-numbers' : 'sxa-bullets'} ${
                            isActive ? 'active' : ''
                          }`}
                          aria-current={isActive}
                          aria-label={`Show slide ${index + 1}`}
                          onClick={() => goToSlide(index)}
                          onKeyDown={(event) => handleNavigationKeyDown(event, index)}
                        >
                          {showsNumbers ? index + 1 : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                {showsPreviousNext && (
                  <a href="#" className="next-text" aria-label="Next" onClick={handleNext}></a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
