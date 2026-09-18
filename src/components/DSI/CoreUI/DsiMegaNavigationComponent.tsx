'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Image as SitecoreImage, Link, Text, RichText, useSitecore,
  type ComponentParams, type LinkField,
} from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';
import type { MegaLink, MegaNavigationData } from 'lib/DSI/Common/MegaNavigation/types';

// #region Rendering data
interface Props {
  // Rendering parameters control styles; the server prepares the menu in fields.
  params?: ComponentParams;
  fields?: { megaNavigation?: MegaNavigationData };
}

const hasLink = (field?: LinkField) => Boolean(field?.value?.href);
// #endregion Rendering data

// #region Dsi Mega Navigation Link - title, image, description and badge
function MenuLink({ item }: { item: MegaLink }) {
  // Reuse the same markup for direct links and links inside columns.
  // Without a URL, show the content as text instead of creating an empty anchor.
  const content = <>
    {item.image?.value?.src && <SitecoreImage field={item.image} className="mega-link-image" />}
    <span className="mega-link-copy">
      <span className="mega-link-title">
        {item.title?.value ? <Text field={item.title} /> : item.link?.value?.text}
        {item.badgeText?.value && <Text tag="span" className="mega-badge" field={item.badgeText} />}
      </span>
      {item.description?.value && <Text tag="span" className="mega-description" field={item.description} />}
    </span>
  </>;
  const link = hasLink(item.link)
    ? <Link field={item.link!} className="mega-link" rel={item.link?.value?.target === '_blank' ? 'noopener noreferrer' : undefined}>{content}</Link>
    : <span className="mega-link">{content}</span>;
  // Rich text may contain its own links. Keep it outside the page anchor.
  return <>{link}{item.content?.value && <RichText field={item.content} className="mega-description" />}</>;
}
// #endregion Dsi Mega Navigation Link

// #region Dsi Mega Navigation - root component
export const Default = ({ params = {}, fields }: Props) => {
  // #region Menu state and element references
  const { page } = useSitecore();
  const editing = page.mode.isEditing;
  const { id, styles, backgroundStyle } = getComponentStyles(params);
  // Separate IDs keep controls connected to the right panel if two menus share a page.
  const instanceId = useId();
  const root = useRef<HTMLElement>(null);
  // A short delay lets the pointer move from a trigger into its panel.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const data = fields?.megaNavigation;
  const items = data?.items ?? [];
  // #endregion Menu state and element references

  // #region Closing panels and cleaning up event listeners
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  // Return keyboard focus when closing from inside a panel, but not on outside clicks.
  const closePanel = (restoreFocus = false) => {
    cancelClose();
    if (restoreFocus && openItem) triggers.current.get(openItem)?.focus();
    setOpenItem(null);
  };

  useEffect(() => {
    // Close the menu on an outside click and remove the listener when it unmounts.
    const outsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpenItem(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('pointerdown', outsideClick);
    return () => {
      document.removeEventListener('pointerdown', outsideClick);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);
  // #endregion Closing panels and cleaning up event listeners

  // Authors see setup messages; visitors do not see an empty navigation component.
  if (!items.length && !editing) return null;

  return (
    <nav ref={root} id={id || undefined}
      className={`component dsi-mega-navigation ${styles}`} style={backgroundStyle}
      aria-label="Main navigation"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closePanel();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (openItem) closePanel(true);
          else {
            setMobileOpen(false);
            root.current?.querySelector<HTMLButtonElement>('.mega-mobile-toggle')?.focus();
          }
        }
      }}>
      {editing && data?.message && <p className="mega-editor-message">{data.message}</p>}
      {editing && !items.length && <p>Select a Mega Navigation datasource and add menu items.</p>}
      {/* #region Mobile menu control */}
      <button type="button" className="mega-mobile-toggle" aria-expanded={mobileOpen}
        aria-controls={`${instanceId}-items`} onClick={() => { setMobileOpen(!mobileOpen); closePanel(); }}>
        {mobileOpen ? 'Close menu' : 'Menu'}
      </button>
      {/* #endregion Mobile menu control */}
      {/* #region Dsi Mega Navigation Item - top-level links and panel controls */}
      <ul id={`${instanceId}-items`} className={`mega-items${mobileOpen ? ' is-mobile-open' : ''}`}>
        {items.map((item) => {
          // Sitecore checkbox values can arrive as a boolean or as text.
          const panelEnabled = item.enablePanel?.value === true || ['1', 'true'].includes(String(item.enablePanel?.value).toLowerCase());
          const expanded = panelEnabled && openItem === item.id;
          const panelId = `${instanceId}-panel-${item.id}`;
          const triggerId = `${instanceId}-trigger-${item.id}`;
          return <li key={item.id} className={`mega-item${expanded ? ' is-open' : ''}`}
            onPointerEnter={(event) => {
              cancelClose();
              // Touch users open panels by tapping. Mouse users can also hover.
              if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 768px)').matches) {
                setOpenItem(panelEnabled ? item.id : null);
              }
            }}
            onPointerLeave={(event) => {
              if (event.pointerType !== 'mouse' || editing) return;
              cancelClose();
              closeTimer.current = setTimeout(() => {
                // Do not hide a panel while a keyboard user is inside it.
                if (!root.current?.querySelector(`#${CSS.escape(panelId)}`)?.contains(document.activeElement)) setOpenItem(null);
              }, 200);
            }}>
            {panelEnabled ? <button type="button" id={triggerId} className="mega-trigger"
              ref={(element) => { if (element) triggers.current.set(item.id, element); else triggers.current.delete(item.id); }}
              aria-expanded={expanded} aria-controls={panelId}
              onClick={() => { cancelClose(); setOpenItem(expanded ? null : item.id); }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown') return;
                event.preventDefault();
                setOpenItem(item.id);
                // Wait for React to show the panel before focusing its first control.
                requestAnimationFrame(() => document.getElementById(panelId)?.querySelector<HTMLElement>('a[href], button')?.focus());
              }}>
              <Text field={item.title} /><span className="mega-chevron" aria-hidden="true" />
            </button> : <MenuLink item={item} />}
            {panelEnabled && <div id={panelId} className="mega-panel" hidden={!expanded} aria-labelledby={triggerId}>
              <div className="mega-panel-heading">
                <Text tag="h2" field={item.title} />
                <button type="button" className="mega-close" aria-label={`Close ${item.title?.value || 'menu'}`} onClick={() => closePanel(true)}>×</button>
              </div>
              {/* #region Dsi Mega Navigation Column and Listing - panel content */}
              {/* Both use a heading and links. Listing links come from selected pages. */}
              <div className="mega-columns">
                {item.blocks.map((block) => <section key={block.id} className={`mega-column mega-${block.kind}`}>
                  {block.title?.value && <h3>{hasLink(block.link)
                    ? <Link field={block.link!}><Text field={block.title} /></Link>
                    : <Text field={block.title} />}</h3>}
                  {editing && block.message && <p className="mega-editor-message">{block.message}</p>}
                  <ul className="mega-links">{block.links.map((link) => <li key={link.id}><MenuLink item={link} /></li>)}</ul>
                  {hasLink(block.viewAllLink) && <Link field={block.viewAllLink!} className="mega-view-all" />}
                </section>)}
              </div>
              {/* #endregion Dsi Mega Navigation Column and Listing */}
              {editing && !item.blocks.length && <p>Add Column or Listing items below this menu item in Content Editor.</p>}
            </div>}
          </li>;
        })}
      </ul>
      {/* #endregion Dsi Mega Navigation Item */}
    </nav>
  );
};
// #endregion Dsi Mega Navigation
