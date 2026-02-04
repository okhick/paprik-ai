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
  const { searchQuery, isSearchActive, filteredRecipes, recipes } = state;

  // Result count
  const resultCount = filteredRecipes.length;
  const totalCount = recipes.length;
  const hasFilters = searchQuery.trim();

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Search input line */}
      <Box>
        <Text color="cyan" bold>
          Search:{' '}
        </Text>
        <Text color={isSearchActive ? 'yellow' : 'white'}>
          {searchQuery || (isSearchActive ? '' : '(press / to search)')}
        </Text>
        {isSearchActive && <Text color="yellow">▊</Text>}
      </Box>

      {/* Result count */}
      {hasFilters && (
        <Box marginTop={0}>
          <Text dimColor>{`${resultCount} of ${totalCount} recipes`}</Text>
        </Box>
      )}
    </Box>
  );
}
