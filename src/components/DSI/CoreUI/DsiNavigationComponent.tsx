'use client';

import React, { JSX, useId, useRef, useState } from 'react';
import {
  Link,
  LinkField,
  Text,
  TextField,
  useSitecore,
} from '@sitecore-content-sdk/nextjs';
import { useDsiNavigation } from 'lib/DSI/Common/useDsiNavigation';
import type { DsiNavigationBehavior } from 'lib/DSI/Common/useDsiNavigation';

// --- Interface Definitions ---

interface Fields {
  Id: string;
  DisplayName: string;
  Title: TextField;
  NavigationTitle: TextField;
  Href: string;
  NavigationLink: string;
  // #region DSI navigation - custom link field
  // Added by our server helper. Preserve the CMS link settings, not just its URL.
  NavigationLinkField?: LinkField;
  // #endregion DSI navigation - custom link field
  Querystring: string;
  Children: Array<Fields>;
  Styles: string[];
}

type DsiNavigationComponentProps = {
  params?: { [key: string]: string };
  fields: Fields;
  handleClick: (event?: React.MouseEvent<HTMLElement>) => void;
  relativeLevel: number;
};

type NavigationListProps = DsiNavigationComponentProps & {
  itemKey: string;
  itemPath: string[];
  navigationBehavior: DsiNavigationBehavior;
  withSubmenuButtons?: boolean;
};

// --- Helper Functions ---

const getNavigationText = (props: DsiNavigationComponentProps): JSX.Element | string => {
  let text;

  if (props.fields.NavigationTitle) {
    text = <Text field={props.fields.NavigationTitle} />;
  } else if (props.fields.Title) {
    text = <Text field={props.fields.Title} />;
  } else {
    text = props.fields.DisplayName;
  }
  return text;
};

const getLinkTitle = (props: DsiNavigationComponentProps): string => {
  let title;
  if (props.fields.NavigationTitle?.value) {
    title = props.fields.NavigationTitle.value.toString();
  } else if (props.fields.Title?.value) {
    title = props.fields.Title.value.toString();
  } else {
    title = props.fields.DisplayName;
  }
  return title;
};

const getLinkField = (props: DsiNavigationComponentProps): LinkField => {
  // #region DSI navigation - use the full CMS link
  // Prefer the full custom link field. Do not attach the normal page's Querystring
  // to a custom external/media link; use that link's own settings instead.
  if (props.fields.NavigationLinkField) {
    const field = props.fields.NavigationLinkField;
    return { ...field, value: { ...field.value, title: field.value.title || getLinkTitle(props) } };
  }
  // #endregion DSI navigation - use the full CMS link
  const { NavigationLink, Href, Querystring } = props.fields;

  const href = NavigationLink?.trim() ? NavigationLink : Href;

  return {
    value: {
      href,
      title: getLinkTitle(props),
      querystring: Querystring,
    },
  };
};
// --- Navigation List Component (Recursive) ---

const NavigationList = (props: NavigationListProps) => {
  const { page } = useSitecore();
  const { fields, relativeLevel, handleClick, itemKey, itemPath, navigationBehavior } = props;
  const hasChildren = fields.Children?.length > 0;
  const isActive = navigationBehavior.isItemActive(itemKey);
  const isShown = navigationBehavior.isItemShown(itemKey);
  const submenuId = useId();
  // #region DSI navigation - single Tab stop in the button variant
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const itemRef = useRef<HTMLLIElement>(null);
  const withSubmenuButtons = props.withSubmenuButtons ?? false;
  // #endregion DSI navigation - single Tab stop in the button variant

  // xa.navigation.js added these SXA classes after rendering. React now calculates them
  // from the Sitecore navigation tree so the existing CSS continues to work unchanged.
  const isSubmenu = hasChildren && relativeLevel <= 2;
  const isWideNavigation =
    relativeLevel === 1 && fields.Children?.some((child) => child.Children?.length > 0);

  const classNameList = [
    ...(fields.Styles || []),
    `rel-level${relativeLevel}`,
    isActive ? 'active' : '',
    isActive ? 'is-expanded' : '',
    isShown ? 'show' : '',
    keyboardOpen ? 'keyboard-open' : '',
    isSubmenu ? 'submenu' : '',
    isWideNavigation ? 'wide-nav' : '',
    hasChildren ? '' : 'no-child',
  ]
    .filter(Boolean)
    .join(' ');

  const childItems = hasChildren
    ? fields.Children.map((child, index) => {
      // The position is included because a Sitecore item ID can be blank in editing data.
      const childKey = `${itemKey}-${index}-${child.Id || 'item'}`;

      return (
        <NavigationList
          key={childKey}
          fields={child}
          handleClick={handleClick}
          relativeLevel={relativeLevel + 1}
          itemKey={childKey}
          itemPath={[...itemPath, childKey]}
          navigationBehavior={navigationBehavior}
          withSubmenuButtons={withSubmenuButtons}
        />
      );
    })
    : null;

  return (
    <li ref={itemRef} className={classNameList}
      onKeyDown={(event) => {
        if (withSubmenuButtons && hasChildren && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          itemRef.current?.querySelector<HTMLAnchorElement>(':scope > .navigation-title > a')?.focus();
          setKeyboardOpen(false);
          navigationBehavior.handleNavigationKeyDown(event);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setKeyboardOpen(false);
      }}>
      <div
        className={`navigation-title field-navigationtitle ${hasChildren ? 'child' : ''}`}
        onMouseEnter={() => navigationBehavior.handleItemMouseEnter(itemPath, relativeLevel)}
        onMouseLeave={relativeLevel === 1 ? navigationBehavior.scheduleDropdownClose : undefined}
        onFocus={
          relativeLevel === 1 ? () => navigationBehavior.handleTopLevelFocus(itemPath) : undefined
        }
        onClick={(event) => navigationBehavior.handleTitleClick(event, itemKey, hasChildren)}
      >
        <Link
          field={getLinkField(props)}
          editable={page.mode.isEditing}
          aria-expanded={withSubmenuButtons && hasChildren ? keyboardOpen || isActive || isShown : undefined}
          aria-controls={withSubmenuButtons && hasChildren ? submenuId : undefined}
          onFocus={withSubmenuButtons && hasChildren ? () => setKeyboardOpen(true) : undefined}
          onKeyDown={withSubmenuButtons && hasChildren ? (event) => {
            // Keep Enter's normal link behavior. Down opens children for every URL type.
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setKeyboardOpen(true);
              requestAnimationFrame(() => {
                itemRef.current?.querySelector<HTMLAnchorElement>(':scope > ul > li > .navigation-title > a')?.focus();
              });
            }
          } : undefined}
          onClick={(event) => {
            // #region DSI navigation - placeholder link click
            const href = getLinkField(props).value.href;
            if (href && /^#+$/.test(href)) {
              // # is a menu placeholder: do not navigate or scroll to the page top.
              // The click still reaches the parent div, which toggles the submenu.
              // Skip handleClick here because it closes dropdowns.
              event.preventDefault();
              return;
            }
            // Keep the existing menu-close behavior for real links.
            event.stopPropagation();
            handleClick(event);
            // #endregion DSI navigation - placeholder link click
          }}
        >
          {getNavigationText(props)}
        </Link>
        {hasChildren && withSubmenuButtons && (
          <button type="button" className="submenu-toggle" tabIndex={-1} onClick={() => setKeyboardOpen(false)}
            aria-label={`Toggle ${getLinkTitle(props)} submenu`}
            aria-expanded={keyboardOpen || isActive || isShown} aria-controls={submenuId}>
            <span aria-hidden="true" />
          </button>
        )}
      </div>

      {hasChildren && (
        <ul
          id={submenuId}
          className="clearfix"
          onMouseEnter={relativeLevel === 1 ? navigationBehavior.cancelDropdownClose : undefined}
          onMouseLeave={relativeLevel === 1 ? navigationBehavior.scheduleDropdownClose : undefined}
        >
          {childItems}
        </ul>
      )}
    </li>
  );
};

// --- Reusable logic hook inside the same file ---

const useNavigationLogic = (props: DsiNavigationComponentProps, enableDropdown: boolean, withSubmenuButtons = false) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const { page } = useSitecore();

  const { params, fields } = props;

  // #region DSI navigation - missing fields guard
  // A new or unconfigured rendering may have no fields. Show the fallback instead of throwing.
  const hasFields = Object.values(fields ?? {}).length > 0;
  // #endregion DSI navigation - missing fields guard
  const id = params?.RenderingIdentifier || params?.Id || '';
  const styles = `${params?.GridParameters ?? ''} ${params?.Styles ?? ''}`.trim();
  const styleNames = styles.split(/\s+/).filter(Boolean);

  // Sitecore controls whether the mobile SXA presentation and animation are enabled.
  const navigationBehavior = useDsiNavigation({
    enableDropdown,
    isMobileNavigation: styleNames.includes('navigation-mobile'),
  });

  const handleToggleMenu = (event?: React.MouseEvent<HTMLElement>, forceState?: boolean) => {
    if (event && page.mode.isEditing) {
      event.preventDefault();
    }

    if (forceState !== undefined) {
      setIsOpenMenu(forceState);
    } else {
      setIsOpenMenu((prev) => !prev);
    }
  };

  const handleLinkClick = (event?: React.MouseEvent<HTMLElement>) => {
    navigationBehavior.closeDropdowns();
    handleToggleMenu(event, false);
  };

  const topLevelItems = Object.values(fields ?? {})
    .filter(Boolean)
    .map((element: Fields, index: number) => {
      const itemKey = `navigation-${index}-${element.Id || 'item'}`;

      return (
        <NavigationList
          key={itemKey}
          fields={element}
          handleClick={handleLinkClick}
          relativeLevel={1}
          itemKey={itemKey}
          itemPath={[itemKey]}
          navigationBehavior={navigationBehavior}
          withSubmenuButtons={withSubmenuButtons}
        />
      );
    });

  return {
    id,
    styles,
    isOpenMenu,
    hasFields,
    handleToggleMenu,
    topLevelItems,
    navigationBehavior,
    page,
  };
};

// #region Default variant - links without submenu buttons
export const Default = (props: DsiNavigationComponentProps): JSX.Element => {
  const { id, styles, isOpenMenu, hasFields, handleToggleMenu, topLevelItems, navigationBehavior } =
    useNavigationLogic(props, true, false);
  // #region DSI navigation - mobile menu
  // Each rendering needs its own ID so the button controls only its own menu.
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  // #endregion DSI navigation - mobile menu
  if (!hasFields) {
    return (
      <div className={`component dsi-navigation navigation navigation-main ${styles}`} id={id}>
        <div className="component-content">[Navigation]</div>
      </div>
    );
  }

  return (
    <div
      className={`component dsi-navigation navigation navigation-main ${styles} ${isOpenMenu ? 'menu-open' : ''}`}
      id={id}
      onMouseLeave={navigationBehavior.handleNavigationMouseLeave}
      onBlur={navigationBehavior.handleNavigationBlur}
      onKeyDown={(event) => {
        navigationBehavior.handleNavigationKeyDown(event);
        if (event.key === 'Escape' && isOpenMenu) {
          handleToggleMenu(undefined, false);
          toggleRef.current?.focus();
        }
      }}
    >
      {/* A real button supports mouse, touch, Enter and Space without extra handlers. */}
      <button ref={toggleRef} type="button" className="menu-humburger"
        aria-expanded={isOpenMenu} aria-controls={menuId}
        aria-label={isOpenMenu ? 'Close navigation' : 'Open navigation'}
        onClick={() => handleToggleMenu()}><span aria-hidden="true" /></button>
      <div className="component-content" id={menuId}>
        <nav>
          <ul className="clearfix">{topLevelItems}</ul>
        </nav>
      </div>
    </div>
  );
};

// #endregion Default variant

// #region WithSubmenuButtons variant - arrows with one Tab stop per parent
export const WithSubmenuButtons = (props: DsiNavigationComponentProps): JSX.Element => {
  const { id, styles, isOpenMenu, hasFields, handleToggleMenu, topLevelItems, navigationBehavior } =
    useNavigationLogic(props, true, true);
  // #region DSI navigation - mobile menu
  // Each rendering needs its own ID so the button controls only its own menu.
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  // #endregion DSI navigation - mobile menu
  if (!hasFields) {
    return (
      <div className={`component dsi-navigation navigation navigation-main ${styles}`} id={id}>
        <div className="component-content">[Navigation]</div>
      </div>
    );
  }

  return (
    <div
      className={`component dsi-navigation navigation navigation-main ${styles} ${isOpenMenu ? 'menu-open' : ''}`}
      id={id}
      onMouseLeave={navigationBehavior.handleNavigationMouseLeave}
      onBlur={navigationBehavior.handleNavigationBlur}
      onKeyDown={(event) => {
        navigationBehavior.handleNavigationKeyDown(event);
        if (event.key === 'Escape' && isOpenMenu) {
          handleToggleMenu(undefined, false);
          toggleRef.current?.focus();
        }
      }}
    >
      {/* A real button supports mouse, touch, Enter and Space without extra handlers. */}
      <button ref={toggleRef} type="button" className="menu-humburger"
        aria-expanded={isOpenMenu} aria-controls={menuId}
        aria-label={isOpenMenu ? 'Close navigation' : 'Open navigation'}
        onClick={() => handleToggleMenu()}><span aria-hidden="true" /></button>
      <div className="component-content" id={menuId}>
        <nav>
          <ul className="clearfix">{topLevelItems}</ul>
        </nav>
      </div>
    </div>
  );
};

// #endregion WithSubmenuButtons variant

export const MainDesktopNavigation = (props: DsiNavigationComponentProps): JSX.Element => {
  const { id, styles, hasFields, topLevelItems } = useNavigationLogic(
    props,
    false
  );
  if (!hasFields) {
    return (
      <div className={`component dsi-navigation navigation main-nav ${styles}`} id={id}>
        <div className="component-content">[Main Nav]</div>
      </div>
    );
  }

  return (
    <div className={`component dsi-navigation navigation main-nav ${styles}`} id={id}>
      <div className="component-content">
        <nav>
          <ul className="clearfix">{topLevelItems}</ul>
        </nav>
      </div>
    </div>
  );
};
