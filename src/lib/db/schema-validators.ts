import { z } from 'zod';
import type { Recipe, Category } from '../../types/recipe.js';

/**
 * SQLite stores booleans as 0/1 integers.
 * This helper converts them to proper booleans.
 */
const sqliteBoolean = z
  .union([z.number(), z.boolean(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'boolean') return val;
    return val === 1;
  });

/**
 * SQLite nullable fields should convert null to undefined for TypeScript optional types.
 */
const nullableNumber = z
  .number()
  .nullable()
  .transform((val) => val ?? undefined);

const nullableString = z
  .string()
  .nullable()
  .transform((val) => val ?? undefined);

const nullableBuffer = z
  .instanceof(Buffer)
  .nullable()
  .transform((val) => val ?? undefined);

/**
 * Zod schema for Recipe rows from SQLite.
 * Validates structure and converts integer booleans to proper booleans.
 */
export const RecipeSchema = z.object({
  uid: z.string(),
  name: z.string(),
  ingredients: nullableString,
  directions: nullableString,
  description: nullableString,
  notes: nullableString,
  nutritional_info: nullableString,
  servings: nullableString,
  prep_time: nullableString,
  cook_time: nullableString,
  total_time: nullableString,
  difficulty: nullableString,
  rating: nullableNumber,
  source: nullableString,
  source_url: nullableString,
  image_url: nullableString,
  photo: nullableBuffer,
  in_trash: sqliteBoolean,
  on_favorites: sqliteBoolean,
  on_grocery_list: sqliteBoolean,
  scale: nullableString,
  hash: nullableString,
  created: nullableString,
  updated: nullableString,
  photo_hash: nullableString,
  photo_large: nullableBuffer,
}) satisfies z.ZodType<Recipe, z.ZodTypeDef, unknown>;

/**
 * Zod schema for Category rows from SQLite.
 */
export const CategorySchema = z.object({
  uid: z.string(),
  order_flag: nullableNumber,
  name: z.string(),
  parent_uid: nullableString,
  created: nullableString,
  updated: nullableString,
}) satisfies z.ZodType<Category, z.ZodTypeDef, unknown>;

/**
 * Parse a single Recipe row from SQLite
 */
export function parseRecipe(row: unknown): Recipe {
  return RecipeSchema.parse(row);
}

/**
 * Parse multiple Recipe rows from SQLite
 */
export function parseRecipes(rows: unknown): Recipe[] {
  return z.array(RecipeSchema).parse(rows);
}

/**
 * Parse a single Category row from SQLite
 */
export function parseCategory(row: unknown): Category {
  return CategorySchema.parse(row);
}

/**
 * Parse multiple Category rows from SQLite
 */
export function parseCategories(rows: unknown): Category[] {
  return z.array(CategorySchema).parse(rows);
}
