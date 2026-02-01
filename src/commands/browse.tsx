import { Command, Flags } from '@oclif/core';
import { render } from 'ink';
import React, { useEffect, useState } from 'react';
import { RecipeList } from '../components/RecipeList.js';
import { RecipeDetail } from '../components/RecipeDetail.js';
import { ErrorBox, LoadingBox } from '../components/Layout.js';
import { Recipe } from '../types/recipe.js';
import { RecipeRepository } from '../db/repositories/recipes.js';
import { getDatabase } from '../db/index.js';
import { getConfig } from '../utils/config.js';

/**
 * Browse recipes command
 */
export default class Browse extends Command {
  static description = 'Browse all recipes';

  static flags = {
    favorites: Flags.boolean({
      char: 'f',
      description: 'Show only favorite recipes',
      default: false,
    }),
    'min-rating': Flags.integer({
      char: 'r',
      description: 'Show recipes with minimum rating',
      min: 1,
      max: 5,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Browse);
    const config = getConfig();

    // Show deprecation warning
    this.log('\n⚠️  Deprecation Notice ⚠️');
    this.log('The "browse" command is being phased out in favor of the new TUI interface.');
    this.log('Try running "paprik-ai" with no arguments for a better experience.\n');

    // Initialize database
    const db = getDatabase(config.databasePath);
    const repository = new RecipeRepository(db);

    // Render Ink component
    render(
      <BrowseApp
        repository={repository}
        favorites={flags.favorites}
        minRating={flags['min-rating']}
      />
    );
  }
}

/**
 * Browse app component
 */
interface BrowseAppProps {
  repository: RecipeRepository;
  favorites?: boolean;
  minRating?: number;
}

const BrowseApp: React.FC<BrowseAppProps> = ({ repository, favorites, minRating }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      let loadedRecipes: Recipe[];

      if (favorites) {
        loadedRecipes = repository.getFavorites();
      } else if (minRating !== undefined) {
        loadedRecipes = repository.getByRating(minRating);
      } else {
        loadedRecipes = repository.getAll();
      }

      setRecipes(loadedRecipes);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [repository, favorites, minRating]);

  if (loading) {
    return <LoadingBox message="Loading recipes..." />;
  }

  if (error) {
    return <ErrorBox error={error} />;
  }

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  const title = favorites
    ? 'Favorite Recipes'
    : minRating
      ? `Recipes (${minRating}+ stars)`
      : 'All Recipes';

  return (
    <RecipeList
      recipes={recipes}
      title={title}
      onSelect={setSelectedRecipe}
      onExit={() => process.exit(0)}
    />
  );
};
