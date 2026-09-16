'use client';

import React, { JSX, useEffect, useRef } from 'react';
import { ComponentParams, Field, useSitecore } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';
import { mountPlainHtml } from 'lib/DSI/Common/PlainHtml/mountPlainHtml';

interface DsiPlainHTMLComponentProps {
  // Rendering settings from Sitecore, such as CSS classes and the component ID.
  params?: ComponentParams;
  fields?: {
    // The author's original Multi-Line Text value from the CMS.
    HtmlCode?: Field<string>;
    // Added by getPlainHtmlMediaData on the server. This is NOT a CMS field.
    // Key: the media path in HtmlCode. Value: the complete URL from Sitecore.
    // Optional because HTML without local media does not need this mapping.
    mediaUrls?: Record<string, string>
  };
}

export const Default = ({ params = {}, fields }: DsiPlainHTMLComponentProps): JSX.Element => {
  const { page } = useSitecore();
  // Keep a reference to the exact element that will contain this instance's HTML.
  const containerRef = useRef<HTMLDivElement>(null);
  const html = fields?.HtmlCode?.value ?? '';
  const mediaUrls = fields?.mediaUrls;
  const { id, styles, backgroundStyle } = getComponentStyles(params);

  // #region Plain HTML rendering
  // React owns the empty container. Mount CMS HTML after hydration so scripts
  // can change its contents without React trying to render those changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !html.trim()) return;
    let dispose: (() => void) | undefined;
    // React Strict Mode checks effects twice during development. Waiting one
    // frame lets the first cleanup cancel its work before any CMS script runs.
    const frame = requestAnimationFrame(() => {
      try {
        dispose = mountPlainHtml(container, html, mediaUrls);
      } catch (error) {
        console.error('[DSI Plain HTML] Unable to mount content.', error);
      }
    });
    return () => {
      // Remove this instance's old content when its HTML/URLs change or it leaves
      // the page. The helper also stops any scripts still waiting to be inserted.
      cancelAnimationFrame(frame);
      dispose?.();
    };
  }, [html, mediaUrls]);
  // #endregion Plain HTML rendering

  return (
    <div className={`component plain-html ${styles}`} id={id || undefined}>
      {/* Leave this element empty in JSX. The helper owns the HTML inside it. */}
      <div ref={containerRef} className="component-content" style={backgroundStyle} />
      {/* Show an empty-field hint to authors only, not to normal visitors. */}
      {!html.trim() && page.mode.isEditing && <p>DSI Plain HTML: add content to HtmlCode.</p>}
    </div>
  );
};
