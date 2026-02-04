import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { useAppState } from './AppContext.js';

import type { Recipe } from '../../types/recipe.js';
import { ScrollView, ScrollViewRef } from 'ink-scroll-view';

/**
 * Recipe detail pane component
 *
 * Displays the full details of the selected recipe with scrolling support.
 * Formats content into readable sections and handles missing fields gracefully.
 */
export function RecipeDetailPane(): React.ReactElement {
  const state = useAppState();
  const { recipes, selectedRecipeId, activePaneId } = state;

  // Find the selected recipe
  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.uid === selectedRecipeId),
    [recipes, selectedRecipeId]
  );

  // Format recipe content into lines
  const contentLines = useMemo(() => {
    if (!selectedRecipe) return [];
    return formatRecipeContent(selectedRecipe);
  }, [selectedRecipe]);

  const scrollRef = useRef<ScrollViewRef>(null);

  // Reset scroll position when selected recipe changes
  useEffect(() => {
    scrollRef.current?.scrollToTop();
  }, [selectedRecipeId, scrollRef.current]);

  // Keyboard navigation for scrolling (only when detail pane is focused)
  useInput(
    (_input, key) => {
      // Up arrow: scroll up
      if (key.upArrow) {
        scrollRef.current?.scrollBy(-1); // Scroll up 1 line
      }
      if (key.downArrow) {
        scrollRef.current?.scrollBy(1); // Scroll down 1 line
      }
    },
    { isActive: activePaneId === 'detail' }
  );

  const renderLine = (line: string, idx: number) => {
    if (line === '' && idx > 0) {
      return <Text key={idx}> </Text>;
    }

    return <Text key={idx}>{line}</Text>;
  };

  const renderedLines = useMemo(() => {
    return contentLines.map((line, idx) => renderLine(line, idx));
  }, [contentLines]);

  // Handle no recipe selected
  if (!selectedRecipe) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="gray" dimColor>
          No recipe selected
        </Text>
        <Text color="gray" dimColor>
          Select a recipe from the list to view details
        </Text>
      </Box>
    );
  }

  // Render detail content
  return (
    <Box flexDirection="column" margin={1}>
      <ScrollView ref={scrollRef}>{renderedLines}</ScrollView>
    </Box>
  );
}

/**
 * Format recipe content into an array of lines for display
 *
 * Breaks content into sections with headers and handles text wrapping.
 */
function formatRecipeContent(recipe: Recipe): string[] {
  const lines: string[] = [];
  const maxWidth = 60; // Max width for wrapping (adjust based on pane width)

  // Recipe name as title
  lines.push('');
  lines.push(`${recipe.name}`);
  lines.push('━'.repeat(Math.min(recipe.name.length + 4, maxWidth)));
  lines.push('');

  // Metadata section (using shorter labels to avoid wrapping)
  const metadata: string[] = [];
  if (recipe.rating) {
    metadata.push(`Rating: ${'★'.repeat(recipe.rating)}${'·'.repeat(5 - recipe.rating)}`);
  }
  if (recipe.prep_time) {
    metadata.push(`Prep: ${recipe.prep_time}`);
  }
  if (recipe.cook_time) {
    metadata.push(`Cook: ${recipe.cook_time}`);
  }
  if (recipe.total_time) {
    metadata.push(`Total: ${recipe.total_time}`);
  }
  if (recipe.servings) {
    metadata.push(`Servings: ${recipe.servings}`);
  }
  if (recipe.difficulty) {
    metadata.push(`Difficulty: ${recipe.difficulty}`);
  }

  if (metadata.length > 0) {
    lines.push(...metadata);
    lines.push('');
  }

  // Description section
  if (recipe.description?.trim()) {
    lines.push('Description');
    lines.push('─'.repeat(13));
    lines.push(...wrapText(recipe.description, maxWidth));
    lines.push('');
  }

  // Ingredients section
  if (recipe.ingredients?.trim()) {
    lines.push('Ingredients');
    lines.push('─'.repeat(14));
    // Parse ingredients (may be JSON or plain text)
    const ingredientLines = parseIngredients(recipe.ingredients);
    lines.push(...ingredientLines.flatMap((ing) => wrapText(ing, maxWidth)));
    lines.push('');
  }

  // Directions section
  if (recipe.directions?.trim()) {
    lines.push('Directions');
    lines.push('─'.repeat(14));
    lines.push(...wrapText(recipe.directions, maxWidth));
    lines.push('');
  }

  // Notes section
  if (recipe.notes?.trim()) {
    lines.push('Notes');
    lines.push('─'.repeat(8));
    lines.push(...wrapText(recipe.notes, maxWidth));
    lines.push('');
  }

  // Source section
  if (recipe.source || recipe.source_url) {
    lines.push('Source');
    lines.push('─'.repeat(10));
    if (recipe.source) {
      lines.push(recipe.source);
    }
    if (recipe.source_url) {
      lines.push(recipe.source_url);
    }
    lines.push('');
  }

  // Nutritional info section
  if (recipe.nutritional_info?.trim()) {
    lines.push('Nutritional Information');
    lines.push('─'.repeat(27));
    lines.push(...wrapText(recipe.nutritional_info, maxWidth));
    lines.push('');
  }

  return lines;
}

/**
 * Parse ingredients from JSON string or plain text
 */
function parseIngredients(ingredientsStr: string): string[] {
  return ingredientsStr
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `• ${line.trim()}`);
}

/**
 * Wrap text to fit within max width
 *
 * Splits text into lines that don't exceed maxWidth characters.
 * Preserves existing line breaks.
 */
function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}
