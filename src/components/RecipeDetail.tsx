import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Maybe, Recipe } from '../types/recipe.js';
import { Layout } from './Layout.js';

/**
 * RecipeDetail props
 */
export interface RecipeDetailProps {
  recipe: Recipe;
  onBack?: () => void;
}

/**
 * Recipe detail view component
 */
export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack }) => {
  useInput((input: string) => {
    if (input === 'q' && onBack) {
      onBack();
    }
  });

  const ingredients = parseIngredients(recipe.ingredients);
  const directions = parseDirections(recipe.directions);

  return (
    <Layout title={recipe.name} footer="q: back">
      <Box flexDirection="column" gap={1}>
        {/* Metadata */}
        <Box flexDirection="column">
          {recipe.rating != null && recipe.rating > 0 && (
            <Box>
              <Text color="yellow">Rating: {'⭐'.repeat(recipe.rating)}</Text>
            </Box>
          )}
          {recipe.on_favorites === true && (
            <Box>
              <Text color="red">❤ Favorite</Text>
            </Box>
          )}
          {(recipe.prep_time || recipe.cook_time) && (
            <Box>
              <Text dimColor>
                {recipe.prep_time && `Prep: ${recipe.prep_time}`}
                {recipe.prep_time && recipe.cook_time && ' | '}
                {recipe.cook_time && `Cook: ${recipe.cook_time}`}
              </Text>
            </Box>
          )}
          {recipe.servings && (
            <Box>
              <Text dimColor>Servings: {recipe.servings}</Text>
            </Box>
          )}
        </Box>

        {/* Description */}
        {recipe.description && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Description
            </Text>
            <Text>{recipe.description}</Text>
          </Box>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Ingredients
            </Text>
            {ingredients.map((ingredient, index) => (
              <Box key={index}>
                <Text>{ingredient}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Directions */}
        {directions.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Directions
            </Text>
            {directions.map((direction, index) => (
              <Box key={index} marginBottom={1}>
                <Text>{direction}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Notes */}
        {recipe.notes && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Notes
            </Text>
            <Text>{recipe.notes}</Text>
          </Box>
        )}

        {/* Source */}
        {(recipe.source || recipe.source_url) && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Source
            </Text>
            {recipe.source && <Text>{recipe.source}</Text>}
            {recipe.source_url && <Text dimColor>{recipe.source_url}</Text>}
          </Box>
        )}
      </Box>
    </Layout>
  );
};

/**
 * Parse ingredients from JSON string
 */
function parseIngredients(ingredientsJson?: Maybe<string>): string[] {
  if (!ingredientsJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(ingredientsJson);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [ingredientsJson];
  } catch {
    return [ingredientsJson];
  }
}

/**
 * Parse directions from text
 */
function parseDirections(directionsText?: Maybe<string>): string[] {
  if (!directionsText) {
    return [];
  }

  return directionsText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
