import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type UseDsiNavigationOptions = {
  /** Enables the SXA desktop dropdown behaviour used by navigation-main. */
  enableDropdown: boolean;
  /** Enables the SXA slide animation when Sitecore applies navigation-mobile. */
  isMobileNavigation: boolean;
};

export type DsiNavigationBehavior = {
  isItemActive: (itemKey: string) => boolean;
  isItemShown: (itemKey: string) => boolean;
  handleItemMouseEnter: (itemPath: string[], relativeLevel: number) => void;
  handleTopLevelFocus: (itemPath: string[]) => void;
  handleTitleClick: (
    event: MouseEvent<HTMLDivElement>,
    itemKey: string,
    hasChildren: boolean
  ) => void;
  cancelDropdownClose: () => void;
  scheduleDropdownClose: () => void;
  closeDropdowns: () => void;
  handleNavigationMouseLeave: () => void;
  handleNavigationBlur: (event: FocusEvent<HTMLElement>) => void;
  handleNavigationKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

const DROPDOWN_CLOSE_DELAY = 200;
const MOBILE_SLIDE_DURATION = 400;

/**
 * React/TypeScript equivalent of the Sitecore SXA-style navigation behaviour that was
 * previously provided by public/scripts/xa.navigation.js. It preserves the existing
 * show/active CSS classes, desktop delay, focus behaviour, and mobile slide effect while
 * allowing React, rather than jQuery, to own the DSI navigation state.
 */
export const useDsiNavigation = ({
  enableDropdown,
  isMobileNavigation,
}: UseDsiNavigationOptions): DsiNavigationBehavior => {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submenuAnimationsRef = useRef(new Map<HTMLElement, Animation>());
  const [shownItemPath, setShownItemPath] = useState<string[]>([]);
  const [activeItemKeys, setActiveItemKeys] = useState<Set<string>>(() => new Set());

  /** Cancels a queued desktop submenu close when the pointer returns to the menu. */
  const cancelDropdownClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  /** Immediately closes every desktop dropdown managed by this navigation instance. */
  const closeDropdowns = useCallback(() => {
    cancelDropdownClose();
    setShownItemPath([]);
  }, [cancelDropdownClose]);

  /** Uses the same 200 ms close delay as the former SXA-style jQuery script. */
  const scheduleDropdownClose = useCallback(() => {
    cancelDropdownClose();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setShownItemPath([]);
    }, DROPDOWN_CLOSE_DELAY);
  }, [cancelDropdownClose]);

  /** Opens the hovered item path and closes dropdowns from sibling branches. */
  const handleItemMouseEnter = useCallback(
    (itemPath: string[], relativeLevel: number) => {
      if (!enableDropdown || isMobileNavigation || window.matchMedia('(max-width: 767px)').matches || relativeLevel > 2) {
        return;
      }

      cancelDropdownClose();
      setShownItemPath(itemPath);
    },
    [cancelDropdownClose, enableDropdown, isMobileNavigation]
  );

  /** Matches the former desktop focus behaviour for a top-level navigation item. */
  const handleTopLevelFocus = useCallback(
    (itemPath: string[]) => {
      if (!enableDropdown || isMobileNavigation || window.matchMedia('(max-width: 767px)').matches) {
        return;
      }

      cancelDropdownClose();
      setShownItemPath(itemPath.slice(0, 1));
    },
    [cancelDropdownClose, enableDropdown, isMobileNavigation]
  );

  /**
   * Recreates jQuery slideToggle for navigation-mobile by animating the existing child list.
   * The normal Sitecore CSS remains responsible for the final open or closed display state.
   */
  const animateMobileSubmenu = useCallback(
    (titleElement: HTMLDivElement, isOpening: boolean) => {
      if (!isMobileNavigation) {
        return;
      }

      const submenu = titleElement.nextElementSibling;
      if (!(submenu instanceof HTMLUListElement) || typeof submenu.animate !== 'function') {
        return;
      }

      submenuAnimationsRef.current.get(submenu)?.cancel();

      // Inline display keeps a closing submenu visible until its height animation completes.
      submenu.style.display = 'block';
      submenu.style.overflow = 'hidden';
      const expandedHeight = submenu.scrollHeight;
      const animation = submenu.animate(
        [
          { height: isOpening ? '0px' : `${expandedHeight}px` },
          { height: isOpening ? `${expandedHeight}px` : '0px' },
        ],
        {
          duration: MOBILE_SLIDE_DURATION,
          easing: 'ease',
        }
      );

      submenuAnimationsRef.current.set(submenu, animation);

      const clearAnimationStyles = () => {
        if (submenuAnimationsRef.current.get(submenu) !== animation) {
          return;
        }

        submenuAnimationsRef.current.delete(submenu);
        submenu.style.removeProperty('display');
        submenu.style.removeProperty('overflow');
        submenu.style.removeProperty('height');
      };

      animation.onfinish = clearAnimationStyles;
      animation.oncancel = clearAnimationStyles;
    },
    [isMobileNavigation]
  );

  /** Preserves the component's existing active-class toggle and mobile animation. */
  const handleTitleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>, itemKey: string, hasChildren: boolean) => {
      const isOpening = !activeItemKeys.has(itemKey) && !shownItemPath.includes(itemKey);
      cancelDropdownClose();
      setShownItemPath([]);

      setActiveItemKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);

        if (isOpening) {
          nextKeys.add(itemKey);
        } else {
          nextKeys.delete(itemKey);
        }

        return nextKeys;
      });

      if (hasChildren) {
        animateMobileSubmenu(event.currentTarget, isOpening);
      }
    },
    [activeItemKeys, shownItemPath, cancelDropdownClose, animateMobileSubmenu]
  );

  /** Closes the menu immediately when the pointer leaves the complete navigation. */
  const handleNavigationMouseLeave = useCallback(() => {
    if (enableDropdown) {
      closeDropdowns();
    }
  }, [closeDropdowns, enableDropdown]);

  /** Keeps focus navigation open until focus moves completely outside this component. */
  const handleNavigationBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        closeDropdowns();
      }
    },
    [closeDropdowns]
  );

  /** Escape closes an open dropdown without changing or following any Sitecore link. */
  const handleNavigationKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') {
        closeDropdowns();
        // Clear click-open mobile submenus as well as the desktop hover path.
        setActiveItemKeys(new Set());
        submenuAnimationsRef.current.forEach((animation) => animation.cancel());
      }
    },
    [closeDropdowns]
  );

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }

      submenuAnimationsRef.current.forEach((animation) => animation.cancel());
      submenuAnimationsRef.current.clear();
    },
    []
  );

  return {
    isItemActive: (itemKey) => activeItemKeys.has(itemKey),
    isItemShown: (itemKey) => shownItemPath.includes(itemKey),
    handleItemMouseEnter,
    handleTopLevelFocus,
    handleTitleClick,
    cancelDropdownClose,
    scheduleDropdownClose,
    closeDropdowns,
    handleNavigationMouseLeave,
    handleNavigationBlur,
    handleNavigationKeyDown,
  };
};
