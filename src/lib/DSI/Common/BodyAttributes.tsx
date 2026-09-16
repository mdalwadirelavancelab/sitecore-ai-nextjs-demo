'use client';

import { useEffect } from 'react';

interface BodyAttributesProps {
  // Plain values from the current page's BodyId and BodyCssClass CMS fields.
  bodyId?: string;
  bodyClass?: string;
  isEditing: boolean;
}

/**
 * Apply page-specific attributes to the real body element, as in the JSS layout.
 * The App Router root layout owns <body>, but route fields arrive in src/Layout.
 * This small client component connects the two without making Layout a client
 * component or fetching the page again in the root layout.
 */
export default function BodyAttributes({
  bodyId = '',
  bodyClass = '',
  isEditing,
}: BodyAttributesProps) {
  // #region DSI page body attributes
  // Run after hydration, matching the JSS useEffect approach. CMS attributes
  // are therefore applied in the browser; they are not in the initial HTML.
  useEffect(() => {
    const body = document.body;
    const originalId = body.getAttribute('id');
    const pageId = bodyId.trim() || null;
    const modeClass = isEditing ? 'editing-mode' : 'prod-mode';

    // RootLayout supplies these permanent classes, even on pages without CMS data.
    // Add them here too in case another script has removed them.
    const defaultClasses = ['default-device', 'bodyclass'];
    body.classList.add(...defaultClasses);

    // Authors can enter several classes separated by spaces or newlines.
    // Track only classes added by this page. Do not replace body.className:
    // plugins may already have their own classes, such as a modal-open class.
    const pageClasses = [...new Set([...bodyClass.trim().split(/\s+/), modeClass])]
      .filter(Boolean);
    const addedClasses = pageClasses.filter(name => !body.classList.contains(name));
    body.classList.add(...addedClasses);

    // A blank field removes the previous page ID instead of leaving a stale one.
    if (pageId) body.id = pageId;
    else body.removeAttribute('id');

    return () => {
      // React runs cleanup before applying changed fields and when leaving the
      // page. Keep permanent defaults and classes owned by other code.
      body.classList.remove(...addedClasses);

      // Restore the original ID only if it still has the value we applied.
      // Do not overwrite an ID changed by another script after this effect ran.
      if (body.getAttribute('id') === pageId) {
        if (originalId === null) body.removeAttribute('id');
        else body.id = originalId;
      }
    };
  }, [bodyId, bodyClass, isEditing]);
  // #endregion DSI page body attributes

  // This component only updates body attributes; it adds no visible markup.
  return null;
}
