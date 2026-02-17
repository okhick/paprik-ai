import type Database from 'better-sqlite3';
import { getDatabase } from '../index.js';
import type { Category } from '../../../types/recipe.js';
import { parseCategory, parseCategories } from '../schema-validators.js';

/**
 * Category repository for database operations
 */
export class CategoryRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  /**
   * Get all categories
   */
  getAll(): Category[] {
    return parseCategories(
      this.db.prepare('SELECT * FROM categories ORDER BY order_flag, name COLLATE NOCASE').all()
    );
  }

  /**
   * Get category by UID
   */
  getByUid(uid: string): Category | undefined {
    const row = this.db.prepare('SELECT * FROM categories WHERE uid = ?').get(uid);
    return row ? parseCategory(row) : undefined;
  }

  /**
   * Create a new category
   */
  create(category: Category): Category {
    const stmt = this.db.prepare(`
      INSERT INTO categories (
        uid, order_flag, name, parent_uid
      ) VALUES (
        @uid, @order_flag, @name, @parent_uid
      )
    `);

    stmt.run({
      uid: category.uid,
      order_flag: category.order_flag ?? null,
      name: category.name,
      parent_uid: category.parent_uid ?? null,
    });

    return this.getByUid(category.uid)!;
  }

  /**
   * Upsert category (insert or update)
   */
  upsert(category: Category): Category {
    const existing = this.getByUid(category.uid);
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE categories SET
          order_flag = @order_flag,
          name = @name,
          parent_uid = @parent_uid,
          updated = CURRENT_TIMESTAMP
        WHERE uid = @uid
      `);

      stmt.run({
        uid: category.uid,
        order_flag: category.order_flag ?? null,
        name: category.name,
        parent_uid: category.parent_uid ?? null,
      });

      return this.getByUid(category.uid)!;
    }

    return this.create(category);
  }

  /**
   * Delete outstanding categories not in provided list
   */
  hardDeleteOutstanding(uids: string[]): boolean {
    if (uids.length === 0) {
      // If no UIDs provided, delete all categories
      // First orphan all children to avoid foreign key constraint violations
      this.db.prepare('UPDATE categories SET parent_uid = NULL WHERE parent_uid IS NOT NULL').run();
      const result = this.db.prepare('DELETE FROM categories').run();
      return result.changes > 0;
    }

    // Orphan children whose parents are about to be deleted (i.e., NOT IN the keep list)
    // Create placeholders for the UIDs we're keeping
    const placeholders = uids.map(() => '?').join(',');
    this.db
      .prepare(
        `UPDATE categories SET parent_uid = NULL WHERE parent_uid IS NOT NULL AND parent_uid NOT IN (${placeholders})`
      )
      .run(...uids);

    // Now delete categories not in the keep list
    const result = this.db
      .prepare(`DELETE FROM categories WHERE uid NOT IN (${placeholders})`)
      .run(...uids);

    return result.changes > 0;
  }

  /**
   * Get categories for a specific recipe
   */
  getByRecipe(recipeUid: string): Category[] {
    return parseCategories(
      this.db
        .prepare(
          `
      SELECT c.* FROM categories c
      JOIN recipe_categories rc ON c.uid = rc.category_uid
      WHERE rc.recipe_uid = ?
      ORDER BY c.order_flag, c.name COLLATE NOCASE
    `
        )
        .all(recipeUid)
    );
  }

  /**
   * Get category tree with parent-child relationships
   * Returns all categories ordered to show hierarchy
   */
  getCategoryTree(): Category[] {
    // Get all categories
    const allCategories = this.getAll();

    // Build a map for quick lookup
    const categoryMap = new Map<string, Category & { children?: Category[] }>();
    allCategories.forEach((cat) => {
      categoryMap.set(cat.uid, { ...cat, children: [] });
    });

    // Build tree structure
    const rootCategories: Category[] = [];
    const flattenedTree: Category[] = [];

    allCategories.forEach((cat) => {
      const category = categoryMap.get(cat.uid)!;

      if (cat.parent_uid) {
        const parent = categoryMap.get(cat.parent_uid);
        if (parent && parent.children) {
          parent.children.push(category);
        } else {
          // Parent not found, treat as root
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Flatten tree in depth-first order
    const flattenTree = (categories: (Category & { children?: Category[] })[]): void => {
      categories.forEach((cat) => {
        flattenedTree.push(cat);
        if (cat.children && cat.children.length > 0) {
          flattenTree(cat.children);
        }
      });
    };

    flattenTree(rootCategories);

    return flattenedTree;
  }

  /**
   * Get recipe count for a category
   */
  getRecipeCount(categoryUid: string): number {
    const result = this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM recipe_categories rc
      JOIN recipes r ON rc.recipe_uid = r.uid
      WHERE rc.category_uid = ? AND r.in_trash = 0
    `
      )
      .get(categoryUid) as { count: number };

    return result.count;
  }
}
