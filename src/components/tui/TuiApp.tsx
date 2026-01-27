import React, { useEffect, useMemo } from 'react';
import { useStdout } from 'ink';
import { AppProvider, useAppActions } from './AppContext.js';
import { Layout } from './Layout.js';
import { RecipeListPane } from './RecipeListPane.js';
import { RecipeDetailPane } from './RecipeDetailPane.js';
import { RecipeRepository } from '../../db/repositories/recipes.js';

/**
 * Inner component that loads recipes from the database
 *
 * Must be inside AppProvider to access context actions
 */
function TuiAppInner(): React.ReactElement {
  const actions = useAppActions();
  const { stdout } = useStdout();

  // Load recipes from database on mount
  useEffect(() => {
    try {
      const recipeRepo = new RecipeRepository();
      const recipes = recipeRepo.getAll();
      actions.loadRecipes(recipes);
    } catch (error) {
      // If database fails, load empty array
      // User will see "no recipes" message with sync instructions
      console.error('Failed to load recipes:', error);
      actions.loadRecipes([]);
    }
  }, [actions]);

  // Calculate available height for pane contents
  // Terminal height - 3 (top border, title, bottom border) - 1 (search bar) = available height
  const terminalHeight = stdout?.rows || 24;
  const paneContentHeight = Math.max(10, terminalHeight - 4);

  // Create pane components with correct heights
  const leftPane = useMemo(
    () => <RecipeListPane height={paneContentHeight} />,
    [paneContentHeight]
  );

  const rightPane = useMemo(
    () => <RecipeDetailPane height={paneContentHeight} />,
    [paneContentHeight]
  );

  // Render layout with both panes
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
