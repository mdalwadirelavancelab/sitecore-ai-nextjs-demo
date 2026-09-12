'use client';

import React, { CSSProperties, JSX, useEffect, useRef, useState } from 'react';
import { Field, RichText, ComponentParams, ComponentRendering } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

type ChildRenderingProps = {
  name: string;
  fields: {
    Heading: Field<string>;
    Content: Field<string>;
  };
};

interface AccordionParams extends ComponentParams {
  CanOpenMultiple: string;
  ExpandedByDefault: string;
  ExpandOnHover: string;
  Speed: string;
}

interface DsiAccordionComponentProps {
  rendering: ComponentRendering & { params: AccordionParams };
  params: AccordionParams;
  fields: {
    items: ChildRenderingProps[];
  };
}

interface AccordionOptions {
  canOpenMultiple: boolean;
  expandedByDefault: boolean;
  expandOnHover: boolean;
}

// Sitecore checkbox parameters can arrive as either "1" or "true".
const parseSitecoreBoolean = (value?: string): boolean =>
  value === '1' || String(value).toLowerCase() === 'true';

// Use the CMS animation speed when it is valid; otherwise keep the existing 400ms default.
const parseAnimationSpeed = (value?: string): number => {
  const parsedSpeed = Number.parseInt(value || '', 10);
  return parsedSpeed > 0 ? parsedSpeed : 400;
};

// ExpandedByDefault opens only the first item, matching the previous jQuery behavior.
const getDefaultOpenItems = (
  itemCount: number,
  expandedByDefault: boolean
): Set<number> => (
  expandedByDefault && itemCount > 0 ? new Set([0]) : new Set()
);

/**
 * Keeps the reusable Accordion behavior outside of the Default variant while
 * keeping all component logic in one file for future Sitecore variants.
 */
function useAccordion(itemCount: number, options: AccordionOptions) {
  const { canOpenMultiple, expandedByDefault, expandOnHover } = options;

  // A Set supports both one-open and multiple-open Accordion configurations.
  const [openItemIndexes, setOpenItemIndexes] = useState<Set<number>>(
    () => getDefaultOpenItems(itemCount, expandedByDefault)
  );

  // Track focus and hover separately so the existing "show" CSS class is preserved.
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  const [previousOptions, setPreviousOptions] = useState({
    itemCount,
    expandedByDefault,
    canOpenMultiple,
  });

  // Apply CMS option changes before rendering children, without effect-driven resets.
  if (
    previousOptions.itemCount !== itemCount ||
    previousOptions.expandedByDefault !== expandedByDefault ||
    previousOptions.canOpenMultiple !== canOpenMultiple
  ) {
    const resetDefault =
      previousOptions.itemCount !== itemCount ||
      previousOptions.expandedByDefault !== expandedByDefault;
    const restrictOpenItems = previousOptions.canOpenMultiple !== canOpenMultiple && !canOpenMultiple;
    setPreviousOptions({ itemCount, expandedByDefault, canOpenMultiple });
    setOpenItemIndexes((currentIndexes) => {
      const nextIndexes = resetDefault
        ? getDefaultOpenItems(itemCount, expandedByDefault)
        : currentIndexes;
      return restrictOpenItems && nextIndexes.size > 1
        ? new Set([Math.min(...nextIndexes)])
        : nextIndexes;
    });
  }

  // Open or close an item according to the current CanOpenMultiple CMS value.
  const toggleItem = (index: number) => {
    setOpenItemIndexes((currentIndexes) => {
      const isOpen = currentIndexes.has(index);

      if (!canOpenMultiple) {
        // In single-open mode, the selected item remains open when clicked again.
        return isOpen ? currentIndexes : new Set([index]);
      }

      const nextIndexes = new Set(currentIndexes);
      if (isOpen) {
        nextIndexes.delete(index);
      } else {
        nextIndexes.add(index);
      }
      return nextIndexes;
    });
  };

  // Preserve the existing Enter/Space activation behavior for keyboard users.
  const handleHeaderKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      /*
       * Trigger the normal click path instead of duplicating toggle logic.
       * This also preserves compatibility with optional site-specific click tracking.
       */
      event.currentTarget.click();
    }
  };

  // Hover opens/toggles an item only when ExpandOnHover is enabled in Sitecore.
  const handleHeaderMouseEnter = (index: number) => {
    setHoveredItemIndex(index);
    if (expandOnHover) {
      toggleItem(index);
    }
  };

  return {
    isItemOpen: (index: number) => openItemIndexes.has(index),
    isHeaderHighlighted: (index: number) => focusedItemIndex === index || hoveredItemIndex === index,
    toggleItem,
    handleHeaderKeyUp,
    handleHeaderMouseEnter,
    setFocusedItemIndex,
    setHoveredItemIndex,
  };
}

export const Default = (props: DsiAccordionComponentProps): JSX.Element => {
  const { id, styles, backgroundStyle } = getComponentStyles(props.params);

  const accordionId = id ? `${id}-items` : `accordion-${props.rendering.uid}`;
  const componentId = id || props.rendering.uid;

  // Convert the string values supplied by Sitecore into typed component options.
  const canOpenMultiple = parseSitecoreBoolean(props.params.CanOpenMultiple);
  const expandedByDefault = parseSitecoreBoolean(props.params.ExpandedByDefault);
  const expandOnHover = parseSitecoreBoolean(props.params.ExpandOnHover);
  const speed = parseAnimationSpeed(props.params.Speed);

  const rootRef = useRef<HTMLDivElement | null>(null);

  // All future variants can reuse the same behavior while rendering different markup.
  const accordion = useAccordion(props.fields.items.length, {
    canOpenMultiple,
    expandedByDefault,
    expandOnHover,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /*
     * RichText controls its own HTML, so this small browser synchronization keeps
     * the existing heading-image feature without using jQuery. All Accordion
     * interaction and state remain controlled by React.
     */
    const headers = Array.from(root.querySelectorAll<HTMLElement>('.toggle-header'));
    const originalHasAccordionImageClass = root.classList.contains('accordion-image');
    const changedElements: Array<{
      header: HTMLElement;
      image: HTMLImageElement;
      headerBackground: string;
      imageDisplay: string;
    }> = [];

    headers.forEach((header) => {
      const image = header.querySelector<HTMLImageElement>('img');
      const source = image?.getAttribute('src');
      if (!image || !source) return;

      changedElements.push({
        header,
        image,
        headerBackground: header.style.background,
        imageDisplay: image.style.display,
      });

      root.classList.add('accordion-image');
      header.style.background = `url(${source}) no-repeat center bottom / cover`;
      image.style.display = 'none';
    });

    // Restore inline styles if Sitecore replaces the fields or unmounts the component.
    return () => {
      changedElements.forEach(({ header, image, headerBackground, imageDisplay }) => {
        header.style.background = headerBackground;
        image.style.display = imageDisplay;
      });

      if (!originalHasAccordionImageClass) {
        root.classList.remove('accordion-image');
      }
    };
  }, [props.fields.items]);

  return (
    <div id={componentId} ref={rootRef} className={`component accordion col-12 initialized ${styles}`}>
      <div className="component-content" style={backgroundStyle}>
        <div>
          <ul className="items" id={accordionId}>
            {props.fields.items.map((item, index) => {
              const isOpen = accordion.isItemOpen(index);
              const headerId = `${accordionId}-header-${index}`;
              const contentId = `${accordionId}-content-${index}`;

              /*
               * The animation wrapper collapses the complete panel, including any
               * site-specific padding on .toggle-content. Speed comes directly
               * from the current Sitecore rendering parameter.
               */
              const animationStyle: CSSProperties = {
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                transitionProperty: 'grid-template-rows',
                transitionDuration: `${speed}ms`,
                transitionTimingFunction: 'ease',
              };

              return (
                <li className={`item ${isOpen ? 'active' : ''}`} key={index}>
                  <div
                    className={`toggle-header ${accordion.isHeaderHighlighted(index) ? 'show' : ''}`}
                    id={headerId}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    onClick={() => accordion.toggleItem(index)}
                    onKeyUp={accordion.handleHeaderKeyUp}
                    onFocus={() => accordion.setFocusedItemIndex(index)}
                    onBlur={() => accordion.setFocusedItemIndex(null)}
                    onMouseEnter={() => accordion.handleHeaderMouseEnter(index)}
                    onMouseLeave={() => accordion.setHoveredItemIndex(null)}>
                    <div className="label">
                      <div className="row">
                        <div className="component content col-12">
                          <div className="component-content">
                            <div className="field-heading">
                              <RichText field={item.fields.Heading} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={animationStyle} aria-hidden={!isOpen} inert={!isOpen}>
                    <div style={{ minHeight: 0, overflow: 'hidden' }}>
                      <div className="toggle-content" id={contentId} role="region" aria-labelledby={headerId}>
                        <div className="row">
                          <div className="component content col-12">
                            <div className="component-content">
                              <div className="field-content">
                                <RichText field={item.fields.Content} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
