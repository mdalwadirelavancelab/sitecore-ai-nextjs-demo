import {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  RefObject,
  TouchEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export type DsiCarouselNavigation =
  | 'bullets'
  | 'bullets-prevnext'
  | 'numbers'
  | 'numbers-prevnext'
  | 'prevnext'
  | 'none';

export type DsiCarouselTransition = 'Basic' | 'Fade' | 'SlideH' | 'SlideV';

type TransitionState = {
  fromIndex: number;
  toIndex: number;
  direction: 1 | -1;
  name: DsiCarouselTransition;
  phase: 'prepared' | 'running';
};

type UseDsiCarouselOptions = {
  slideCount: number;
  timeout: number;
  pauseOnHover: boolean;
  transition: DsiCarouselTransition;
};

type UseDsiCarouselResult = {
  rootRef: RefObject<HTMLDivElement | null>;
  wrapperRef: RefObject<HTMLDivElement | null>;
  activeIndex: number;
  slideInfoMinHeight?: number;
  getSlideStyle: (index: number) => CSSProperties;
  goToSlide: (index: number) => void;
  showPrevious: () => void;
  showNext: () => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleNavigationFocus: () => void;
  handleNavigationBlur: (event: FocusEvent<HTMLElement>) => void;
  handleNavigationKeyDown: (event: KeyboardEvent<HTMLElement>, index: number) => void;
  handleTouchStart: (event: TouchEvent<HTMLElement>) => void;
  handleTouchMove: (event: TouchEvent<HTMLElement>) => void;
  handleTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  handleTouchCancel: () => void;
};

const DEFAULT_TIMEOUT = 5000;
const FADE_DURATION = 300;
const SLIDE_DURATION = 400;
const SWIPE_DISTANCE = 50;

/**
 * Converts the Sitecore Carousel Navigation parameter to the SXA-compatible value
 * used by the existing markup and styles.
 */
export const getDsiCarouselNavigation = (value?: string): DsiCarouselNavigation => {
  const navigationMap: Record<string, DsiCarouselNavigation> = {
    Bullets: 'bullets',
    BulletsWithPreviousNext: 'bullets-prevnext',
    Numbers: 'numbers',
    NumbersWithPreviousNext: 'numbers-prevnext',
    PreviousNext: 'prevnext',
    None: 'none',
  };

  return navigationMap[value ?? ''] ?? 'bullets';
};

/** Converts the Sitecore transition item name to the matching SXA-style transition. */
export const getDsiCarouselTransition = (value?: string): DsiCarouselTransition => {
  const transitionMap: Record<string, DsiCarouselTransition> = {
    BasicTransition: 'Basic',
    FadeInTransition: 'Fade',
    SlideHorizontallyTransition: 'SlideH',
    SlideVerticallyTransition: 'SlideV',
  };

  return transitionMap[value ?? ''] ?? 'Basic';
};

/** Accepts the Sitecore checkbox values used by Layout Service (for example, "1" or "true"). */
export const getDsiCarouselBoolean = (value?: string): boolean =>
  value === '1' || value?.toLowerCase() === 'true';

/**
 * Keeps the same timeout rules as xa.carousel.js: blank/zero disables autoplay,
 * a valid number is used as-is, and an invalid non-blank value uses the SXA default.
 */
export const getDsiCarouselTimeout = (value?: string): number => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsedTimeout = Number(value);
  return Number.isNaN(parsedTimeout) ? DEFAULT_TIMEOUT : parsedTimeout;
};

/**
 * DSI React/TypeScript equivalent of the Sitecore SXA-style Carousel behaviour that was
 * previously provided by public/scripts/xa.carousel.js. It intentionally preserves
 * SXA navigation, timing, transition, keyboard, focus, swipe, height, and event rules
 * while allowing React—not jQuery—to own the rendered component state.
 */
export const useDsiCarousel = ({
  slideCount,
  timeout,
  pauseOnHover,
  transition,
}: UseDsiCarouselOptions): UseDsiCarouselResult => {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scheduledSlideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const secondAnimationFrameRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const elapsedTimeRef = useRef(0);
  const timerStartedAtRef = useRef<number | null>(null);
  const pauseReasonsRef = useRef(new Set<'hover' | 'focus'>());
  const changeSlideByRef = useRef<(offset: number) => void>(() => undefined);
  const touchRef = useRef({
    isTouching: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  });
  const hasRenderedRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionState, setTransitionState] = useState<TransitionState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [slideInfoMinHeight, setSlideInfoMinHeight] = useState<number>();

  /** Stops the current autoplay schedule and optionally remembers its elapsed time. */
  const descheduleSlide = useCallback((rememberElapsedTime: boolean) => {
    if (scheduledSlideRef.current !== null) {
      clearTimeout(scheduledSlideRef.current);
      scheduledSlideRef.current = null;
    }

    if (rememberElapsedTime && timerStartedAtRef.current !== null) {
      elapsedTimeRef.current += Date.now() - timerStartedAtRef.current;
    }

    timerStartedAtRef.current = null;
  }, []);

  const resetTimer = useCallback(() => {
    elapsedTimeRef.current = 0;
    timerStartedAtRef.current = null;
  }, []);

  /** Completes a transition and returns all slides to their normal, non-animated layout. */
  const completeSlideChange = useCallback(
    (newIndex: number) => {
      activeIndexRef.current = newIndex;
      setActiveIndex(newIndex);
      setTransitionState(null);
      isTransitioningRef.current = false;
      resetTimer();
    },
    [resetTimer]
  );

  /** Changes by a relative offset and wraps at the first/last slide, matching SXA. */
  const changeSlideBy = useCallback(
    (offset: number) => {
      if (slideCount <= 1 || isTransitioningRef.current) {
        return;
      }

      const normalizedOffset = offset % slideCount;
      if (normalizedOffset === 0) {
        return;
      }

      const fromIndex = activeIndexRef.current;
      const toIndex = (fromIndex + normalizedOffset + slideCount) % slideCount;

      descheduleSlide(false);

      // The Basic transition is immediate, just like jQuery hide()/show().
      if (transition === 'Basic') {
        completeSlideChange(toIndex);
        return;
      }

      isTransitioningRef.current = true;
      setTransitionState({
        fromIndex,
        toIndex,
        direction: normalizedOffset > 0 ? 1 : -1,
        name: transition,
        phase: 'prepared',
      });
    },
    [completeSlideChange, descheduleSlide, slideCount, transition]
  );

  // The autoplay callback always uses the newest slide count, index, and transition settings.
  changeSlideByRef.current = changeSlideBy;

  /** Starts autoplay with any time remaining from a hover/focus pause. */
  const scheduleSlide = useCallback(() => {
    descheduleSlide(false);

    if (timeout <= 0 || isPaused || slideCount <= 1 || isTransitioningRef.current) {
      return;
    }

    const remainingTime = Math.max(0, timeout - elapsedTimeRef.current);
    timerStartedAtRef.current = Date.now();
    scheduledSlideRef.current = setTimeout(() => {
      scheduledSlideRef.current = null;
      timerStartedAtRef.current = null;
      changeSlideByRef.current(1);
    }, remainingTime);
  }, [descheduleSlide, isPaused, slideCount, timeout]);

  /**
   * The prepared render places the incoming slide just outside the carousel. Two
   * animation frames then let the browser animate both slides to their final positions.
   */
  useEffect(() => {
    if (!transitionState) {
      return;
    }

    if (transitionState.phase === 'prepared') {
      animationFrameRef.current = window.requestAnimationFrame(() => {
        secondAnimationFrameRef.current = window.requestAnimationFrame(() => {
          setTransitionState((current) => (current ? { ...current, phase: 'running' } : current));
        });
      });

      return () => {
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
        if (secondAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(secondAnimationFrameRef.current);
        }
      };
    }

    const duration = transitionState.name === 'Fade' ? FADE_DURATION : SLIDE_DURATION;
    animationTimerRef.current = setTimeout(
      () => completeSlideChange(transitionState.toIndex),
      duration
    );

    return () => {
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [completeSlideChange, transitionState]);

  // Schedule only when no transition is running; cleanup prevents duplicate timers.
  useEffect(() => {
    if (!transitionState) {
      scheduleSlide();
    }

    return () => descheduleSlide(false);
  }, [activeIndex, descheduleSlide, scheduleSlide, transitionState]);

  // Keep the active index valid if Sitecore adds or removes datasource children.
  useEffect(() => {
    isTransitioningRef.current = false;
    setTransitionState(null);
    resetTimer();
    setActiveIndex((currentIndex) => {
      const validIndex = slideCount > 0 ? Math.min(currentIndex, slideCount - 1) : 0;
      activeIndexRef.current = validIndex;
      return validIndex;
    });
  }, [resetTimer, slideCount]);

  // Keep the original custom event so any existing integration can still react to a change.
  useEffect(() => {
    if (!hasRenderedRef.current) {
      hasRenderedRef.current = true;
      return;
    }

    rootRef.current?.dispatchEvent(new CustomEvent('slide-changed'));
  }, [activeIndex]);

  /** Reproduces the SXA helper that gives every slide-info block the tallest minimum height. */
  const normalizeSlideInfoHeight = useCallback(() => {
    const slideInfoElements = wrapperRef.current?.querySelectorAll<HTMLElement>('.slide-info');
    if (!slideInfoElements?.length) {
      return;
    }

    let maximumHeight = 0;
    slideInfoElements.forEach((element) => {
      maximumHeight = Math.max(
        maximumHeight,
        element.scrollHeight,
        element.getBoundingClientRect().height
      );
    });

    if (maximumHeight > 0) {
      setSlideInfoMinHeight(Math.ceil(maximumHeight));
    }
  }, []);

  useEffect(() => {
    const initialHeightTimer = setTimeout(normalizeSlideInfoHeight, 50);
    window.addEventListener('resize', normalizeSlideInfoHeight);

    return () => {
      clearTimeout(initialHeightTimer);
      window.removeEventListener('resize', normalizeSlideInfoHeight);
    };
  }, [normalizeSlideInfoHeight, slideCount]);

  /** Applies a named pause reason so hover and keyboard focus cannot incorrectly cancel each other. */
  const pause = useCallback(
    (reason: 'hover' | 'focus') => {
      if (!pauseOnHover || pauseReasonsRef.current.has(reason)) {
        return;
      }

      pauseReasonsRef.current.add(reason);
      descheduleSlide(true);
      setIsPaused(true);
    },
    [descheduleSlide, pauseOnHover]
  );

  const resume = useCallback((reason: 'hover' | 'focus') => {
    pauseReasonsRef.current.delete(reason);
    if (pauseReasonsRef.current.size === 0) {
      setIsPaused(false);
    }
  }, []);

  useEffect(() => {
    if (!pauseOnHover) {
      pauseReasonsRef.current.clear();
      setIsPaused(false);
    }
  }, [pauseOnHover]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= slideCount) {
        return;
      }
      changeSlideBy(index - activeIndexRef.current);
    },
    [changeSlideBy, slideCount]
  );

  const showPrevious = useCallback(() => changeSlideBy(-1), [changeSlideBy]);
  const showNext = useCallback(() => changeSlideBy(1), [changeSlideBy]);

  const handleNavigationBlur = useCallback(
    (event: FocusEvent<HTMLElement>) => {
      // Moving between controls keeps the focus pause active.
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
        return;
      }
      resume('focus');
    },
    [resume]
  );

  const handleNavigationKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        goToSlide(index);
      }
    },
    [goToSlide, showNext, showPrevious]
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    touchRef.current = {
      isTouching: true,
      startX: touch.pageX,
      startY: touch.pageY,
      deltaX: 0,
      deltaY: 0,
    };
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent<HTMLElement>) => {
    if (!touchRef.current.isTouching || event.touches.length === 0) {
      return;
    }

    const touch = event.touches[0];
    touchRef.current.deltaX = touch.pageX - touchRef.current.startX;
    touchRef.current.deltaY = touch.pageY - touchRef.current.startY;
  }, []);

  const resetTouch = useCallback(() => {
    touchRef.current.isTouching = false;
    touchRef.current.deltaX = 0;
    touchRef.current.deltaY = 0;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const { deltaX, deltaY } = touchRef.current;
      resetTouch();

      if (Math.abs(deltaX) > SWIPE_DISTANCE && Math.abs(deltaX) > Math.abs(deltaY)) {
        event.preventDefault();
        if (deltaX < 0) {
          showNext();
        } else {
          showPrevious();
        }
      }
    },
    [resetTouch, showNext, showPrevious]
  );

  /** Returns the inline animation style for one slide; normal styles are restored afterward. */
  const getSlideStyle = useCallback(
    (index: number): CSSProperties => {
      if (!transitionState) {
        return { display: index === activeIndex ? 'block' : 'none' };
      }

      const isOutgoing = index === transitionState.fromIndex;
      const isIncoming = index === transitionState.toIndex;
      if (!isOutgoing && !isIncoming) {
        return { display: 'none' };
      }

      const isRunning = transitionState.phase === 'running';
      const direction = transitionState.direction;

      if (transitionState.name === 'Fade') {
        return {
          display: 'block',
          opacity: isOutgoing ? (isRunning ? 0 : 1) : isRunning ? 1 : 0,
          transition: isRunning ? `opacity ${FADE_DURATION}ms ease` : 'none',
        };
      }

      if (transitionState.name === 'SlideH') {
        const preparedLeft = isOutgoing ? '0%' : direction > 0 ? '100%' : '-100%';
        const runningLeft = isOutgoing ? (direction > 0 ? '-100%' : '100%') : '0%';
        return {
          display: 'block',
          position: 'absolute',
          left: isRunning ? runningLeft : preparedLeft,
          top: 0,
          width: '100%',
          transition: isRunning ? `left ${SLIDE_DURATION}ms ease` : 'none',
        };
      }

      const preparedTop = isOutgoing ? '0%' : direction > 0 ? '100%' : '-100%';
      const runningTop = isOutgoing ? (direction > 0 ? '-100%' : '100%') : '0%';
      return {
        display: 'block',
        position: 'absolute',
        left: 0,
        top: isRunning ? runningTop : preparedTop,
        width: '100%',
        transition: isRunning ? `top ${SLIDE_DURATION}ms ease` : 'none',
      };
    },
    [activeIndex, transitionState]
  );

  return {
    rootRef,
    wrapperRef,
    activeIndex,
    slideInfoMinHeight,
    getSlideStyle,
    goToSlide,
    showPrevious,
    showNext,
    handleMouseEnter: () => pause('hover'),
    handleMouseLeave: () => resume('hover'),
    handleNavigationFocus: () => pause('focus'),
    handleNavigationBlur,
    handleNavigationKeyDown,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel: resetTouch,
  };
};
