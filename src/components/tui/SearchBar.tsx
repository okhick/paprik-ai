import React from 'react';
import { Box, Text } from 'ink';
import { useAppState } from './AppContext.js';

/**
 * Search bar component for the recipe list pane
 *
 * Displays the current search query and active filters.
 * The actual input handling is done at the Layout level via useInput.
 */
export function SearchBar(): React.ReactElement {
  const state = useAppState();
  const {
    searchQuery,
    isSearchActive,
    filteredRecipes,
    recipes,
    selectedCategoryUids,
    categories,
  } = state;

  // Result count
  const resultCount = filteredRecipes.length;
  const totalCount = recipes.length;
  const hasFilters = searchQuery.trim() || selectedCategoryUids.length > 0;

  // Get selected category names
  const selectedCategoryNames = selectedCategoryUids
    .map((uid) => categories.find((cat) => cat.uid === uid)?.name)
    .filter(Boolean) as string[];

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Search input line */}
      <Box>
        <Text color="red" bold>
          Search:{' '}
        </Text>
        <Text color={'white'} dimColor={!isSearchActive}>
          {searchQuery || (isSearchActive ? '' : '(press / to search)')}
        </Text>
        {isSearchActive && <Text color="white">▊</Text>}
      </Box>

      {/* Category filters */}
      {selectedCategoryUids.length > 0 && (
        <Box marginTop={0}>
          <Text color="cyan" bold>
            Categories:{' '}
          </Text>
          <Text>{selectedCategoryNames.join(', ')}</Text>
          <Text dimColor> (x to clear)</Text>
        </Box>
      )}

      {/* Result count */}
      {hasFilters && (
        <Box marginTop={0}>
          <Text dimColor>{`${resultCount} of ${totalCount} recipes`}</Text>
        </Box>
      )}
    </Box>
  );
}
