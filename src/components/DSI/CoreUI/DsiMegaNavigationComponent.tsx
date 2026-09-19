'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Image as SitecoreImage, Link, Text, RichText, useSitecore, type ComponentParams, type LinkField, type TextField, } from '@sitecore-content-sdk/nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';
import type { MegaLink, MegaNavigationData } from 'lib/DSI/Common/MegaNavigation/types';

// #region Rendering data
interface Props {
  // Rendering parameters control styles; the server prepares the menu in fields.
  params?: ComponentParams;
  fields?: { megaNavigation?: MegaNavigationData };
}

const hasLink = (field?: LinkField) => Boolean(field?.value?.href?.trim());
const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

// Keep the original field when it has text, so Sitecore editing still works.
// Callers supply fields in their preferred order. Spaces alone count as empty.
function labelField(link?: LinkField, ...titles: (TextField | undefined)[]): TextField {
  return titles.find((title) => hasText(title?.value)) || {
    value: hasText(link?.value?.text) ? link!.value.text : 'Link',
  };
}

const itemLabel = (item: MegaLink & { panelTitle?: TextField }) =>
  labelField(item.link, item.title, item.panelTitle);
// #endregion Rendering data

// #region Dsi Mega Navigation Link - title, image, description and badge
function MenuLink({ item }: { item: MegaLink }) {
  // Reuse the same markup for direct links and links inside columns.
  // Without a URL, show the content as text instead of creating an empty anchor.
  const content = <>    {
    item.image?.value?.src &&
    <SitecoreImage field={item.image} className="mega-link-image" />
  }

    <span className="mega-link-copy">
      <span className="mega-link-title">
        <Text field={itemLabel(item)} />

        {item.badgeText?.value &&
          <Text tag="span" className="mega-badge" field={item.badgeText} />
        }
      </span>

      {item.description?.value &&
        <Text tag="span" className="mega-description" field={item.description} />
      }
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
    if (restoreFocus && openItem) {
      triggers.current.get(openItem)?.focus();
    }
    setOpenItem(null);
  };

  useEffect(() => {
    // Close the menu on an outside click and remove the listener when it unmounts.
    const outsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
        }
        setOpenItem(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', outsideClick);

    return () => {
      document.removeEventListener('pointerdown', outsideClick);
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
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
          if (openItem) {
            closePanel(true);
          } else {
            setMobileOpen(false);
            root.current?.querySelector<HTMLButtonElement>('.mega-mobile-toggle')?.focus();
          }
        }
      }}>

      {editing && data?.message &&
        <p className="mega-editor-message">{data.message}</p>
      }

      {editing && !items.length &&
        <p>Select a Mega Navigation datasource and add menu items.</p>
      }

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
              if (event.pointerType !== 'mouse' || editing)
                return;

              cancelClose();
              closeTimer.current = setTimeout(() => {
                // Do not hide a panel while a keyboard user is inside it.
                if (!root.current?.querySelector(`#${CSS.escape(panelId)}`)?.contains(document.activeElement)) setOpenItem(null);
              }, 200);
            }}>

            {panelEnabled ?
              <button type="button" id={triggerId} className="mega-trigger"
                ref={(element) => {
                  if (element) {
                    triggers.current.set(item.id, element);
                  } else {
                    triggers.current.delete(item.id);
                  }
                }}
                aria-expanded={expanded} aria-controls={panelId}
                onClick={() => { cancelClose(); setOpenItem(expanded ? null : item.id); }}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown')
                    return;

                  event.preventDefault();
                  setOpenItem(item.id);
                  // Wait for React to show the panel before focusing its first control.
                  requestAnimationFrame(() => document.getElementById(panelId)?.querySelector<HTMLElement>('a[href], button')?.focus());
                }}>

                <Text field={itemLabel(item)} />
                <span className="mega-chevron" aria-hidden="true" />
              </button>
              : <MenuLink item={item} />
            }

            {panelEnabled &&
              <div id={panelId} className="mega-panel" hidden={!expanded} aria-labelledby={triggerId}>
                <div className="mega-panel-heading">
                  {/* News can open a panel headed Newsroom. An empty PanelTitle uses Title. */}
                  <Text tag="h2" field={labelField(item.link, item.panelTitle, item.title)} />
                  {/* <button type="button" className="mega-close" aria-label={`Close ${item.title?.value || 'menu'}`} onClick={() => closePanel(true)}>×</button> */}
                </div>

                {/* #region Dsi Mega Navigation Column and Listing - panel content */}
                {/* Both use a heading and links. Listing links come from selected pages. */}
                <div className="mega-columns">
                  {item.blocks.map((block) =>
                    <section key={block.id} className={`mega-column mega-${block.kind}`}>
                      {/* #region Column image and content - show only fields that are filled */}
                      {block.kind === 'column' && block.image?.value?.src &&
                        <SitecoreImage field={block.image} className="mega-column-image" />
                      }
                      {(hasText(block.title?.value) || hasLink(block.link)) &&
                        <h3>
                          {hasLink(block.link)
                            ? <Link field={block.link!}><Text field={labelField(block.link, block.title)} /></Link>
                            : <Text field={labelField(block.link, block.title)} />
                          }
                        </h3>
                      }

                      {block.kind === 'column' && block.content?.value &&
                        <RichText field={block.content} className="mega-column-content" />
                      }

                      {block.kind === 'column' && hasLink(block.buttonLink) &&
                        <Link field={block.buttonLink!} className="mega-column-button"><Text field={labelField(block.buttonLink)} /></Link>
                      }
                      {/* #endregion Column image and content */}

                      {editing && block.message &&
                        <p className="mega-editor-message">{block.message}
                        </p>
                      }
                      {block.links.length > 0 && <ul className="mega-links">
                        {block.links.map((link) =>
                          <li key={link.id}><MenuLink item={link} /></li>)
                        }
                      </ul>}

                      {hasLink(block.viewAllLink) &&
                        <Link field={block.viewAllLink!} className="mega-view-all"><Text field={labelField(block.viewAllLink)} /></Link>
                      }
                    </section>)}
                </div>

                {/* #endregion Dsi Mega Navigation Column and Listing */}
                {editing && !item.blocks.length &&
                  <p>Add Column or Listing items below this menu item in Content Editor.</p>
                }
              </div>
            }
          </li>;
        })
        }
      </ul>
      {/* #endregion Dsi Mega Navigation Item */}
    </nav>
  );
};
// #endregion Dsi Mega Navigation

// #region AnchorHover - desktop links and mobile panels
export const AnchorHover = ({ params = {}, fields }: Props) => {
  // #region Menu state and element references
  const { page } = useSitecore();
  const editing = page.mode.isEditing;
  const { id, styles, backgroundStyle } = getComponentStyles(params);
  // Separate IDs keep controls connected to the right panel if two menus share a page.
  const instanceId = useId();
  const root = useRef<HTMLElement>(null);
  // A short delay lets the pointer move from a trigger into its panel.
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // CSS selects the visible control. Both versions use the same menu data.
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const desktopTriggers = useRef(new Map<string, HTMLAnchorElement>());
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

  // Skip controls hidden by desktop/mobile styles when entering the panel.
  const focusFirstPanelLink = (panelId: string) => {
    requestAnimationFrame(() => {
      const controls = document.getElementById(panelId)?.querySelectorAll<HTMLElement>('a[href], button');
      Array.from(controls ?? []).find((control) => control.getClientRects().length > 0)?.focus();
    });
  };

  // Return keyboard focus when closing from inside a panel, but not on outside clicks.
  const closePanel = (restoreFocus = false) => {
    cancelClose();
    if (restoreFocus && openItem) {
      (window.matchMedia('(max-width: 767px), (hover: none), (pointer: coarse)').matches
        ? triggers.current.get(openItem)
        : desktopTriggers.current.get(openItem))?.focus();
    }
    setOpenItem(null);
  };

  useEffect(() => {
    // Close the menu on an outside click and remove the listener when it unmounts.
    const outsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
        }
        setOpenItem(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener('pointerdown', outsideClick);

    return () => {
      document.removeEventListener('pointerdown', outsideClick);
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);
  // #endregion Closing panels and cleaning up event listeners

  // Authors see setup messages; visitors do not see an empty navigation component.
  if (!items.length && !editing) return null;

  return (
    <nav ref={root} id={id || undefined}
      className={`component dsi-mega-navigation mega-anchor-hover ${styles}`} style={backgroundStyle}
      aria-label="Main navigation"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closePanel();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (openItem) {
            closePanel(true);
          } else {
            setMobileOpen(false);
            root.current?.querySelector<HTMLButtonElement>('.mega-mobile-toggle')?.focus();
          }
        }
      }}>

      {editing && data?.message &&
        <p className="mega-editor-message">{data.message}</p>
      }

      {editing && !items.length &&
        <p>Select a Mega Navigation datasource and add menu items.</p>
      }

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
              if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches) {
                setOpenItem(panelEnabled ? item.id : null);
              }
            }}

            onPointerLeave={(event) => {
              if (event.pointerType !== 'mouse' || editing)
                return;

              cancelClose();
              const menuItem = event.currentTarget;
              closeTimer.current = setTimeout(() => {
                // Keep the panel open while its parent or content has keyboard focus.
                if (!menuItem.contains(document.activeElement)) setOpenItem(null);
              }, 200);
            }}>

            {/* Desktop parents are always anchors. A missing URL uses # without jumping. */}
            <Link
              field={{ ...item.link, value: { ...item.link?.value, href: item.link?.value?.href?.trim() || '#' } }}
              id={triggerId}
              className={`mega-trigger ${panelEnabled ? 'mega-desktop-trigger' : ''}`}
              ref={(element) => {
                if (element) desktopTriggers.current.set(item.id, element);
                else desktopTriggers.current.delete(item.id);
              }}
              aria-expanded={panelEnabled ? expanded : undefined}
              aria-controls={panelEnabled ? panelId : undefined}
              onFocus={() => { cancelClose(); setOpenItem(panelEnabled ? item.id : null); }}
              onClick={(event) => {
                if (!item.link?.value?.href?.trim() || item.link.value.href.trim() === '#') {
                  event.preventDefault();
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowDown' || !panelEnabled) return;
                event.preventDefault();
                setOpenItem(item.id);
                focusFirstPanelLink(panelId);
              }}>
              <Text field={itemLabel(item)} />
              {panelEnabled && <span className="mega-chevron" aria-hidden="true" />}
            </Link>

            {/* Touch users open the panel here, then follow the parent link inside it. */}
            {panelEnabled &&
              <button type="button" id={`${triggerId}-touch`} className="mega-trigger mega-touch-trigger"
                ref={(element) => {
                  if (element) {
                    triggers.current.set(item.id, element);
                  } else {
                    triggers.current.delete(item.id);
                  }
                }}
                aria-expanded={expanded} aria-controls={panelId}
                onClick={() => { cancelClose(); setOpenItem(expanded ? null : item.id); }}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown')
                    return;

                  event.preventDefault();
                  setOpenItem(item.id);
                  // Wait for React to show the panel before focusing its first control.
                  focusFirstPanelLink(panelId);
                }}>

                <Text field={itemLabel(item)} />
                <span className="mega-chevron" aria-hidden="true" />
              </button>
            }

            {panelEnabled &&
              <div id={panelId} className="mega-panel" hidden={!expanded} aria-label={String(itemLabel(item).value)}>
                <div className="mega-panel-heading">
                  {/* News can open a panel headed Newsroom. An empty PanelTitle uses Title. */}
                  <Text tag="h2" field={labelField(item.link, item.panelTitle, item.title)} />
                  {/* <button type="button" className="mega-close" aria-label={`Close ${item.title?.value || 'menu'}`} onClick={() => closePanel(true)}>×</button> */}
                </div>

                {/* Empty URLs and # do not create a second, unusable link inside the panel. */}
                {hasLink(item.link) && item.link!.value.href!.trim() !== '#' &&
                  <Link field={item.link!} className="mega-parent-link">
                    <Text field={itemLabel(item)} />
                  </Link>
                }

                {/* #region Dsi Mega Navigation Column and Listing - panel content */}
                {/* Both use a heading and links. Listing links come from selected pages. */}
                <div className="mega-columns">
                  {item.blocks.map((block) =>
                    <section key={block.id} className={`mega-column mega-${block.kind}`}>
                      {/* #region Column image and content - show only fields that are filled */}
                      {block.kind === 'column' && block.image?.value?.src &&
                        <SitecoreImage field={block.image} className="mega-column-image" />
                      }
                      {(hasText(block.title?.value) || hasLink(block.link)) &&
                        <h3>
                          {hasLink(block.link)
                            ? <Link field={block.link!}><Text field={labelField(block.link, block.title)} /></Link>
                            : <Text field={labelField(block.link, block.title)} />
                          }
                        </h3>
                      }

                      {block.kind === 'column' && block.content?.value &&
                        <RichText field={block.content} className="mega-column-content" />
                      }

                      {block.kind === 'column' && hasLink(block.buttonLink) &&
                        <Link field={block.buttonLink!} className="mega-column-button"><Text field={labelField(block.buttonLink)} /></Link>
                      }
                      {/* #endregion Column image and content */}

                      {editing && block.message &&
                        <p className="mega-editor-message">{block.message}
                        </p>
                      }
                      {block.links.length > 0 && <ul className="mega-links">
                        {block.links.map((link) =>
                          <li key={link.id}><MenuLink item={link} /></li>)
                        }
                      </ul>}

                      {hasLink(block.viewAllLink) &&
                        <Link field={block.viewAllLink!} className="mega-view-all"><Text field={labelField(block.viewAllLink)} /></Link>
                      }
                    </section>)}
                </div>

                {/* #endregion Dsi Mega Navigation Column and Listing */}
                {editing && !item.blocks.length &&
                  <p>Add Column or Listing items below this menu item in Content Editor.</p>
                }
              </div>
            }
          </li>;
        })
        }
      </ul>
      {/* #endregion Dsi Mega Navigation Item */}
    </nav>
  );
};
// #endregion AnchorHover
