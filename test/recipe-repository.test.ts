import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { RecipeRepository } from '../src/lib/db/repositories/recipes.js';
import { SCHEMA_SQL } from '../src/lib/db/schema.js';
import type { Recipe } from '../src/types/recipe.js';

describe('RecipeRepository', () => {
  let db: Database.Database;
  let repository: RecipeRepository;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA_SQL);
    repository = new RecipeRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a new recipe', () => {
      const recipe: Recipe = {
        uid: 'test-123',
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: JSON.stringify(['flour', 'water', 'salt']),
        rating: 5,
      };

      const created = repository.create(recipe);

      expect(created.uid).toBe('test-123');
      expect(created.name).toBe('Test Recipe');
      expect(created.rating).toBe(5);
    });
  });

  describe('getByUid', () => {
    it('should retrieve a recipe by UID', () => {
      const recipe: Recipe = {
        uid: 'test-456',
        name: 'Another Recipe',
      };

      repository.create(recipe);
      const retrieved = repository.getByUid('test-456');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Another Recipe');
    });

    it('should return undefined for non-existent recipe', () => {
      const retrieved = repository.getByUid('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should retrieve all recipes', () => {
      repository.create({ uid: '1', name: 'Recipe 1' });
      repository.create({ uid: '2', name: 'Recipe 2' });
      repository.create({ uid: '3', name: 'Recipe 3', in_trash: 1 });

      const all = repository.getAll();
      expect(all).toHaveLength(2); // Should exclude trashed

      const allWithTrash = repository.getAll(true);
      expect(allWithTrash).toHaveLength(3);
    });
  });

  describe('searchByName', () => {
    beforeEach(() => {
      repository.create({ uid: '1', name: 'Chocolate Cake' });
      repository.create({ uid: '2', name: 'Vanilla Cake' });
      repository.create({ uid: '3', name: 'Chocolate Cookies' });
    });

    it('should search recipes by name', () => {
      const results = repository.searchByName('Chocolate');
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toContain('Chocolate Cake');
      expect(results.map((r) => r.name)).toContain('Chocolate Cookies');
    });

    it('should be case-insensitive', () => {
      const results = repository.searchByName('chocolate');
      expect(results).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an existing recipe', () => {
      repository.create({ uid: '1', name: 'Original Name', rating: 3 });

      const updated = repository.update('1', { name: 'Updated Name', rating: 5 });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.rating).toBe(5);
    });
  });

  describe('delete', () => {
    it('should soft delete a recipe', () => {
      repository.create({ uid: '1', name: 'To Delete' });

      const result = repository.delete('1');
      expect(result).toBe(true);

      const recipe = repository.getByUid('1');
      expect(recipe?.in_trash).toBe(true);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', () => {
      repository.create({ uid: '1', name: 'Favorite Test', on_favorites: false });

      repository.toggleFavorite('1');
      let recipe = repository.getByUid('1');
      expect(recipe?.on_favorites).toBe(true);

      repository.toggleFavorite('1');
      recipe = repository.getByUid('1');
      expect(recipe?.on_favorites).toBe(false);
    });
  });

  describe('count', () => {
    it('should count recipes', () => {
      repository.create({ uid: '1', name: 'Recipe 1' });
      repository.create({ uid: '2', name: 'Recipe 2' });
      repository.create({ uid: '3', name: 'Recipe 3', in_trash: 1 });

      expect(repository.count()).toBe(2);
      expect(repository.count(true)).toBe(3);
    });
  });
});
