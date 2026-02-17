import { RecipeApi } from '../api/recipes.js';
import { RecipeRepository } from '../db/repositories/recipes.js';
import { CategoryRepository } from '../db/repositories/categories.js';
import { Recipe } from '../types/recipe.js';
import { PaprikaCategory, PaprikaRecipe } from '../api/types.js';

/**
 * Sync status
 */
export interface SyncStatus {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ uid: string; error: string }>;
  categories: {
    total: number;
    synced: number;
  };
}

/**
 * Sync service for API ↔ Database synchronization
 */
export class SyncService {
  constructor(
    private api: RecipeApi,
    private repository: RecipeRepository,
    private categoryRepository: CategoryRepository
  ) {}

  /**
   * Sync categories from API to database
   */
  async syncCategories(onProgress?: (status: SyncStatus) => void): Promise<void> {
    const status: SyncStatus = {
      total: 0,
      synced: 0,
      failed: 0,
      errors: [],
      categories: {
        total: 0,
        synced: 0,
      },
    };

    try {
      const categories = await this.api.listCategories();
      status.categories.total = categories.length;

      if (onProgress) {
        onProgress(status);
      }

      // Sort categories to insert parents before children
      const sorted = this.sortCategoriesByDependency(categories);

      for (const category of sorted) {
        this.categoryRepository.upsert(category);
        status.categories.synced++;

        if (onProgress) {
          onProgress({ ...status });
        }
      }

      // Clean up deleted categories
      this.categoryRepository.hardDeleteOutstanding(categories.map((c) => c.uid));
    } catch (error) {
      throw new Error(
        `Failed to sync categories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sort categories so parents come before children
   * Uses a simple level-order approach
   */
  private sortCategoriesByDependency(categories: PaprikaCategory[]): PaprikaCategory[] {
    const sorted: PaprikaCategory[] = [];
    const remaining = [...categories];
    const inserted = new Set<string>();

    // Keep iterating until all categories are inserted
    let previousLength = remaining.length;
    while (remaining.length > 0) {
      // Find categories whose parent is already inserted (or has no parent)
      const canInsert = remaining.filter((cat) => !cat.parent_uid || inserted.has(cat.parent_uid));

      if (canInsert.length === 0) {
        // No progress made - we have a cycle or orphaned categories
        // Just insert the rest anyway (they'll use upsert which is more forgiving)
        sorted.push(...remaining);
        break;
      }

      // Insert these categories
      for (const cat of canInsert) {
        sorted.push(cat);
        inserted.add(cat.uid);
        const index = remaining.findIndex((c) => c.uid === cat.uid);
        if (index !== -1) {
          remaining.splice(index, 1);
        }
      }

      // Safety check to prevent infinite loops
      if (remaining.length === previousLength) {
        sorted.push(...remaining);
        break;
      }
      previousLength = remaining.length;
    }

    return sorted;
  }

  /**
   * Sync all recipes from API to database
   */
  async syncRecipes(onProgress?: (status: SyncStatus) => void): Promise<SyncStatus> {
    const status: SyncStatus = {
      total: 0,
      synced: 0,
      failed: 0,
      errors: [],
      categories: {
        total: 0,
        synced: 0,
      },
    };

    let recipeList: {
      uid: string;
      name?: string | undefined;
    }[] = [];

    // Get list of recipes from API
    try {
      recipeList = await this.api.listRecipes();
      status.total = recipeList.length;

      if (onProgress) {
        onProgress(status);
      }
    } catch (error) {
      throw new Error(
        `Failed to sync recipes: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Hard delete outstanding recipes not in provided list
    this.repository.hardDeleteOutstanding(recipeList.map((item) => item.uid));

    // Fetch and sync each recipe
    for (const item of recipeList) {
      try {
        const apiRecipe = await this.api.getRecipe(item.uid);
        const dbRecipe = this.convertToDbRecipe(apiRecipe);

        // Upsert to database
        this.repository.upsert(dbRecipe);

        // Sync category links
        if (apiRecipe.categories && apiRecipe.categories.length > 0) {
          this.repository.linkCategories(apiRecipe.uid, apiRecipe.categories);
        } else {
          // Clear category links if no categories or null
          this.repository.linkCategories(apiRecipe.uid, []);
        }

        status.synced++;

        if (onProgress) {
          onProgress({ ...status });
        }
      } catch (error) {
        status.failed++;
        status.errors.push({
          uid: item.uid,
          error: error instanceof Error ? error.message : String(error),
        });

        if (onProgress) {
          onProgress({ ...status });
        }
      }

      // Small delay to avoid rate limiting
      await this.delay(200);
    }

    return status;
  }

  /**
   * Sync a single recipe from API to database
   */
  async syncRecipe(uid: string): Promise<Recipe> {
    const apiRecipe = await this.api.getRecipe(uid);
    const dbRecipe = this.convertToDbRecipe(apiRecipe);
    return this.repository.upsert(dbRecipe);
  }

  /**
   * Push local recipe to API
   */
  async pushRecipe(uid: string): Promise<void> {
    const dbRecipe = this.repository.getByUid(uid);
    if (!dbRecipe) {
      throw new Error(`Recipe ${uid} not found in database`);
    }

    const apiRecipe = this.convertToApiRecipe(dbRecipe);

    // Check if exists on API
    try {
      await this.api.getRecipe(uid);
      // Exists, update
      await this.api.updateRecipe(uid, apiRecipe);
    } catch {
      // Doesn't exist, create
      await this.api.createRecipe(apiRecipe);
    }
  }

  /**
   * Delete recipe from API and database
   */
  async deleteRecipe(uid: string): Promise<void> {
    // Delete from API
    await this.api.deleteRecipe(uid);

    // Delete from database
    this.repository.hardDelete(uid);
  }

  /**
   * Convert Paprika API recipe to database recipe
   */
  private convertToDbRecipe(apiRecipe: PaprikaRecipe): Recipe {
    return {
      uid: apiRecipe.uid,
      name: apiRecipe.name,
      ingredients: apiRecipe.ingredients,
      directions: apiRecipe.directions,
      description: apiRecipe.description,
      notes: apiRecipe.notes,
      nutritional_info: apiRecipe.nutritional_info,
      servings: apiRecipe.servings,
      prep_time: apiRecipe.prep_time,
      cook_time: apiRecipe.cook_time,
      total_time: apiRecipe.total_time,
      difficulty: apiRecipe.difficulty,
      rating: apiRecipe.rating || 0,
      source: apiRecipe.source,
      source_url: apiRecipe.source_url,
      image_url: apiRecipe.image_url,
      in_trash: apiRecipe.in_trash || false,
      on_favorites: apiRecipe.on_favorites || false,
      on_grocery_list: apiRecipe.on_grocery_list || false,
      scale: apiRecipe.scale,
      hash: apiRecipe.hash,
      created: apiRecipe.created,
      updated: new Date().toISOString(),
      photo_hash: apiRecipe.photo_hash,
    };
  }

  /**
   * Convert database recipe to Paprika API recipe
   */
  private convertToApiRecipe(dbRecipe: Recipe): Partial<PaprikaRecipe> {
    return {
      uid: dbRecipe.uid,
      name: dbRecipe.name,
      ingredients: dbRecipe.ingredients,
      directions: dbRecipe.directions,
      description: dbRecipe.description,
      notes: dbRecipe.notes,
      nutritional_info: dbRecipe.nutritional_info,
      servings: dbRecipe.servings,
      prep_time: dbRecipe.prep_time,
      cook_time: dbRecipe.cook_time,
      total_time: dbRecipe.total_time,
      difficulty: dbRecipe.difficulty,
      rating: dbRecipe.rating,
      source: dbRecipe.source,
      source_url: dbRecipe.source_url,
      image_url: dbRecipe.image_url,
      in_trash: dbRecipe.in_trash,
      on_favorites: dbRecipe.on_favorites,
      on_grocery_list: dbRecipe.on_grocery_list,
      scale: dbRecipe.scale,
      hash: dbRecipe.hash,
      photo_hash: dbRecipe.photo_hash,
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
