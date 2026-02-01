import React, { useEffect, useState, useMemo } from 'react';
import { useStdout, Text, Box } from 'ink';
import { AppProvider, useAppActions } from './AppContext.js';
import { Layout } from './Layout.js';
import { RecipeListPane } from './RecipeListPane.js';
import { RecipeDetailPane } from './RecipeDetailPane.js';
import { RecipeRepository } from '../../db/repositories/recipes.js';

/**
 * Simple loading screen component
 */
function LoadingScreen() {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" padding={2}>
      <Text color="green" bold>
        Loading recipes...
      </Text>
      <Text>Please wait while we prepare your recipes</Text>
    </Box>
  );
}

/**
 * Inner component that loads recipes from the database
 *
 * Must be inside AppProvider to access context actions
 */
function TuiAppInner(): React.ReactElement {
  const actions = useAppActions();
  const { stdout } = useStdout();
  // Simple loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load recipes on mount with proper error handling
  useEffect(() => {
    let mounted = true;
    console.log('Loading recipes from database...');

    // Add fail-safe timer to prevent infinite loading
    const timer = setTimeout(() => {
      if (mounted && isLoading) {
        console.log('Failsafe timer triggered - forcing loading to false');
        setIsLoading(false);
      }
    }, 3000);

    try {
      // Create recipe repository and get all recipes
      const repo = new RecipeRepository();
      const recipes = repo.getAll();

      // Update state if component is still mounted
      if (mounted) {
        console.log(`Loaded ${recipes.length} recipes`);
        actions.loadRecipes(recipes);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error loading recipes:', err);
      if (mounted) {
        setError(`Failed to load recipes: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    }

    // Cleanup function
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [actions, isLoading]);

  // Calculate available height for pane contents
  // Pane wrapper subtracts: 2 (borders) + 1 (title) = 3 rows
  // So the actual available height inside each pane is: terminalHeight - 3
  const terminalHeight = stdout?.rows || 24;
  const paneContentHeight = Math.max(10, terminalHeight - 3);

  // Create pane components with correct heights
  const leftPane = useMemo(
    () => <RecipeListPane height={paneContentHeight} />,
    [paneContentHeight]
  );

  const rightPane = useMemo(
    () => <RecipeDetailPane height={paneContentHeight} />,
    [paneContentHeight]
  );

  // Show loading screen if still loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error if one occurred
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red" bold>
          Error loading recipes
        </Text>
        <Text>{error}</Text>
        <Text>Try running the sync command: paprik-ai sync</Text>
      </Box>
    );
  }

  // Render main layout with panes
  return <Layout leftPane={leftPane} rightPane={rightPane} />;
}

/**
 * Root TUI application component
 *
 * Responsibilities:
 * - Wraps application with AppProvider for state management
 * - Loads recipes from database on mount
 * - Renders two-pane layout with recipe list and detail views
 * - Terminal cleanup handled automatically by Ink on unmount
 */
export default function TuiApp(): React.ReactElement {
  return (
    <AppProvider>
      <TuiAppInner />
    </AppProvider>
  );
}
