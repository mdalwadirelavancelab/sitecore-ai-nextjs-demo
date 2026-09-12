import React, { JSX, useRef, useState } from 'react';
// import { ComponentProps } from 'lib/component-props';
import {
  Field,
  RichText,
  ComponentParams,
  ComponentRendering,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { getComponentStyles } from 'lib/DSI/Common/getComponentStyles';

type ChildRenderingProps = {
  name: string;
  fields: {
    Heading: Field<string>;
    Content: Field<string>;
  };
};

// interface TabsParams extends ComponentParams {
//   TabControlBelowContent: string;
// }

interface DsiTabsComponentProps {
  rendering: ComponentRendering & { params: ComponentParams };
  params: ComponentParams;
  fields: {
    items: ChildRenderingProps[];
  };
}

/**
 * Keeps all interactive tab behavior in this component file so every Sitecore
 * variant can reuse it without relying on a separate helper file.
 */
function useTabs(tabCount: number) {
  // React state remembers which tab is currently selected and should be visible.
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // Each tab element is stored here so arrow-key navigation can move keyboard focus.
  const tabRefs = useRef<Array<HTMLLIElement | null>>([]);

  // If Sitecore removes an item while editing, keep the selected index inside the available range.
  const activeTabIndex =
    tabCount > 0 ? Math.min(selectedTabIndex, tabCount - 1) : 0;

  // Select the requested tab and move keyboard focus to its heading.
  const activateTab = (index: number) => {
    setSelectedTabIndex(index);
    tabRefs.current[index]?.focus();
  };

  /**
   * Preserve the existing accessible keyboard behavior:
   * - Right/Down arrow: focus the next tab.
   * - Left/Up arrow: focus the previous tab.
   * - Enter/Space: select the focused tab.
   */
  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    if (!tabCount) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      tabRefs.current[(index + 1) % tabCount]?.focus();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      tabRefs.current[(index - 1 + tabCount) % tabCount]?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activateTab(index);
    }
  };

  // Return a ref callback that stores each rendered tab at its matching array index.
  const setTabRef = (index: number) => (element: HTMLLIElement | null) => {
    tabRefs.current[index] = element;
  };

  return {
    activeTabIndex,
    activateTab,
    handleTabKeyDown,
    setTabRef,
  };
}

export const Default = (props: DsiTabsComponentProps): JSX.Element => {
  const { id, styles } = getComponentStyles(props.params);
  // const tabControlBelowContent = props.params.TabControlBelowContent === '1';
  const tabsId = id || `tabs-${props.rendering.uid}`;
  const componentId = id || `dsitabs-${props.rendering.uid}`.replace(/-/g, '');

  // All variants can call the same private hook while keeping their own markup and styling.
  const {
    activeTabIndex,
    activateTab,
    handleTabKeyDown,
    setTabRef,
  } = useTabs(props.fields.items.length);

  return (
    <div className={`component tabs initialized ${styles}`} id={componentId}>
      <div className="component-content">
        <div className="tabs" id={tabsId}>
          <div className="tabs-inner">
            <ul className="tabs-heading" role="tablist">
              {props.fields.items.map((item, index) => {
                const tabId = `${tabsId}-tab-${index}`;
                const paneId = `${tabsId}-pane-${index}`;
                const isActive = activeTabIndex === index;

                return (
                  <li
                    key={tabId}
                    ref={setTabRef(index)}
                    tabIndex={isActive ? 0 : -1}
                    className={`tab ${isActive ? 'active' : ''}`}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={paneId}
                    id={tabId}
                    onClick={() => activateTab(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <div>
                      <div className="component content">
                        <div className="component-content">
                          <div className="field-heading">
                            <RichText field={item.fields.Heading} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="tabs-container">
              {props.fields.items.map((item, index) => {
                const tabId = `${tabsId}-tab-${index}`;
                const paneId = `${tabsId}-pane-${index}`;
                const isActive = activeTabIndex === index;

                return (
                  <div
                    key={paneId}
                    className={`tab ${isActive ? 'active' : ''}`}
                    role="tabpanel"
                    id={paneId}
                    aria-labelledby={tabId}
                    tabIndex={0}
                    hidden={!isActive}
                  >
                    <RichText field={item.fields.Content} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
