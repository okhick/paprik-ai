import React, { useEffect, useState, useMemo } from 'react';
import { useStdout, Text, Box } from 'ink';
import { AppProvider, useAppActions, useAppState } from './AppContext.js';
import { Layout } from './Layout.js';
import { RecipeListPane } from './RecipeListPane.js';
import { RecipeDetailPane } from './RecipeDetailPane.js';
import { CategoryFilterPane } from './CategoryFilterPane.js';
import { RecipeRepository } from '../../db/repositories/recipes.js';
import { CategoryRepository } from '../../db/repositories/categories.js';

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
  const state = useAppState();
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
      // Create repositories
      const recipeRepo = new RecipeRepository();
      const categoryRepo = new CategoryRepository();

      // Load categories
      const categories = categoryRepo.getAll();

      // Load recipes and attach categories to each
      const recipes = recipeRepo.getAll();
      const recipesWithCategories = recipes.map((recipe) => {
        const recipeCategories = categoryRepo.getByRecipe(recipe.uid);
        return { ...recipe, categories: recipeCategories };
      });

      // Update state if component is still mounted
      if (mounted) {
        console.log(`Loaded ${categories.length} categories and ${recipes.length} recipes`);
        actions.loadCategories(categories);
        actions.loadRecipes(recipesWithCategories);
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
  }, []);

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

  const rightPane = () => <RecipeDetailPane />;

  const categoryPaneContent = useMemo(
    () => <CategoryFilterPane height={paneContentHeight} activePaneId={state.activePaneId} />,
    [paneContentHeight, state.activePaneId]
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
  return <Layout categoryPane={categoryPaneContent} leftPane={leftPane} rightPane={rightPane()} />;
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
