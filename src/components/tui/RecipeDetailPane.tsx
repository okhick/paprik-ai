import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, Transform, useInput, useStdout } from 'ink';
import { useAppState } from './AppContext.js';
import type { Recipe } from '../../types/recipe.js';
import { ScrollView, ScrollViewRef } from 'ink-scroll-view';
import { ScrollBar } from '@byteland/ink-scroll-bar';

/**
 * Recipe detail pane component
 *
 * Displays the full details of the selected recipe with scrolling support.
 * Formats content into readable sections and handles missing fields gracefully.
 */
export function RecipeDetailPane(): React.ReactElement {
  const state = useAppState();
  const { stdout } = useStdout();
  const { recipes, selectedRecipeId, activePaneId } = state;

  const scrollRef = useRef<ScrollViewRef>(null);

  const [scrollBarOffset, setScrollBarOffset] = useState(0);
  const [scrollBarSize, setScrollBarSize] = useState(0);

  // Find the selected recipe
  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.uid === selectedRecipeId),
    [recipes, selectedRecipeId]
  );

  // Reset scroll position when selected recipe changes
  useEffect(() => {
    scrollRef.current?.scrollToTop();
    setScrollBarOffset(0);
  }, [selectedRecipeId, scrollRef.current]);

  // Handle Terminal Resizing due to manual window change
  useEffect(() => {
    const handleResize = () => scrollRef.current?.remeasure();
    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  // Keyboard navigation for scrolling (only when detail pane is focused)
  useInput(
    (_input, key) => {
      // Up arrow: scroll up
      if (key.upArrow) {
        scrollRef.current?.scrollBy(-1); // Scroll up 1 line
        setScrollBarOffset(scrollRef.current?.getScrollOffset() ?? 0);
      }
      if (key.downArrow) {
        // Stop scrolling if at bottom
        const contentLength = (scrollRef.current?.getContentHeight() ?? 0) - 1;
        const viewHeight = scrollRef.current?.getViewportHeight() ?? 0;
        const amountScrolled = scrollRef.current?.getScrollOffset() ?? 0;
        const canScrollMore = amountScrolled + viewHeight < contentLength;
        if (!canScrollMore) {
          return;
        }
        scrollRef.current?.scrollBy(1);
        setScrollBarOffset(scrollRef.current?.getScrollOffset() ?? 0);
      }
    },
    { isActive: activePaneId === 'detail' }
  );

  const renderedLines = useMemo(() => {
    if (selectedRecipe == null) {
      return [];
    }
    return format(selectedRecipe, 60);
  }, [selectedRecipe]);

  // Update the scroll bar size when the content changes
  useEffect(() => setScrollBarSize(renderedLines.length - 1), [renderedLines]);

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
    <Box flexDirection="column">
      <Box flexDirection="row" margin={1}>
        <ScrollView ref={scrollRef} marginRight={1}>
          {renderedLines}
        </ScrollView>
        <ScrollBar
          placement="inset"
          dimColor
          viewportHeight={scrollRef.current?.getViewportHeight() ?? 0}
          contentHeight={scrollBarSize}
          scrollOffset={scrollBarOffset}
        />
      </Box>
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
  lines.push(`${recipe.name}`);
  lines.push('━'.repeat(Math.min(recipe.name.length + 4, maxWidth)));

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
    // lines.push(...ingredientLines.flatMap((ing) => wrapText(ing, maxWidth)));
    lines.push('');
  }

  // Directions section
  if (recipe.directions?.trim()) {
    lines.push('Directions');
    lines.push('─'.repeat(14));
    lines.push(...wrapText(recipe.directions, maxWidth));
    // lines.push(recipe.directions);
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

function format(recipe: Recipe, wrap: number): React.JSX.Element[] {
  const formatted = [];

  const boxDivider = {
    borderBottom: true,
    borderTop: false,
    borderRight: false,
    borderLeft: false,
  };

  formatted.push(
    <Box borderStyle={'bold'} {...boxDivider} marginBottom={1}>
      <Text bold>{recipe.name}</Text>
    </Box>
  );

  const metadata: React.JSX.Element[] = [];
  const pushMetadata = (label: string, value: string) => {
    metadata.push(
      <Box>
        <Text dimColor>{label} </Text>
        <Text>{value}</Text>
      </Box>
    );
  };
  if (recipe.prep_time) {
    pushMetadata('Prep Time', recipe.prep_time);
  }
  if (recipe.cook_time) {
    pushMetadata('Cook Time', recipe.cook_time);
  }
  if (recipe.total_time) {
    pushMetadata('Total Time', recipe.total_time);
  }
  if (recipe.servings) {
    pushMetadata('Servings', recipe.servings);
  }
  if (recipe.difficulty) {
    pushMetadata('Difficulty', recipe.difficulty);
  }

  if (metadata.length > 0) {
    formatted.push(
      <Box flexDirection={'column'} borderStyle={'single'} {...boxDivider} marginBottom={1}>
        {...metadata}
      </Box>
    );
  }

  if (recipe.description != null && recipe.description.trim() !== '') {
    formatted.push(
      <Box borderStyle={'single'} {...boxDivider} marginBottom={1}>
        <Text>{wrapText(recipe.description, wrap)}</Text>
      </Box>
    );
  }

  if (recipe.ingredients != null) {
    const ingredients = parseIngredients(recipe.ingredients);

    formatted.push(
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Ingredients</Text>
        </Box>
        {...ingredients.map((ing) => <Box>{ing}</Box>)}
      </Box>
    );
  }

  if (recipe.directions != null) {
    const splitRecipeDirections = recipe.directions.split('\n');
    formatted.push(
      <Box flexDirection="column" borderStyle="bold" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Directions</Text>
        </Box>
        {...splitRecipeDirections.map((dir, idx) => {
          // Preserve empty lines
          if (dir.trim() === '') {
            return <Text> </Text>;
          }

          return (
            <Box marginBottom={idx === splitRecipeDirections.length - 1 ? 1 : 0}>
              <TrimLeadingWhitespace>
                <Text bold={parseMarkdownBold(dir)}>{dir}</Text>
              </TrimLeadingWhitespace>
            </Box>
          );
        })}
      </Box>
    );
  }

  if (recipe.notes != null && recipe.notes.trim() !== '') {
    formatted.push(
      <Box flexDirection="column" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Notes</Text>
        </Box>
        <TrimLeadingWhitespace>
          <Text>{recipe.notes}</Text>
        </TrimLeadingWhitespace>
      </Box>
    );
  }

  if (
    (recipe.source != null && recipe.source.trim() !== '') ||
    (recipe.source_url != null && recipe.source_url.trim() !== '')
  ) {
    formatted.push(
      <Box flexDirection="column" {...boxDivider} marginBottom={1}>
        <Box marginBottom={1}>
          <Text dimColor>Source</Text>
        </Box>
        {recipe.source != null && (
          <TrimLeadingWhitespace>
            <Text>{recipe.source}</Text>
          </TrimLeadingWhitespace>
        )}
        {recipe.source_url != null && (
          <TrimLeadingWhitespace>
            <Text>{recipe.source_url}</Text>
          </TrimLeadingWhitespace>
        )}
      </Box>
    );

    if (recipe.nutritional_info != null && recipe.nutritional_info.trim() !== '') {
      formatted.push(
        <Box flexDirection="column" {...boxDivider} marginBottom={1}>
          <Box marginBottom={1}>
            <Text dimColor>Nutritional Info</Text>
          </Box>
          <TrimLeadingWhitespace>
            <Text>{recipe.nutritional_info}</Text>
          </TrimLeadingWhitespace>
        </Box>
      );
    }
  }

  return formatted;
}

/**
 * Parse ingredients from JSON string or plain text
 */
function parseIngredients(ingredientsStr: string): React.JSX.Element[] {
  const ingredientsSplit = ingredientsStr.split('\n');

  return ingredientsSplit.map((line, index) => {
    const trimmed = line.trim();
    // Preserve empty lines
    if (trimmed === '') {
      return <Text> </Text>;
    }

    const isBold = parseMarkdownBold(trimmed) || trimmed.at(-1) === ':';

    // Bold if the last character is a colon and add space
    if (isBold) {
      // If the previous line is a space, then we don't need more space
      const needsSpace = ingredientsSplit.at(index - 1)?.trim() !== '' && index > 0;
      return (
        <Box marginTop={needsSpace ? 1 : 0}>
          <TrimLeadingWhitespace>
            <Text bold>{trimmed}</Text>
          </TrimLeadingWhitespace>
        </Box>
      );
    }
    return <Text>• {trimmed}</Text>;
  });
}

function parseMarkdownBold(maybeBold: string): boolean {
  if (maybeBold.length <= 4) {
    return false;
  }

  // Parse for **Bold**
  return maybeBold.slice(0, 2) === '**' && maybeBold.slice(maybeBold.length - 2) === '**';
}

function TrimLeadingWhitespace({ children }: { children: React.ReactNode }): React.ReactNode {
  return <Transform transform={(content) => content.trimStart()}>{children}</Transform>;
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
