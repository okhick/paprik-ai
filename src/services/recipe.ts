import { RecipeRepository } from '../db/repositories/recipes.js';
import { Recipe } from '../types/recipe.js';
import { randomUUID } from 'crypto';

/**
 * Recipe service for business logic
 */
export class RecipeService {
  constructor(private repository: RecipeRepository) {}

  /**
   * Get all recipes
   */
  public getAllRecipes(includeTrash = false): Recipe[] {
    return this.repository.getAll(includeTrash);
  }

  /**
   * Get recipe by UID
   */
  public getRecipe(uid: string): Recipe | undefined {
    return this.repository.getByUid(uid);
  }

  /**
   * Search recipes by name
   */
  public searchRecipes(query: string, includeTrash = false): Recipe[] {
    return this.repository.searchByName(query, includeTrash);
  }

  /**
   * Get favorite recipes
   */
  public getFavorites(): Recipe[] {
    return this.repository.getFavorites();
  }

  /**
   * Get highly rated recipes
   */
  public getTopRated(minRating = 4): Recipe[] {
    return this.repository.getByRating(minRating);
  }

  /**
   * Create a new recipe
   */
  public createRecipe(recipe: Partial<Recipe>): Recipe {
    const newRecipe: Recipe = {
      uid: recipe.uid || randomUUID(),
      name: recipe.name || 'Untitled Recipe',
      ingredients: recipe.ingredients,
      directions: recipe.directions,
      description: recipe.description,
      notes: recipe.notes,
      nutritional_info: recipe.nutritional_info,
      servings: recipe.servings,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      total_time: recipe.total_time,
      difficulty: recipe.difficulty,
      rating: recipe.rating || 0,
      source: recipe.source,
      source_url: recipe.source_url,
      image_url: recipe.image_url,
      in_trash: false,
      on_favorites: recipe.on_favorites || false,
      on_grocery_list: recipe.on_grocery_list || false,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    return this.repository.create(newRecipe);
  }

  /**
   * Update a recipe
   */
  public updateRecipe(uid: string, updates: Partial<Recipe>): Recipe | undefined {
    return this.repository.update(uid, updates);
  }

  /**
   * Delete a recipe (soft delete)
   */
  public deleteRecipe(uid: string): boolean {
    return this.repository.delete(uid);
  }

  /**
   * Hard delete outstanding recipes not in provided list
   */
  public hardDeleteOutstandingRecipes(uids: string[]): boolean {
    return this.repository.hardDeleteOutstanding(uids);
  }

  /**
   * Permanently delete a recipe
   */
  public permanentlyDeleteRecipe(uid: string): boolean {
    return this.repository.hardDelete(uid);
  }

  /**
   * Restore a trashed recipe
   */
  public restoreRecipe(uid: string): boolean {
    return this.repository.restore(uid);
  }

  /**
   * Toggle favorite status
   */
  public toggleFavorite(uid: string): boolean {
    return this.repository.toggleFavorite(uid);
  }

  /**
   * Get recipes by category
   */
  public getRecipesByCategory(categoryUid: string): Recipe[] {
    return this.repository.getByCategory(categoryUid);
  }

  /**
   * Get recipe count
   */
  public getRecipeCount(includeTrash = false): number {
    return this.repository.count(includeTrash);
  }

  /**
   * Parse ingredients from JSON string
   */
  public parseIngredients(ingredientsJson?: string): string[] {
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
      // If parsing fails, return as single item
      return [ingredientsJson];
    }
  }

  /**
   * Parse directions from text
   */
  public parseDirections(directionsText?: string): string[] {
    if (!directionsText) {
      return [];
    }

    // Split by newlines and filter empty lines
    return directionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
}
