import { Command, Flags } from '@oclif/core';
import { render } from 'ink';
import React, { useState } from 'react';
import { RecipeForm } from '../components/RecipeForm.js';
import { ErrorBox, LoadingBox } from '../components/Layout.js';
import { Recipe } from '../types/recipe.js';
import { RecipeRepository } from '../db/repositories/recipes.js';
import { getDatabase } from '../db/index.js';
import { getConfig } from '../utils/config.js';
import { Text, Box } from 'ink';

/**
 * Add recipe command
 */
export default class Add extends Command {
  static description = 'Add a new recipe';

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Recipe name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Recipe description',
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Add);
    const config = getConfig();

    // Initialize database
    const db = getDatabase(config.databasePath);
    const repository = new RecipeRepository(db);

    // If name is provided via flag, create directly
    if (flags.name) {
      const recipe = repository.create({
        uid: crypto.randomUUID(),
        name: flags.name,
        description: flags.description,
        rating: 0,
        in_trash: false,
        on_favorites: false,
        on_grocery_list: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });

      this.log(`✓ Recipe created: ${recipe.name} (${recipe.uid})`);
      return;
    }

    // Otherwise, show interactive form
    render(<AddApp repository={repository} />);
  }
}

/**
 * Add app component
 */
interface AddAppProps {
  repository: RecipeRepository;
}

const AddApp: React.FC<AddAppProps> = ({ repository }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdRecipe, setCreatedRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (data: Partial<Recipe>) => {
    setLoading(true);
    setError(null);

    try {
      const recipe = repository.create({
        uid: crypto.randomUUID(),
        name: data.name || 'Untitled Recipe',
        ingredients: data.ingredients,
        directions: data.directions,
        description: data.description,
        notes: data.notes,
        nutritional_info: data.nutritional_info,
        servings: data.servings,
        prep_time: data.prep_time,
        cook_time: data.cook_time,
        total_time: data.total_time,
        difficulty: data.difficulty,
        rating: data.rating || 0,
        source: data.source,
        source_url: data.source_url,
        image_url: data.image_url,
        in_trash: false,
        on_favorites: data.on_favorites || false,
        on_grocery_list: data.on_grocery_list || false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      });
      setCreatedRecipe(recipe);
      setSuccess(true);
      setLoading(false);

      // Exit after a short delay
      setTimeout(() => process.exit(0), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleCancel = () => {
    process.exit(0);
  };

  if (loading) {
    return <LoadingBox message="Creating recipe..." />;
  }

  if (error) {
    return <ErrorBox error={error} />;
  }

  if (success && createdRecipe) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="green" bold>
          ✓ Recipe created successfully!
        </Text>
        <Text>Name: {createdRecipe.name}</Text>
        <Text dimColor>UID: {createdRecipe.uid}</Text>
      </Box>
    );
  }

  return <RecipeForm onSubmit={handleSubmit} onCancel={handleCancel} />;
};
