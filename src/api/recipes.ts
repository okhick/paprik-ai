import z from 'zod';
import { PaprikaClient } from './client.js';
import {
  PaprikaRecipe,
  PaprikaRecipesListSchema,
  PaprikaRecipeSchema,
  PaprikaCategoriesListSchema,
  PaprikaCategory,
} from './types.js';

function wrapinResult(schema: z.ZodTypeAny) {
  return z.object({
    result: schema,
  });
}

const PaprikaRecipeResponseSchema = wrapinResult(PaprikaRecipeSchema);
const PaprikaRecipesListResponseSchema = wrapinResult(PaprikaRecipesListSchema);

/**
 * Recipe API methods
 */
export class RecipeApi {
  constructor(private client: PaprikaClient) {}

  /**
   * Get list of all recipes (UIDs and names only)
   */
  async listRecipes(): Promise<Array<{ uid: string; name?: string }>> {
    const data = await this.client.get('/sync/recipes');
    return PaprikaRecipesListResponseSchema.parse(data).result;
  }

  /**
   * Get full recipe details by UID
   */
  async getRecipe(uid: string): Promise<PaprikaRecipe> {
    const data = await this.client.get(`/sync/recipe/${uid}`);
    return PaprikaRecipeResponseSchema.parse(data).result;
  }

  /**
   * Create a new recipe
   */
  async createRecipe(recipe: Partial<PaprikaRecipe>): Promise<PaprikaRecipe> {
    const data = await this.client.post('/recipes', recipe);
    return PaprikaRecipeSchema.parse(data);
  }

  /**
   * Update an existing recipe
   */
  async updateRecipe(uid: string, recipe: Partial<PaprikaRecipe>): Promise<PaprikaRecipe> {
    const data = await this.client.post(`/recipes/${uid}`, recipe);
    return PaprikaRecipeSchema.parse(data);
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(uid: string): Promise<void> {
    await this.client.delete(`/recipes/${uid}`);
  }

  /**
   * Get list of all categories
   */
  async listCategories(): Promise<PaprikaCategory[]> {
    const data = await this.client.get('/categories');
    return PaprikaCategoriesListSchema.parse(data);
  }

  /**
   * Get category details
   */
  async getCategory(uid: string): Promise<PaprikaCategory> {
    const data = await this.client.get(`/categories/${uid}`);
    return PaprikaCategoriesListSchema.parse(data)[0];
  }

  /**
   * Sync all recipes (fetch full details for all)
   * This is expensive but necessary for initial sync
   */
  async syncAllRecipes(): Promise<PaprikaRecipe[]> {
    const list = await this.listRecipes();
    const recipes: PaprikaRecipe[] = [];

    // Fetch recipes in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      const batchPromises = batch.map((item) => this.getRecipe(item.uid));
      const batchRecipes = await Promise.all(batchPromises);
      recipes.push(...batchRecipes);

      // Small delay between batches to be respectful to the API
      if (i + batchSize < list.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return recipes;
  }
}

/**
 * Create a recipe API instance
 */
export function createRecipeApi(client: PaprikaClient): RecipeApi {
  return new RecipeApi(client);
}
