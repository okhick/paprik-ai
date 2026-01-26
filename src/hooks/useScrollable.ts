import { useState, useCallback, useMemo } from 'react';
import type { UseScrollableReturn } from '../types/tui.js';

/**
 * Options for the useScrollable hook
 */
interface UseScrollableOptions {
  /** Total number of items or lines in the content */
  totalItems: number;
  /** Initial viewport height (can be updated later) */
  initialViewportHeight?: number;
}

/**
 * Reusable hook for managing scrollable content with virtual rendering
 *
 * Provides scroll state, actions, and helpers for rendering only visible items.
 * Includes boundary checks to prevent scrolling past content limits.
 *
 * @param options - Configuration options
 * @returns Scroll state, actions, and indicators
 */
export function useScrollable(options: UseScrollableOptions): UseScrollableReturn {
  const { totalItems, initialViewportHeight = 10 } = options;

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(initialViewportHeight);

  // Clamp scroll offset to valid range [0, max]
  const clampScrollOffset = useCallback(
    (offset: number): number => {
      const maxOffset = Math.max(0, totalItems - viewportHeight);
      return Math.max(0, Math.min(offset, maxOffset));
    },
    [totalItems, viewportHeight]
  );

  // Scroll actions
  const scrollUp = useCallback(() => {
    setScrollOffset((prev) => clampScrollOffset(prev - 1));
  }, [clampScrollOffset]);

  const scrollDown = useCallback(() => {
    setScrollOffset((prev) => clampScrollOffset(prev + 1));
  }, [clampScrollOffset]);

  const pageUp = useCallback(() => {
    setScrollOffset((prev) => clampScrollOffset(prev - viewportHeight));
  }, [clampScrollOffset, viewportHeight]);

  const pageDown = useCallback(() => {
    setScrollOffset((prev) => clampScrollOffset(prev + viewportHeight));
  }, [clampScrollOffset, viewportHeight]);

  const scrollToTop = useCallback(() => {
    setScrollOffset(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    setScrollOffset(clampScrollOffset(totalItems));
  }, [clampScrollOffset, totalItems]);

  const resetScroll = useCallback(() => {
    setScrollOffset(0);
  }, []);

  // Scroll position indicators
  const hasMore = useMemo(() => {
    const above = scrollOffset > 0;
    const below = scrollOffset + viewportHeight < totalItems;
    return { above, below };
  }, [scrollOffset, viewportHeight, totalItems]);

  // Actions object
  const actions = useMemo(
    () => ({
      scrollUp,
      scrollDown,
      pageUp,
      pageDown,
      scrollToTop,
      scrollToBottom,
      setViewportHeight,
      resetScroll,
    }),
    [scrollUp, scrollDown, pageUp, pageDown, scrollToTop, scrollToBottom, resetScroll]
  );

  return {
    scrollOffset,
    viewportHeight,
    hasMore,
    actions,
  };
}

/**
 * Helper function to get visible items from an array based on scroll state
 *
 * @param items - Full array of items
 * @param scrollOffset - Current scroll offset
 * @param viewportHeight - Number of items visible in viewport
 * @returns Slice of visible items
 */
export function getVisibleItems<T>(items: T[], scrollOffset: number, viewportHeight: number): T[] {
  return items.slice(scrollOffset, scrollOffset + viewportHeight);
}

/**
 * Helper function to get visible lines from a string array based on scroll state
 *
 * @param lines - Full array of text lines
 * @param scrollOffset - Current scroll offset (line number)
 * @param viewportHeight - Number of lines visible in viewport
 * @returns Slice of visible lines
 */
export function getVisibleLines(
  lines: string[],
  scrollOffset: number,
  viewportHeight: number
): string[] {
  return lines.slice(scrollOffset, scrollOffset + viewportHeight);
}
