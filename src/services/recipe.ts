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
  async getAllRecipes(includeTrash = false): Promise<Recipe[]> {
    return this.repository.getAll(includeTrash);
  }

  /**
   * Get recipe by UID
   */
  async getRecipe(uid: string): Promise<Recipe | undefined> {
    return this.repository.getByUid(uid);
  }

  /**
   * Search recipes by name
   */
  async searchRecipes(query: string, includeTrash = false): Promise<Recipe[]> {
    return this.repository.searchByName(query, includeTrash);
  }

  /**
   * Get favorite recipes
   */
  async getFavorites(): Promise<Recipe[]> {
    return this.repository.getFavorites();
  }

  /**
   * Get highly rated recipes
   */
  async getTopRated(minRating = 4): Promise<Recipe[]> {
    return this.repository.getByRating(minRating);
  }

  /**
   * Create a new recipe
   */
  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
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
      in_trash: 0,
      on_favorites: recipe.on_favorites || 0,
      on_grocery_list: recipe.on_grocery_list || 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    return this.repository.create(newRecipe);
  }

  /**
   * Update a recipe
   */
  async updateRecipe(uid: string, updates: Partial<Recipe>): Promise<Recipe | undefined> {
    return this.repository.update(uid, updates);
  }

  /**
   * Delete a recipe (soft delete)
   */
  async deleteRecipe(uid: string): Promise<boolean> {
    return this.repository.delete(uid);
  }

  /**
   * Permanently delete a recipe
   */
  async permanentlyDeleteRecipe(uid: string): Promise<boolean> {
    return this.repository.hardDelete(uid);
  }

  /**
   * Restore a trashed recipe
   */
  async restoreRecipe(uid: string): Promise<boolean> {
    return this.repository.restore(uid);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(uid: string): Promise<boolean> {
    return this.repository.toggleFavorite(uid);
  }

  /**
   * Get recipes by category
   */
  async getRecipesByCategory(categoryUid: string): Promise<Recipe[]> {
    return this.repository.getByCategory(categoryUid);
  }

  /**
   * Get recipe count
   */
  async getRecipeCount(includeTrash = false): Promise<number> {
    return this.repository.count(includeTrash);
  }

  /**
   * Parse ingredients from JSON string
   */
  parseIngredients(ingredientsJson?: string): string[] {
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
  parseDirections(directionsText?: string): string[] {
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
