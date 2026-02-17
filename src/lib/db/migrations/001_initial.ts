/**
 * Initial database migration
 *
 * This migration creates the base schema for paprik-ai.
 * The actual schema SQL is defined in src/db/schema.ts
 */

import type Database from 'better-sqlite3';

export function up(_db: Database.Database): void {
  // The initial schema is created in schema.ts via SCHEMA_SQL
  // This file exists for future migrations to follow the same pattern
  console.log('Initial schema created');
}

export function down(db: Database.Database): void {
  // Drop all tables (use with caution!)
  db.exec(`
    DROP TABLE IF EXISTS grocery_items;
    DROP TABLE IF EXISTS grocery_lists;
    DROP TABLE IF EXISTS meals;
    DROP TABLE IF EXISTS recipe_categories;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS recipes;
    DROP TABLE IF EXISTS sync_metadata;
  `);
}
