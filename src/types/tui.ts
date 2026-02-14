import type { Recipe, Category } from './recipe.js';

/**
 * Identifies which pane currently has focus
 */
export type FocusPane = 'list' | 'detail';

/**
 * Global application state for the TUI
 */
export interface AppState {
  /** Currently focused pane */
  activePaneId: FocusPane;

  /** UID of the currently selected recipe (null if none selected) */
  selectedRecipeId: string | null;

  /** Current search query text */
  searchQuery: string;

  /** Whether search input is active (user is typing) */
  isSearchActive: boolean;

  /** All recipes loaded from database */
  recipes: Recipe[];

  /** Filtered recipes based on search and filters */
  filteredRecipes: Recipe[];

  /** Whether help overlay is visible */
  showHelp: boolean;

  /** All available categories */
  categories: Category[];

  /** Active category filter UIDs (empty = show all) */
  selectedCategoryUids: string[];

  /** Whether category filter UI is visible */
  isCategoryFilterActive: boolean;
}

/**
 * Actions for modifying app state
 */
export interface AppActions {
  setActivePaneId: (paneId: FocusPane) => void;
  setSelectedRecipe: (recipeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchActive: (active: boolean) => void;
  toggleHelp: () => void;
  loadRecipes: (recipes: Recipe[]) => void;
  loadCategories: (categories: Category[]) => void;
  toggleCategoryFilter: (categoryUid: string) => void;
  clearCategoryFilters: () => void;
  setIsCategoryFilterActive: (active: boolean) => void;
}

/**
 * Scroll state for a pane
 */
export interface ScrollState {
  /** Current scroll offset (0-based index or line number) */
  scrollOffset: number;

  /** Height of the viewport in lines */
  viewportHeight: number;
}

/**
 * Actions returned by useScrollable hook
 */
export interface ScrollActions {
  scrollUp: () => void;
  scrollDown: () => void;
  pageUp: () => void;
  pageDown: () => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  setViewportHeight: (height: number) => void;
  resetScroll: () => void;
}

/**
 * Return type of useScrollable hook
 */
export interface UseScrollableReturn {
  scrollOffset: number;
  viewportHeight: number;
  hasMore: {
    above: boolean;
    below: boolean;
  };
  actions: ScrollActions;
}
