import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppActions } from './AppContext.js';
import type { Category } from '../../types/recipe.js';
import type { FocusPane } from '../../types/tui.js';
import { ScrollView, ScrollViewRef } from 'ink-scroll-view';
import { ScrollBar } from '@byteland/ink-scroll-bar';

/**
 * Props for CategoryFilterPane component
 */
interface CategoryFilterPaneProps {
  height: number;
  activePaneId: FocusPane;
}

/**
 * Category with computed metadata for display
 */
interface CategoryWithMeta extends Category {
  recipeCount: number;
  depth: number;
}

/**
 * Category node for building tree
 */
interface CategoryNode extends CategoryWithMeta {
  children: CategoryNode[];
}

/**
 * Category filter pane for inline display in the layout
 *
 * Features:
 * - Scrollable list of all categories
 * - Visual selection indicator: [x] selected / [ ] unselected
 * - Nested categories with indentation
 * - Recipe count per category
 * - Keyboard controls: Up/Down, Space/Enter, x to clear, Escape to close
 */
export function CategoryFilterPane({
  height,
  activePaneId,
}: CategoryFilterPaneProps): React.ReactElement {
  const state = useAppState();
  const actions = useAppActions();
  const { categories, recipes, selectedCategoryUids } = state;
  const { toggleCategoryFilter, setIsCategoryFilterActive, clearCategoryFilters, setActivePaneId } =
    actions;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<ScrollViewRef>(null);
  const [scrollBarOffset, setScrollBarOffset] = useState(0);
  const [scrollBarSize, setScrollBarSize] = useState(0);

  const isFocused = activePaneId === 'categories';

  const updateScrollbarMetrics = () => {
    setScrollBarOffset(scrollRef.current?.getScrollOffset() ?? 0);
    setScrollBarSize(scrollRef.current?.getContentHeight() ?? 0);
  };

  // Prepare categories with metadata in tree order
  const categoriesWithMeta = useMemo(() => {
    // Build category map
    const categoryMap = new Map<string, CategoryNode>();

    // Initialize all categories
    categories.forEach((cat) => {
      categoryMap.set(cat.uid, {
        ...cat,
        recipeCount: 0,
        depth: 0,
        children: [],
      });
    });

    // Count recipes per category
    recipes.forEach((recipe) => {
      recipe.categories?.forEach((cat) => {
        const meta = categoryMap.get(cat.uid);
        if (meta) {
          meta.recipeCount++;
        }
      });
    });

    // Build tree structure
    const rootCategories: CategoryNode[] = [];

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.uid)!;

      if (cat.parent_uid) {
        const parent = categoryMap.get(cat.parent_uid);
        if (parent) {
          parent.children.push(category);
        } else {
          // Parent not found, treat as root
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Sort children at each level by order_flag, then name
    const sortCategories = (cats: CategoryNode[]) => {
      cats.sort((a, b) => {
        if (a.order_flag !== b.order_flag) {
          return (a.order_flag ?? 0) - (b.order_flag ?? 0);
        }
        return a.name.localeCompare(b.name);
      });
      cats.forEach((cat) => {
        if (cat.children.length > 0) {
          sortCategories(cat.children);
        }
      });
    };

    sortCategories(rootCategories);

    // Flatten tree in depth-first order with proper depth
    const flattenedTree: CategoryWithMeta[] = [];

    const flattenTree = (cats: CategoryNode[], depth: number) => {
      cats.forEach((cat) => {
        flattenedTree.push({
          uid: cat.uid,
          name: cat.name,
          order_flag: cat.order_flag,
          parent_uid: cat.parent_uid,
          recipeCount: cat.recipeCount,
          depth: depth,
        });

        if (cat.children.length > 0) {
          flattenTree(cat.children, depth + 1);
        }
      });
    };

    flattenTree(rootCategories, 0);

    return flattenedTree;
  }, [categories, recipes]);

  // Scroll to keep a given index visible and update scrollbar
  const scrollToIndex = (index: number) => {
    const viewportHeight = scrollRef.current?.getViewportHeight() ?? 0;
    const currentOffset = scrollRef.current?.getScrollOffset() ?? 0;

    if (index < currentOffset) {
      scrollRef.current?.scrollTo(index);
    } else if (index >= currentOffset + viewportHeight) {
      scrollRef.current?.scrollTo(index - viewportHeight + 1);
    }

    updateScrollbarMetrics();
  };

  // Initial scrollbar measurement after mount
  useEffect(() => {
    const timer = setImmediate(() => updateScrollbarMetrics());
    return () => clearImmediate(timer);
  }, []);

  // Handle keyboard input (only when this pane is focused)
  useInput(
    (input, key) => {
      // Navigate up
      if (key.upArrow) {
        setSelectedIndex((prev) => {
          const next = Math.max(0, prev - 1);
          scrollToIndex(next);
          return next;
        });
        return;
      }

      // Navigate down
      if (key.downArrow) {
        setSelectedIndex((prev) => {
          const next = Math.min(categoriesWithMeta.length - 1, prev + 1);
          scrollToIndex(next);
          return next;
        });
        return;
      }

      // Toggle selection with Space or Enter
      if (input === ' ' || key.return) {
        if (categoriesWithMeta[selectedIndex]) {
          toggleCategoryFilter(categoriesWithMeta[selectedIndex].uid);
        }
        return;
      }

      // Clear all selections
      if (input === 'x') {
        clearCategoryFilters();
        return;
      }

      // Close pane with Escape
      if (key.escape) {
        setIsCategoryFilterActive(false);
        setActivePaneId('list');
        return;
      }
    },
    { isActive: isFocused }
  );

  return (
    <Box flexDirection="row" height={height}>
      {categoriesWithMeta.length === 0 ? (
        <Text dimColor>No categories available</Text>
      ) : (
        <>
          <ScrollView ref={scrollRef} marginRight={1}>
            {categoriesWithMeta.map((category, idx) => {
              const isSelected = selectedCategoryUids.includes(category.uid);
              const isHighlighted = selectedIndex === idx;
              const indent = '  '.repeat(category.depth);

              return (
                <Box key={category.uid}>
                  <Text
                    inverse={isHighlighted && isFocused}
                    color={isSelected ? 'cyan' : undefined}
                  >
                    {indent}
                    {isSelected ? '[✓]' : '[ ]'} {category.name} ({category.recipeCount})
                  </Text>
                </Box>
              );
            })}
          </ScrollView>
          <ScrollBar
            placement="inset"
            dimColor
            viewportHeight={scrollRef.current?.getViewportHeight() ?? 0}
            contentHeight={scrollBarSize}
            scrollOffset={scrollBarOffset}
          />
        </>
      )}
    </Box>
  );
}
