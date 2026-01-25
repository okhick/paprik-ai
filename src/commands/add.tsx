import { Command, Flags } from '@oclif/core';
import { render } from 'ink';
import React, { useState } from 'react';
import { RecipeForm } from '../components/RecipeForm.js';
import { ErrorBox, LoadingBox } from '../components/Layout.js';
import { Recipe } from '../types/recipe.js';
import { RecipeService } from '../services/recipe.js';
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
    const service = new RecipeService(repository);

    // If name is provided via flag, create directly
    if (flags.name) {
      const recipe = await service.createRecipe({
        name: flags.name,
        description: flags.description,
      });

      this.log(`✓ Recipe created: ${recipe.name} (${recipe.uid})`);
      return;
    }

    // Otherwise, show interactive form
    render(<AddApp service={service} />);
  }
}

/**
 * Add app component
 */
interface AddAppProps {
  service: RecipeService;
}

const AddApp: React.FC<AddAppProps> = ({ service }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdRecipe, setCreatedRecipe] = useState<Recipe | null>(null);

  const handleSubmit = async (data: Partial<Recipe>) => {
    setLoading(true);
    setError(null);

    try {
      const recipe = await service.createRecipe(data);
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
