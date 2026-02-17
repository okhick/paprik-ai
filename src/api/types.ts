import { z } from 'zod';

/**
 * Zod schemas for Paprika API responses
 */

export const PaprikaRecipeSchema = z.object({
  uid: z.string(),
  name: z.string(),
  ingredients: z.string().nullish(),
  directions: z.string().nullish(),
  description: z.string().nullish(),
  notes: z.string().nullish(),
  nutritional_info: z.string().nullish(),
  servings: z.string().nullish(),
  prep_time: z.string().nullish(),
  cook_time: z.string().nullish(),
  total_time: z.string().nullish(),
  difficulty: z.string().nullish(),
  rating: z.number().nullish(),
  source: z.string().nullish(),
  source_url: z.string().nullish(),
  image_url: z.string().nullish(),
  photo: z.string().nullish(), // Base64 or URL
  in_trash: z.boolean().nullish(),
  on_favorites: z.boolean().nullish(),
  on_grocery_list: z.boolean().nullish(),
  scale: z.string().nullish(),
  hash: z.string().nullish(),
  created: z.string().nullish(),
  photo_hash: z.string().nullish(),
  categories: z.array(z.string()).nullable().optional(), // Array of category UIDs
});

export const PaprikaCategorySchema = z.object({
  uid: z.string(),
  order_flag: z.number().optional(),
  name: z.string(),
  parent_uid: z.string().nullable(),
});

export const PaprikaMealSchema = z.object({
  uid: z.string(),
  recipe_uid: z.string().optional(),
  date: z.string(),
  type: z.string().optional(),
  name: z.string().optional(),
  order_flag: z.number().optional(),
});

export const PaprikaGroceryListSchema = z.object({
  uid: z.string(),
  name: z.string(),
  is_default: z.number().optional(),
});

export const PaprikaGroceryItemSchema = z.object({
  uid: z.string(),
  list_uid: z.string(),
  recipe_uid: z.string().optional(),
  name: z.string(),
  order_flag: z.number().optional(),
  purchased: z.number().optional(),
  quantity: z.string().optional(),
  aisle: z.string().optional(),
});

// Array schemas for list responses
export const PaprikaRecipesListSchema = z.array(
  z.object({
    uid: z.string(),
    name: z.string().optional(),
  })
);

export const PaprikaCategoriesListSchema = z.array(PaprikaCategorySchema);
export const PaprikaMealsListSchema = z.array(PaprikaMealSchema);
export const PaprikaGroceryListsSchema = z.array(PaprikaGroceryListSchema);
export const PaprikaGroceryItemsSchema = z.array(PaprikaGroceryItemSchema);

// Type exports
export type PaprikaRecipe = z.infer<typeof PaprikaRecipeSchema>;
export type PaprikaCategory = z.infer<typeof PaprikaCategorySchema>;
export type PaprikaMeal = z.infer<typeof PaprikaMealSchema>;
export type PaprikaGroceryList = z.infer<typeof PaprikaGroceryListSchema>;
export type PaprikaGroceryItem = z.infer<typeof PaprikaGroceryItemSchema>;

/**
 * API configuration
 */
export interface PaprikaApiConfig {
  email: string;
  password: string;
  baseUrl?: string;
}

/**
 * API error
 */
export class PaprikaApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'PaprikaApiError';
  }
}
