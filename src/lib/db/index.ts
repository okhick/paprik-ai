import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema.js';

/**
 * Database instance singleton
 */
let db: Database.Database | null = null;

/**
 * Get or create the database instance
 */
export function getDatabase(dbPath?: string): Database.Database {
  if (db) {
    return db;
  }

  // Default database location
  const dataDir = dbPath ? join(dbPath, '..') : join(process.cwd(), '.data');
  const dbFile = dbPath || join(dataDir, 'recipes.db');

  // Ensure data directory exists
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  // Open database
  db = new Database(dbFile);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Initialize schema
  initializeSchema(db);

  return db;
}

/**
 * Initialize database schema and run migrations
 */
function initializeSchema(database: Database.Database): void {
  // Run the base schema
  database.exec(SCHEMA_SQL);

  // Check current schema version
  const versionRow = database
    .prepare('SELECT value FROM sync_metadata WHERE key = ?')
    .get('schema_version') as { value: string } | undefined;

  const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

  if (currentVersion < SCHEMA_VERSION) {
    // Run migrations if needed
    runMigrations(database, currentVersion);

    // Update schema version
    database
      .prepare(
        `INSERT OR REPLACE INTO sync_metadata (key, value, last_sync)
         VALUES (?, ?, CURRENT_TIMESTAMP)`
      )
      .run('schema_version', SCHEMA_VERSION.toString());
  }
}

/**
 * Run database migrations
 */
function runMigrations(_database: Database.Database, fromVersion: number): void {
  // Migrations will be added here as the schema evolves
  // For now, the initial schema is created in SCHEMA_SQL
  console.log(`Database migrated from version ${fromVersion} to ${SCHEMA_VERSION}`);
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Execute a function within a transaction
 */
export function transaction<T>(fn: (db: Database.Database) => T): T {
  const database = getDatabase();
  const tx = database.transaction(fn);
  return tx(database);
}
