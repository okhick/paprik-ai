import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { AppState, AppActions, FocusPane } from '../../types/tui.js';
import type { Recipe } from '../../types/recipe.js';

/**
 * Recipe with precomputed search fields for optimized filtering
 */
interface IndexedRecipe extends Recipe {
  _searchText?: string;
}

/**
 * Context value combining state and actions
 */
interface AppContextValue {
  state: AppState;
  actions: AppActions;
}

/**
 * React Context for global TUI state
 */
const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Hook to access app state
 */
export function useAppState(): AppState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context.state;
}

/**
 * Hook to access app actions
 */
export function useAppActions(): AppActions {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppActions must be used within AppProvider');
  }
  return context.actions;
}

/**
 * Provider component props
 */
interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that wraps the TUI app with state management
 */
export function AppProvider({ children }: AppProviderProps): React.ReactElement {
  // State management
  const [activePaneId, setActivePaneId] = useState<FocusPane>('list');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Immediate input shown in UI
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); // Debounced query for filtering
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [recipes, setRecipes] = useState<IndexedRecipe[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Debounce search query (300ms delay)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create indexed recipes for faster filtering
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer to update debounced query after 300ms
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Filtered recipes based on debounced search query and favorites filter
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Apply favorites filter
    if (showFavorites) {
      filtered = filtered.filter((recipe) => recipe.on_favorites);
    }

    // Apply search filter (case-insensitive, multi-field)
    // Use debounced query to prevent excessive filtering while typing
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();

      // Use precomputed search text for faster filtering
      filtered = filtered.filter((recipe) => recipe._searchText?.includes(query));
    }

    return filtered;
  }, [recipes, debouncedSearchQuery, showFavorites]);

  // Actions
  const toggleFavoritesFilter = useCallback(() => {
    setShowFavorites((prev) => !prev);
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp((prev) => !prev);
  }, []);

  const loadRecipes = useCallback((newRecipes: Recipe[]) => {
    // Index recipes as they're loaded
    const indexedRecipes = newRecipes.map((recipe) => {
      const indexed = recipe as IndexedRecipe;

      // Create a normalized search text combining key fields
      const searchFields = [
        recipe.name || '',
        recipe.ingredients || '',
        recipe.description || '',
        recipe.directions || '',
        recipe.notes || '',
      ];

      indexed._searchText = searchFields.join(' ').toLowerCase();
      return indexed;
    });

    setRecipes(indexedRecipes);
  }, []);

  // Combine state
  const state: AppState = useMemo(
    () => ({
      activePaneId,
      selectedRecipeId,
      searchQuery,
      isSearchActive,
      showFavorites,
      recipes,
      filteredRecipes,
      showHelp,
    }),
    [
      activePaneId,
      selectedRecipeId,
      searchQuery,
      isSearchActive,
      showFavorites,
      recipes,
      filteredRecipes,
      showHelp,
    ]
  );

  // Combine actions
  const actions: AppActions = useMemo(
    () => ({
      setActivePaneId,
      setSelectedRecipe: setSelectedRecipeId,
      setSearchQuery,
      setIsSearchActive,
      toggleFavoritesFilter,
      toggleHelp,
      loadRecipes,
    }),
    [toggleFavoritesFilter, toggleHelp, loadRecipes]
  );

  const contextValue = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
