import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { useAppState } from './AppContext.js';
import type { Recipe, Category } from '../../types/recipe.js';
import { ScrollView, ScrollViewRef } from 'ink-scroll-view';
import { ScrollBar } from '@byteland/ink-scroll-bar';
import { hasContent, isSectionHeader, splitLinesPreservingInternal } from '../../utils/text.js';
import { parseMarkdownText, TrimLeadingWhitespace } from '../../utils/text-components.js';

/**
 * Recipe detail pane component
 *
 * Displays the full details of the selected recipe with scrolling support.
 * Formats content into readable sections and handles missing fields gracefully.
 */
export function RecipeDetailPane(): React.ReactElement {
  const state = useAppState();
  const { stdout } = useStdout();
  const { recipes, selectedRecipeId, activePaneId, categories: allCategories } = state;

  const scrollRef = useRef<ScrollViewRef>(null);

  const [scrollBarOffset, setScrollBarOffset] = useState(0);
  const [scrollBarSize, setScrollBarSize] = useState(0);

  // Find the selected recipe
  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.uid === selectedRecipeId),
    [recipes, selectedRecipeId]
  );

  // Update scrollbar metrics helper
  const updateScrollbarMetrics = () => {
    setScrollBarOffset(scrollRef.current?.getScrollOffset() ?? 0);
    setScrollBarSize(scrollRef.current?.getContentHeight() ?? 0);
  };

  // Reset scroll position when selected recipe changes
  useEffect(() => {
    scrollRef.current?.scrollToTop();
    updateScrollbarMetrics();
  }, [selectedRecipeId]);

  // Handle Terminal Resizing due to manual window change
  useEffect(() => {
    const handleResize = () => {
      scrollRef.current?.remeasure();
      updateScrollbarMetrics();
    };
    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  // Keyboard navigation for scrolling (only when detail pane is focused)
  useInput(
    (_input, key) => {
      // Up arrow: scroll up
      if (key.upArrow) {
        scrollRef.current?.scrollBy(-1); // Scroll up 1 line
        updateScrollbarMetrics();
      }
      if (key.downArrow) {
        // Stop scrolling if at bottom
        const contentLength = (scrollRef.current?.getContentHeight() ?? 0) - 1;
        const viewHeight = scrollRef.current?.getViewportHeight() ?? 0;
        const amountScrolled = scrollRef.current?.getScrollOffset() ?? 0;
        const canScrollMore = amountScrolled + viewHeight < contentLength;
        if (!canScrollMore) {
          return;
        }
        scrollRef.current?.scrollBy(1);
        updateScrollbarMetrics();
      }
    },
    { isActive: activePaneId === 'detail' }
  );

  const renderedLines = useMemo(() => {
    if (selectedRecipe == null) {
      return [];
    }
    return format(selectedRecipe, allCategories);
  }, [selectedRecipe, allCategories]);

  // Update scrollbar metrics after content renders
  // Note: We need to defer this slightly because ScrollView measures content asynchronously
  useEffect(() => {
    const timer = setImmediate(() => updateScrollbarMetrics());
    return () => clearImmediate(timer);
  }, [renderedLines]);

  // Handle no recipe selected
  if (!selectedRecipe) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray" dimColor>
          No recipe selected
        </Text>
        <Text color="gray" dimColor>
          Select a recipe from the list to view details
        </Text>
      </Box>
    );
  }

  // Render detail content
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" margin={1}>
        <ScrollView ref={scrollRef} marginRight={1}>
          {renderedLines}
        </ScrollView>
        <ScrollBar
          placement="inset"
          dimColor
          viewportHeight={scrollRef.current?.getViewportHeight() ?? 0}
          contentHeight={scrollBarSize}
          scrollOffset={scrollBarOffset}
        />
      </Box>
    </Box>
  );
}

/**
 * Build the full path for a category by walking up parent_uid references.
 * Returns names from root to leaf, e.g. ["Dinner", "Italian", "Pasta"].
 */
function getCategoryPath(category: Category, allCategories: Category[]): string[] {
  const path: string[] = [];
  const categoryMap = new Map(allCategories.map((c) => [c.uid, c]));
  const visited = new Set<string>();
  let current: Category | undefined = category;

  while (current && !visited.has(current.uid)) {
    visited.add(current.uid);
    path.unshift(current.name);
    current = current.parent_uid ? categoryMap.get(current.parent_uid) : undefined;
  }

  return path;
}

function format(recipe: Recipe, allCategories: Category[]): React.JSX.Element[] {
  const formatted = [];

  const boxDivider = {
    borderBottom: true,
    borderTop: false,
    borderRight: false,
    borderLeft: false,
  };

  formatted.push(
    <Box borderStyle={'bold'} {...boxDivider} marginBottom={1}>
      <Text bold>{recipe.name}</Text>
    </Box>
  );

  // Display categories if present, showing full parent > child paths
  if (recipe.categories && recipe.categories.length > 0) {
    const categoryPaths = recipe.categories.map((c) =>
      getCategoryPath(c, allCategories).join(' / ')
    );
    // Remove paths that are a prefix of a longer path (e.g. "Dinner" when "Dinner > Italian" exists)
    const dedupedPaths = categoryPaths.filter(
      (path) => !categoryPaths.some((other) => other !== path && other.startsWith(path + ' / '))
    );
    formatted.push(
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Categories</Text>
        {...dedupedPaths.map((path) => <Text> {path}</Text>)}
      </Box>
    );
  }

  const metadata: React.JSX.Element[] = [];
  const pushMetadata = (label: string, value: string) => {
    metadata.push(
      <Box>
        <Text dimColor>{label} </Text>
        <Text>{value}</Text>
      </Box>
    );
  };
  if (recipe.prep_time) {
    pushMetadata('Prep Time', recipe.prep_time);
  }
  if (recipe.cook_time) {
    pushMetadata('Cook Time', recipe.cook_time);
  }
  if (recipe.total_time) {
    pushMetadata('Total Time', recipe.total_time);
  }
  if (recipe.servings) {
    pushMetadata('Servings', recipe.servings);
  }
  if (recipe.difficulty) {
    pushMetadata('Difficulty', recipe.difficulty);
  }

  if (metadata.length > 0) {
    formatted.push(
      <Box flexDirection={'column'} borderStyle={'single'} {...boxDivider} marginBottom={1}>
        {...metadata}
      </Box>
    );
  }

  if (hasContent(recipe.description)) {
    formatted.push(
      <Box borderStyle={'single'} {...boxDivider} marginBottom={1}>
        <TrimLeadingWhitespace>
          <Text>{recipe.description}</Text>
        </TrimLeadingWhitespace>
      </Box>
    );
  }

  if (recipe.ingredients != null) {
    const ingredients = parseIngredients(recipe.ingredients);

    formatted.push(
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Ingredients</Text>
        </Box>
        {...ingredients.map((ing) => <Box>{ing}</Box>)}
      </Box>
    );
  }

  if (recipe.directions != null) {
    const splitRecipeDirections = splitLinesPreservingInternal(recipe.directions);
    formatted.push(
      <Box flexDirection="column" borderStyle="bold" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Directions</Text>
        </Box>
        {...splitRecipeDirections.map((dir, idx) => {
          // Preserve empty lines
          if (dir.trim() === '') {
            return <Text> </Text>;
          }

          return (
            <Box marginBottom={idx === splitRecipeDirections.length - 1 ? 1 : 0}>
              <TrimLeadingWhitespace>{parseMarkdownText(dir)}</TrimLeadingWhitespace>
            </Box>
          );
        })}
      </Box>
    );
  }

  if (hasContent(recipe.notes)) {
    formatted.push(
      <Box flexDirection="column" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Notes</Text>
        </Box>
        <TrimLeadingWhitespace>
          <Text>{recipe.notes}</Text>
        </TrimLeadingWhitespace>
      </Box>
    );
  }

  if (hasContent(recipe.source) || hasContent(recipe.source_url)) {
    formatted.push(
      <Box flexDirection="column" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Source</Text>
        </Box>
        {hasContent(recipe.source) && (
          <TrimLeadingWhitespace>
            <Text>{recipe.source}</Text>
          </TrimLeadingWhitespace>
        )}
        {hasContent(recipe.source_url) && (
          <TrimLeadingWhitespace>
            <Text>{recipe.source_url}</Text>
          </TrimLeadingWhitespace>
        )}
      </Box>
    );

    if (hasContent(recipe.nutritional_info)) {
      formatted.push(
        <Box flexDirection="column" {...boxDivider} marginBottom={1}>
          <Box marginBottom={1}>
            <Text dimColor>Nutritional Info</Text>
          </Box>
          <TrimLeadingWhitespace>
            <Text>{recipe.nutritional_info}</Text>
          </TrimLeadingWhitespace>
        </Box>
      );
    }
  }

  return formatted;
}

/**
 * Parse ingredients from JSON string or plain text
 */
function parseIngredients(ingredientsStr: string): React.JSX.Element[] {
  const ingredientsSplit = splitLinesPreservingInternal(ingredientsStr);

  return ingredientsSplit.map((line, index) => {
    const trimmed = line.trim();
    // Preserve empty lines
    if (trimmed === '') {
      return <Text> </Text>;
    }

    // Bold if the last character is a colon (section header)
    if (isSectionHeader(trimmed)) {
      // If the previous line is a space, then we don't need more space
      const needsSpace = ingredientsSplit.at(index - 1)?.trim() !== '' && index > 0;
      return (
        <Box marginTop={needsSpace ? 1 : 0}>
          <TrimLeadingWhitespace>{parseMarkdownText(trimmed)}</TrimLeadingWhitespace>
        </Box>
      );
    }
    return (
      <Text>
        • <TrimLeadingWhitespace>{parseMarkdownText(trimmed)}</TrimLeadingWhitespace>
      </Text>
    );
  });
}
