'use client';

import React, { JSX, useState } from 'react';
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

  // xa.navigation.js added these SXA classes after rendering. React now calculates them
  // from the Sitecore navigation tree so the existing CSS continues to work unchanged.
  const isSubmenu = hasChildren && relativeLevel <= 2;
  const isWideNavigation =
    relativeLevel === 1 && fields.Children?.some((child) => child.Children?.length > 0);

  const classNameList = [
    ...(fields.Styles || []),
    `rel-level${relativeLevel}`,
    isActive ? 'active' : '',
    isShown ? 'show' : '',
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
          />
        );
      })
    : null;

  return (
    <li className={classNameList} tabIndex={0}>
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
          onClick={handleClick}
        >
          {getNavigationText(props)}
        </Link>
      </div>

      {hasChildren && (
        <ul
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

const useNavigationLogic = (props: DsiNavigationComponentProps, enableDropdown: boolean) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const { page } = useSitecore();

  const { params, fields } = props;

  const hasFields = Object.values(fields).length > 0;
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

  const topLevelItems = Object.values(fields)
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

export const Default = (props: DsiNavigationComponentProps): JSX.Element => {
  const { id, styles, isOpenMenu, hasFields, handleToggleMenu, topLevelItems, navigationBehavior } =
    useNavigationLogic(props, true);
  console.log(isOpenMenu, handleToggleMenu);
  if (!hasFields) {
    return (
      <div className={`component navigation navigation-main ${styles}`} id={id}>
        <div className="component-content">[Navigation]</div>
      </div>
    );
  }

  return (
    <div
      className={`component navigation navigation-main ${styles}`}
      id={id}
      onMouseLeave={navigationBehavior.handleNavigationMouseLeave}
      onBlur={navigationBehavior.handleNavigationBlur}
      onKeyDown={navigationBehavior.handleNavigationKeyDown}
    >
      <div className="menu-humburger" />
      <div className="component-content">
        <nav>
          <ul className="clearfix">{topLevelItems}</ul>
        </nav>
      </div>
    </div>
    // <div className={`component navigation navigation-main ${styles}`} id={id}>
    //   <label className="menu-mobile-navigate-wrapper">
    //     <input type="checkbox" className="menu-mobile-navigate" checked={isOpenMenu} onChange={() => handleToggleMenu()} />
    //     <div className="menu-humburger" />
    //     <div className="component-content">
    //       <nav>
    //         <ul className="clearfix">{topLevelItems}</ul>
    //       </nav>
    //     </div>
    //   </label>
    // </div>
  );
};

export const MainDesktopNavigation = (props: DsiNavigationComponentProps): JSX.Element => {
  const { id, styles, isOpenMenu, hasFields, handleToggleMenu, topLevelItems } = useNavigationLogic(
    props,
    false
  );
  console.log(isOpenMenu, handleToggleMenu);
  if (!hasFields) {
    return (
      <div className={`component navigation main-nav ${styles}`} id={id}>
        <div className="component-content">[Main Nav]</div>
      </div>
    );
  }

  return (
    <div className={`component navigation main-nav ${styles}`} id={id}>
      <div className="component-content">
        <nav>
          <ul className="clearfix">{topLevelItems}</ul>
        </nav>
      </div>
    </div>
  );
};
