import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Recipe } from '../types/recipe.js';
import { Layout } from './Layout.js';

/**
 * RecipeForm props
 */
export interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: Partial<Recipe>) => void;
  onCancel?: () => void;
}

/**
 * Recipe form component for adding/editing recipes
 */
export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onSubmit, onCancel }) => {
  const [formData] = useState<Partial<Recipe>>({
    name: recipe?.name || '',
    description: recipe?.description || '',
    ingredients: recipe?.ingredients || '',
    directions: recipe?.directions || '',
    servings: recipe?.servings || '',
    prep_time: recipe?.prep_time || '',
    cook_time: recipe?.cook_time || '',
    source: recipe?.source || '',
    source_url: recipe?.source_url || '',
    notes: recipe?.notes || '',
    rating: recipe?.rating || 0,
  });

  const [currentField, setCurrentField] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description' },
    { key: 'ingredients', label: 'Ingredients (one per line)' },
    { key: 'directions', label: 'Directions' },
    { key: 'servings', label: 'Servings' },
    { key: 'prep_time', label: 'Prep Time' },
    { key: 'cook_time', label: 'Cook Time' },
    { key: 'source', label: 'Source' },
    { key: 'source_url', label: 'Source URL' },
    { key: 'notes', label: 'Notes' },
  ];

  useInput(
    (
      _input: string,
      key: { upArrow?: boolean; downArrow?: boolean; return?: boolean; escape?: boolean }
    ) => {
      if (isSubmitting) return;

      if (key.upArrow) {
        setCurrentField((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setCurrentField((prev) => Math.min(fields.length - 1, prev + 1));
      } else if (key.return) {
        // Submit form
        if (formData.name) {
          setIsSubmitting(true);
          onSubmit(formData);
        }
      } else if (key.escape && onCancel) {
        onCancel();
      }
    }
  );

  const title = recipe ? 'Edit Recipe' : 'Add Recipe';
  const footer = '↑/↓: navigate fields | Enter: save | Esc: cancel';

  return (
    <Layout title={title} footer={footer}>
      <Box flexDirection="column" gap={1}>
        <Box marginBottom={1}>
          <Text dimColor>
            Note: This is a simplified form. Use text editor mode for full editing.
          </Text>
        </Box>

        {fields.map((field, index) => (
          <Box key={field.key} flexDirection="column">
            <Box>
              <Text bold={index === currentField} color={index === currentField ? 'cyan' : 'white'}>
                {field.label}
                {field.required && ' *'}:
              </Text>
            </Box>
            <Box paddingLeft={2}>
              <Text dimColor={index !== currentField}>
                {(formData[field.key as keyof typeof formData] as string) || '(empty)'}
              </Text>
            </Box>
          </Box>
        ))}

        {!formData.name && (
          <Box marginTop={1}>
            <Text color="red">* Name is required</Text>
          </Box>
        )}

        {isSubmitting && (
          <Box marginTop={1}>
            <Text color="green">Saving...</Text>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

/**
 * Simple text input component
 */
export interface TextInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  isFocused?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  placeholder,
  onChange,
  isFocused = false,
}) => {
  useInput(
    (
      input: string,
      key: { backspace?: boolean; delete?: boolean; return?: boolean; escape?: boolean }
    ) => {
      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
      } else if (!key.return && !key.escape && input) {
        onChange(value + input);
      }
    },
    { isActive: isFocused }
  );

  return (
    <Box>
      <Text color={isFocused ? 'cyan' : 'white'}>{value || placeholder || ''}</Text>
      {isFocused && <Text color="cyan">_</Text>}
    </Box>
  );
};
