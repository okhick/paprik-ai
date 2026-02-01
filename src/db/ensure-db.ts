import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getDatabase } from './index.js';
import { RecipeRepository } from './repositories/recipes.js';

/**
 * Checks if the database exists and has been initialized properly
 * Returns true if database exists and has at least one table
 */
export function ensureDatabase(): boolean {
  const dataDir = join(process.cwd(), '.data');
  const dbFile = join(dataDir, 'recipes.db');

  console.log('Checking database file:', dbFile);

  // Create data directory if it doesn't exist
  if (!existsSync(dataDir)) {
    console.log('Creating data directory:', dataDir);
    mkdirSync(dataDir, { recursive: true });
  }

  // Check if database file exists
  if (!existsSync(dbFile)) {
    console.log('Database file does not exist. Run "sync" command first.');
    return false;
  }

  try {
    // Try to initialize the database and check for recipes table
    const db = getDatabase();
    const tableExists = db
      .prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='recipes'")
      .get() as { count: number };

    if (tableExists.count === 0) {
      console.log('Recipes table does not exist. Run "sync" command first.');
      return false;
    }

    // Check for recipes count
    const repo = new RecipeRepository(db);
    const count = repo.count();
    console.log(`Database initialized with ${count} recipes.`);

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}
