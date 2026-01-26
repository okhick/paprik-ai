import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Recipe } from '../types/recipe.js';
import { Layout, EmptyState } from './Layout.js';

/**
 * RecipeList props
 */
export interface RecipeListProps {
  recipes: Recipe[];
  onSelect?: (recipe: Recipe) => void;
  onExit?: () => void;
  title?: string;
}

/**
 * Recipe list component with keyboard navigation
 */
export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  onSelect,
  onExit,
  title = 'Recipes',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input: string, key: { upArrow?: boolean; downArrow?: boolean; return?: boolean }) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(recipes.length - 1, prev + 1));
    } else if (key.return && onSelect) {
      onSelect(recipes[selectedIndex]);
    } else if (input === 'q' && onExit) {
      onExit();
    }
  });

  // Reset selection if recipes change
  useEffect(() => {
    setSelectedIndex(0);
  }, [recipes]);

  if (recipes.length === 0) {
    return (
      <Layout title={title} footer="q: quit">
        <EmptyState message="No recipes found" />
      </Layout>
    );
  }

  return (
    <Layout title={title} footer="↑/↓: navigate | Enter: select | q: quit">
      <Box flexDirection="column">
        {recipes.map((recipe, index) => (
          <RecipeListItem key={recipe.uid} recipe={recipe} isSelected={index === selectedIndex} />
        ))}
      </Box>
    </Layout>
  );
};

/**
 * Individual recipe list item
 */
interface RecipeListItemProps {
  recipe: Recipe;
  isSelected: boolean;
}

const RecipeListItem: React.FC<RecipeListItemProps> = ({ recipe, isSelected }) => {
  const ratingStars = recipe.rating ? '⭐'.repeat(recipe.rating) : '';

  return (
    <Box paddingY={0}>
      <Box width={3}>{isSelected && <Text color="cyan">{'>'} </Text>}</Box>
      <Box flexGrow={1}>
        <Text color={isSelected ? 'cyan' : 'white'} bold={isSelected}>
          {recipe.name}
        </Text>
        {ratingStars && (
          <Text color="yellow" dimColor={!isSelected}>
            {' '}
            {ratingStars}
          </Text>
        )}
        {recipe.on_favorites && (
          <Text color="red" dimColor={!isSelected}>
            {' '}
            ❤
          </Text>
        )}
      </Box>
    </Box>
  );
};
