import { Command, Args, Flags } from '@oclif/core';
import { render } from 'ink';
import React, { useState, useEffect } from 'react';
import { RecipeForm } from '../components/RecipeForm.js';
import { ErrorBox, LoadingBox } from '../components/Layout.js';
import { Recipe } from '../types/recipe.js';
import { RecipeService } from '../services/recipe.js';
import { RecipeRepository } from '../db/repositories/recipes.js';
import { getDatabase } from '../db/index.js';
import { getConfig } from '../utils/config.js';
import { Text, Box } from 'ink';

/**
 * Edit recipe command
 */
export default class Edit extends Command {
  static description = 'Edit an existing recipe';

  static args = {
    uid: Args.string({
      description: 'Recipe UID to edit',
      required: true,
    }),
  };

  static flags = {
    name: Flags.string({
      char: 'n',
      description: 'Update recipe name',
    }),
    description: Flags.string({
      char: 'd',
      description: 'Update recipe description',
    }),
    rating: Flags.integer({
      char: 'r',
      description: 'Update recipe rating',
      min: 0,
      max: 5,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Edit);
    const config = getConfig();

    // Initialize database
    const db = getDatabase(config.databasePath);
    const repository = new RecipeRepository(db);
    const service = new RecipeService(repository);

    // Check if recipe exists
    const recipe = await service.getRecipe(args.uid);
    if (!recipe) {
      this.error(`Recipe not found: ${args.uid}`);
    }

    // If flags are provided, update directly
    if (flags.name || flags.description || flags.rating !== undefined) {
      const updates: Partial<Recipe> = {};
      if (flags.name) updates.name = flags.name;
      if (flags.description) updates.description = flags.description;
      if (flags.rating !== undefined) updates.rating = flags.rating;

      const updated = await service.updateRecipe(args.uid, updates);
      if (updated) {
        this.log(`✓ Recipe updated: ${updated.name}`);
      } else {
        this.error('Failed to update recipe');
      }
      return;
    }

    // Otherwise, show interactive form
    render(<EditApp service={service} uid={args.uid} />);
  }
}

/**
 * Edit app component
 */
interface EditAppProps {
  service: RecipeService;
  uid: string;
}

const EditApp: React.FC<EditAppProps> = ({ service, uid }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const loadedRecipe = await service.getRecipe(uid);
        if (!loadedRecipe) {
          setError(`Recipe not found: ${uid}`);
        } else {
          setRecipe(loadedRecipe);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    loadRecipe();
  }, [service, uid]);

  const handleSubmit = async (data: Partial<Recipe>) => {
    setSaving(true);
    setError(null);

    try {
      const updated = await service.updateRecipe(uid, data);
      if (updated) {
        setRecipe(updated);
        setSuccess(true);
        setSaving(false);

        // Exit after a short delay
        setTimeout(() => process.exit(0), 2000);
      } else {
        setError('Failed to update recipe');
        setSaving(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  const handleCancel = () => {
    process.exit(0);
  };

  if (loading) {
    return <LoadingBox message="Loading recipe..." />;
  }

  if (saving) {
    return <LoadingBox message="Updating recipe..." />;
  }

  if (error) {
    return <ErrorBox error={error} />;
  }

  if (success && recipe) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="green" bold>
          ✓ Recipe updated successfully!
        </Text>
        <Text>Name: {recipe.name}</Text>
      </Box>
    );
  }

  if (!recipe) {
    return <ErrorBox error="Recipe not found" />;
  }

  return <RecipeForm recipe={recipe} onSubmit={handleSubmit} onCancel={handleCancel} />;
};
