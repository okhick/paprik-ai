import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppActions } from './AppContext.js';
import { useScrollable, getVisibleItems } from '../../hooks/useScrollable.js';
import { SearchBar } from './SearchBar.js';
import type { Recipe } from '../../types/recipe.js';

/**
 * Props for RecipeListPane component
 */
interface RecipeListPaneProps {
  /** Available height for the list content */
  height: number;
}

/**
 * Recipe list pane component
 *
 * Displays a scrollable list of recipes with selection, filtering, and search support.
 * Uses virtual scrolling for performance with large collections.
 */
export function RecipeListPane({ height }: RecipeListPaneProps): React.ReactElement {
  const state = useAppState();
  const actions = useAppActions();

  const { filteredRecipes, selectedRecipeId, activePaneId, isSearchActive } = state;

  // Track selected index (position in filtered list)
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Account for UI elements that take up space:
  // - SearchBar: 2-3 rows (depends on filters)
  // - Scroll indicator above: 1 row (conditional)
  // - Scroll indicator below: 1 row (conditional)
  // - Position indicator: 2 rows
  // Be conservative and reserve ~6 rows for UI chrome
  const uiChromeHeight = 6;
  const listViewportHeight = Math.max(5, height - uiChromeHeight);

  // Set up scrolling with the filtered recipes
  const scroll = useScrollable({
    totalItems: filteredRecipes.length,
    initialViewportHeight: listViewportHeight,
  });

  // Update viewport height when pane height changes
  useEffect(() => {
    scroll.actions.setViewportHeight(listViewportHeight);
  }, [listViewportHeight, scroll.actions]);

  // Reset selection when filtered recipes change
  useEffect(() => {
    setSelectedIndex(0);
    scroll.actions.resetScroll();
  }, [filteredRecipes, scroll.actions]);

  // Update context when selection changes
  useEffect(() => {
    if (filteredRecipes.length > 0 && selectedIndex < filteredRecipes.length) {
      const selectedRecipe = filteredRecipes[selectedIndex];
      if (selectedRecipe && selectedRecipe.uid !== selectedRecipeId) {
        actions.setSelectedRecipe(selectedRecipe.uid);
      }
    } else if (filteredRecipes.length === 0) {
      actions.setSelectedRecipe(null);
    }
  }, [selectedIndex, filteredRecipes, selectedRecipeId, actions]);

  // Keyboard navigation for list (only when list pane is focused and search not active)
  useInput(
    (_input, key) => {
      // Only handle navigation when list pane is focused and search is not active
      if (activePaneId !== 'list' || isSearchActive) {
        return;
      }

      const maxIndex = filteredRecipes.length - 1;

      // Up arrow: move selection up
      if (key.upArrow) {
        const newIndex = Math.max(0, selectedIndex - 1);
        setSelectedIndex(newIndex);
        // Ensure selection is visible
        if (newIndex < scroll.scrollOffset) {
          scroll.actions.scrollUp();
        }
        return;
      }

      // Down arrow: move selection down
      if (key.downArrow) {
        const newIndex = Math.min(maxIndex, selectedIndex + 1);
        setSelectedIndex(newIndex);
        // Ensure selection is visible
        if (newIndex >= scroll.scrollOffset + scroll.viewportHeight) {
          scroll.actions.scrollDown();
        }
        return;
      }

      // Page Down: jump down by page
      if (key.pageDown) {
        const newIndex = Math.min(maxIndex, selectedIndex + listViewportHeight);
        setSelectedIndex(newIndex);
        // Scroll to keep selection visible
        if (newIndex >= scroll.scrollOffset + listViewportHeight) {
          scroll.actions.pageDown();
        }
        return;
      }

      // Page Up: jump up by page
      if (key.pageUp) {
        const newIndex = Math.max(0, selectedIndex - listViewportHeight);
        setSelectedIndex(newIndex);
        // Scroll to keep selection visible
        if (newIndex < scroll.scrollOffset) {
          scroll.actions.pageUp();
        }
        return;
      }
    },
    { isActive: activePaneId === 'list' && !isSearchActive }
  );

  // Get visible recipes for rendering
  const visibleRecipes = getVisibleItems(filteredRecipes, scroll.scrollOffset, listViewportHeight);

  // Render recipe list
  return (
    <Box flexDirection="column">
      {/* Search bar */}
      <SearchBar />

      {/* Handle empty state */}
      {filteredRecipes.length === 0 ? (
        <Box flexDirection="column" padding={1}>
          <Text color="gray">No recipes found</Text>
          <Text color="gray" dimColor>
            {state.searchQuery || state.showFavorites
              ? 'Try adjusting your search or filters (Esc to clear)'
              : 'Run "paprik-ai sync" to download recipes from Paprika'}
          </Text>
        </Box>
      ) : (
        <>
          {/* Scroll indicator - above */}
          {scroll.hasMore.above && <Text dimColor>↑ {scroll.scrollOffset} more above</Text>}

          {/* Visible recipes */}
          {visibleRecipes.map((recipe, idx) => {
            const absoluteIndex = scroll.scrollOffset + idx;
            const isSelected = absoluteIndex === selectedIndex;

            return (
              <RecipeListItem
                key={recipe.uid}
                recipe={recipe}
                isSelected={isSelected}
                index={absoluteIndex}
              />
            );
          })}

          {/* Scroll indicator - below */}
          {scroll.hasMore.below && (
            <Text dimColor>
              ↓ {filteredRecipes.length - (scroll.scrollOffset + listViewportHeight)} more below
            </Text>
          )}

          {/* Position indicator */}
          <Box marginTop={1}>
            <Text dimColor>
              Recipe {selectedIndex + 1}/{filteredRecipes.length}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
}

/**
 * Individual recipe list item component
 */
interface RecipeListItemProps {
  recipe: Recipe;
  isSelected: boolean;
  index: number;
}

function RecipeListItem({ recipe, isSelected }: RecipeListItemProps): React.ReactElement {
  // Truncate name if too long (approximate width limit)
  const maxNameLength = 40; // Adjust based on pane width
  const displayName =
    recipe.name.length > maxNameLength
      ? recipe.name.slice(0, maxNameLength - 1) + '…'
      : recipe.name;

  // Use different styling based on selection state
  const textColor = isSelected ? 'white' : undefined;

  return (
    <Box paddingLeft={1}>
      {/* Render with selection highlighting */}
      <Box width="100%">
        <Text bold color={textColor} inverse={isSelected}>
          {displayName}
        </Text>
      </Box>
    </Box>
  );
}
