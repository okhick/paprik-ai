import { Command, Args } from '@oclif/core';
import { render } from 'ink';
import React, { useEffect, useState } from 'react';
import { RecipeList } from '../components/RecipeList.js';
import { RecipeDetail } from '../components/RecipeDetail.js';
import { ErrorBox, LoadingBox, EmptyState, Layout } from '../components/Layout.js';
import { Recipe } from '../types/recipe.js';
import { RecipeRepository } from '../db/repositories/recipes.js';
import { getDatabase } from '../db/index.js';
import { getConfig } from '../utils/config.js';

/**
 * Search recipes command
 */
export default class Search extends Command {
  static description = 'Search recipes by name';

  static args = {
    query: Args.string({
      description: 'Search query',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Search);
    const config = getConfig();

    // Show deprecation warning
    this.log('\n⚠️  Deprecation Notice ⚠️');
    this.log('The "search" command is being phased out in favor of the new TUI interface.');
    this.log('Try running "paprik-ai" and using "/" to search within the interface.\n');

    // Initialize database
    const db = getDatabase(config.databasePath);
    const repository = new RecipeRepository(db);

    // Render Ink component
    render(<SearchApp repository={repository} query={args.query} />);
  }
}

/**
 * Search app component
 */
interface SearchAppProps {
  repository: RecipeRepository;
  query: string;
}

const SearchApp: React.FC<SearchAppProps> = ({ repository, query }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const results = repository.searchByName(query);
      setRecipes(results);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }, [repository, query]);

  if (loading) {
    return <LoadingBox message="Searching recipes..." />;
  }

  if (error) {
    return <ErrorBox error={error} />;
  }

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  if (recipes.length === 0) {
    return (
      <Layout title={`Search: "${query}"`} footer="q: quit">
        <EmptyState message={`No recipes found matching "${query}"`} />
      </Layout>
    );
  }

  return (
    <RecipeList
      recipes={recipes}
      title={`Search: "${query}" (${recipes.length} found)`}
      onSelect={setSelectedRecipe}
      onExit={() => process.exit(0)}
    />
  );
};
