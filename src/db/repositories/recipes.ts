import type Database from 'better-sqlite3';
import { getDatabase } from '../index.js';
import type { Recipe } from '../../types/recipe.js';

/**
 * Recipe repository for database operations
 */
export class RecipeRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  /**
   * Convert Recipe to SQLite-compatible data object
   * Handles boolean to integer conversion and null coalescing
   */
  private prepareForSQLite(recipe: Recipe | Partial<Recipe>) {
    return {
      uid: recipe.uid,
      name: recipe.name,
      ingredients: recipe.ingredients ?? null,
      directions: recipe.directions ?? null,
      description: recipe.description ?? null,
      notes: recipe.notes ?? null,
      nutritional_info: recipe.nutritional_info ?? null,
      servings: recipe.servings ?? null,
      prep_time: recipe.prep_time ?? null,
      cook_time: recipe.cook_time ?? null,
      total_time: recipe.total_time ?? null,
      difficulty: recipe.difficulty ?? null,
      rating: recipe.rating ?? 0,
      source: recipe.source ?? null,
      source_url: recipe.source_url ?? null,
      image_url: recipe.image_url ?? null,
      photo: recipe.photo ?? null,
      in_trash: recipe.in_trash ? 1 : 0,
      on_favorites: recipe.on_favorites ? 1 : 0,
      on_grocery_list: recipe.on_grocery_list ? 1 : 0,
      scale: recipe.scale ?? null,
      hash: recipe.hash ?? null,
      photo_hash: recipe.photo_hash ?? null,
      photo_large: recipe.photo_large ?? null,
    };
  }

  /**
   * Get all recipes (excluding trashed)
   */
  getAll(includeTrash = false): Recipe[] {
    const query = includeTrash
      ? 'SELECT * FROM recipes ORDER BY name COLLATE NOCASE'
      : 'SELECT * FROM recipes WHERE in_trash = 0 ORDER BY name COLLATE NOCASE';

    return this.db.prepare(query).all() as Recipe[];
  }

  /**
   * Get recipe by UID
   */
  getByUid(uid: string): Recipe | undefined {
    return this.db.prepare('SELECT * FROM recipes WHERE uid = ?').get(uid) as Recipe | undefined;
  }

  /**
   * Search recipes by name
   */
  searchByName(query: string, includeTrash = false): Recipe[] {
    const searchPattern = `%${query}%`;
    const sql = includeTrash
      ? 'SELECT * FROM recipes WHERE name LIKE ? COLLATE NOCASE ORDER BY name'
      : 'SELECT * FROM recipes WHERE name LIKE ? COLLATE NOCASE AND in_trash = 0 ORDER BY name';

    return this.db.prepare(sql).all(searchPattern) as Recipe[];
  }

  /**
   * Get recipes by rating
   */
  getByRating(minRating: number, includeTrash = false): Recipe[] {
    const sql = includeTrash
      ? 'SELECT * FROM recipes WHERE rating >= ? ORDER BY rating DESC, name'
      : 'SELECT * FROM recipes WHERE rating >= ? AND in_trash = 0 ORDER BY rating DESC, name';

    return this.db.prepare(sql).all(minRating) as Recipe[];
  }

  /**
   * Get favorite recipes
   */
  getFavorites(): Recipe[] {
    return this.db
      .prepare('SELECT * FROM recipes WHERE on_favorites = 1 AND in_trash = 0 ORDER BY name')
      .all() as Recipe[];
  }

  /**
   * Create a new recipe
   */
  create(recipe: Recipe): Recipe {
    const stmt = this.db.prepare(`
      INSERT INTO recipes (
        uid, name, ingredients, directions, description, notes,
        nutritional_info, servings, prep_time, cook_time, total_time,
        difficulty, rating, source, source_url, image_url, photo,
        in_trash, on_favorites, on_grocery_list, scale, hash,
        photo_hash, photo_large
      ) VALUES (
        @uid, @name, @ingredients, @directions, @description, @notes,
        @nutritional_info, @servings, @prep_time, @cook_time, @total_time,
        @difficulty, @rating, @source, @source_url, @image_url, @photo,
        @in_trash, @on_favorites, @on_grocery_list, @scale, @hash,
        @photo_hash, @photo_large
      )
    `);

    stmt.run(this.prepareForSQLite(recipe));
    return this.getByUid(recipe.uid)!;
  }

  /**
   * Update an existing recipe
   */
  update(uid: string, recipe: Partial<Recipe>): Recipe | undefined {
    const existing = this.getByUid(uid);
    if (!existing) {
      return undefined;
    }

    const updated = { ...existing, ...recipe, uid, updated: new Date().toISOString() };

    const stmt = this.db.prepare(`
      UPDATE recipes SET
        name = @name,
        ingredients = @ingredients,
        directions = @directions,
        description = @description,
        notes = @notes,
        nutritional_info = @nutritional_info,
        servings = @servings,
        prep_time = @prep_time,
        cook_time = @cook_time,
        total_time = @total_time,
        difficulty = @difficulty,
        rating = @rating,
        source = @source,
        source_url = @source_url,
        image_url = @image_url,
        photo = @photo,
        in_trash = @in_trash,
        on_favorites = @on_favorites,
        on_grocery_list = @on_grocery_list,
        scale = @scale,
        hash = @hash,
        updated = @updated,
        photo_hash = @photo_hash,
        photo_large = @photo_large
      WHERE uid = @uid
    `);

    stmt.run({ ...this.prepareForSQLite(updated), updated: updated.updated });
    return this.getByUid(uid);
  }

  /**
   * Delete a recipe (soft delete)
   */
  delete(uid: string): boolean {
    const result = this.db
      .prepare('UPDATE recipes SET in_trash = 1, updated = CURRENT_TIMESTAMP WHERE uid = ?')
      .run(uid);

    return result.changes > 0;
  }

  /**
   * Delete outstanding recipes not in provided list
   */
  hardDeleteOutstanding(uids: string[]): boolean {
    if (uids.length === 0) {
      // If no UIDs provided, delete all recipes
      const result = this.db.prepare('DELETE FROM recipes').run();
      return result.changes > 0;
    }

    // Create one placeholder for each UID
    // Note: SQLite default limit is 32766 parameters (since v3.32.0)
    const placeholders = uids.map(() => '?').join(',');
    const result = this.db
      .prepare(`DELETE FROM recipes WHERE uid NOT IN (${placeholders})`)
      .run(...uids);

    return result.changes > 0;
  }

  /**
   * Permanently delete a recipe
   */
  hardDelete(uid: string): boolean {
    const result = this.db.prepare('DELETE FROM recipes WHERE uid = ?').run(uid);
    return result.changes > 0;
  }

  /**
   * Restore a trashed recipe
   */
  restore(uid: string): boolean {
    const result = this.db
      .prepare('UPDATE recipes SET in_trash = 0, updated = CURRENT_TIMESTAMP WHERE uid = ?')
      .run(uid);

    return result.changes > 0;
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(uid: string): boolean {
    const recipe = this.getByUid(uid);
    if (!recipe) {
      return false;
    }

    const newStatus = recipe.on_favorites ? 0 : 1;
    const result = this.db
      .prepare('UPDATE recipes SET on_favorites = ?, updated = CURRENT_TIMESTAMP WHERE uid = ?')
      .run(newStatus, uid);

    return result.changes > 0;
  }

  /**
   * Get recipes by category
   */
  getByCategory(categoryUid: string): Recipe[] {
    return this.db
      .prepare(
        `
      SELECT r.* FROM recipes r
      JOIN recipe_categories rc ON r.uid = rc.recipe_uid
      WHERE rc.category_uid = ? AND r.in_trash = 0
      ORDER BY r.name COLLATE NOCASE
    `
      )
      .all(categoryUid) as Recipe[];
  }

  /**
   * Upsert recipe (insert or update)
   */
  upsert(recipe: Recipe): Recipe {
    const existing = this.getByUid(recipe.uid);
    if (existing) {
      return this.update(recipe.uid, recipe)!;
    }
    return this.create(recipe);
  }

  /**
   * Get count of recipes
   */
  count(includeTrash = false): number {
    const query = includeTrash
      ? 'SELECT COUNT(*) as count FROM recipes'
      : 'SELECT COUNT(*) as count FROM recipes WHERE in_trash = 0';

    const result = this.db.prepare(query).get() as { count: number };
    return result.count;
  }
}
