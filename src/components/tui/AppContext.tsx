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
import type { Recipe, Category } from '../../types/recipe.js';

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
  const [recipes, setRecipes] = useState<IndexedRecipe[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryUids, setSelectedCategoryUids] = useState<string[]>([]);
  const [isCategoryFilterActive, setIsCategoryFilterActive] = useState(false);

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

  // Filtered recipes based on category filter and debounced search query
  const filteredRecipes = useMemo(() => {
    let results = recipes;

    // 1. Apply category filter (if any selected)
    if (selectedCategoryUids.length > 0) {
      results = results.filter((recipe) =>
        recipe.categories?.some((cat) => selectedCategoryUids.includes(cat.uid))
      );
    }

    // 2. Apply search filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      results = results.filter((recipe) => recipe._searchText?.includes(query));
    }

    return results;
  }, [recipes, selectedCategoryUids, debouncedSearchQuery]);

  // Actions
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

  const loadCategories = useCallback((newCategories: Category[]) => {
    setCategories(newCategories);
  }, []);

  const toggleCategoryFilter = useCallback(
    (categoryUid: string) => {
      // Collect all descendant UIDs for the toggled category
      const getDescendantUids = (parentUid: string): string[] => {
        const descendants: string[] = [];
        for (const cat of categories) {
          if (cat.parent_uid === parentUid) {
            descendants.push(cat.uid);
            descendants.push(...getDescendantUids(cat.uid));
          }
        }
        return descendants;
      };

      const allUids = [categoryUid, ...getDescendantUids(categoryUid)];

      setSelectedCategoryUids((prev) => {
        if (prev.includes(categoryUid)) {
          // Deselect this category and all its descendants
          return prev.filter((uid) => !allUids.includes(uid));
        } else {
          // Select this category and all its descendants
          const newSet = new Set([...prev, ...allUids]);
          return [...newSet];
        }
      });
    },
    [categories]
  );

  const clearCategoryFilters = useCallback(() => {
    setSelectedCategoryUids([]);
  }, []);

  // Combine state
  const state: AppState = useMemo(
    () => ({
      activePaneId,
      selectedRecipeId,
      searchQuery,
      isSearchActive,
      recipes,
      filteredRecipes,
      showHelp,
      categories,
      selectedCategoryUids,
      isCategoryFilterActive,
    }),
    [
      activePaneId,
      selectedRecipeId,
      searchQuery,
      isSearchActive,
      recipes,
      filteredRecipes,
      showHelp,
      categories,
      selectedCategoryUids,
      isCategoryFilterActive,
    ]
  );

  // Combine actions
  const actions: AppActions = useMemo(
    () => ({
      setActivePaneId,
      setSelectedRecipe: setSelectedRecipeId,
      setSearchQuery,
      setIsSearchActive,
      toggleHelp,
      loadRecipes,
      loadCategories,
      toggleCategoryFilter,
      clearCategoryFilters,
      setIsCategoryFilterActive,
    }),
    [toggleHelp, loadRecipes, loadCategories, toggleCategoryFilter, clearCategoryFilters]
  );

  const contextValue = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
