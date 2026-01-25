/**
 * Database schema definitions for paprik-ai
 * Mirrors the Paprika API structure with local caching support
 */

export const SCHEMA_SQL = `
-- Core recipes table
CREATE TABLE IF NOT EXISTS recipes (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ingredients TEXT,                 -- JSON string from Paprika API
  directions TEXT,
  description TEXT,
  notes TEXT,
  nutritional_info TEXT,
  servings TEXT,
  prep_time TEXT,
  cook_time TEXT,
  total_time TEXT,
  difficulty TEXT,
  rating INTEGER DEFAULT 0,
  source TEXT,
  source_url TEXT,
  image_url TEXT,
  photo BLOB,                       -- Binary photo data
  in_trash INTEGER DEFAULT 0,       -- Soft delete flag
  on_favorites INTEGER DEFAULT 0,
  on_grocery_list INTEGER DEFAULT 0,
  scale TEXT,
  hash TEXT,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  photo_hash TEXT,
  photo_large BLOB
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  uid TEXT PRIMARY KEY,
  order_flag INTEGER,
  name TEXT NOT NULL,
  parent_uid TEXT,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_uid) REFERENCES categories(uid)
);

-- Recipe-Category junction table (many-to-many)
CREATE TABLE IF NOT EXISTS recipe_categories (
  recipe_uid TEXT NOT NULL,
  category_uid TEXT NOT NULL,
  PRIMARY KEY (recipe_uid, category_uid),
  FOREIGN KEY (recipe_uid) REFERENCES recipes(uid) ON DELETE CASCADE,
  FOREIGN KEY (category_uid) REFERENCES categories(uid) ON DELETE CASCADE
);

-- Meals table (meal planning)
CREATE TABLE IF NOT EXISTS meals (
  uid TEXT PRIMARY KEY,
  recipe_uid TEXT,
  date TEXT NOT NULL,               -- ISO date string
  type TEXT,                        -- breakfast, lunch, dinner, snack
  name TEXT,
  order_flag INTEGER,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_uid) REFERENCES recipes(uid) ON DELETE SET NULL
);

-- Grocery lists
CREATE TABLE IF NOT EXISTS grocery_lists (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Grocery items
CREATE TABLE IF NOT EXISTS grocery_items (
  uid TEXT PRIMARY KEY,
  list_uid TEXT NOT NULL,
  recipe_uid TEXT,
  name TEXT NOT NULL,
  order_flag INTEGER,
  purchased INTEGER DEFAULT 0,
  quantity TEXT,
  aisle TEXT,
  created DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_uid) REFERENCES grocery_lists(uid) ON DELETE CASCADE,
  FOREIGN KEY (recipe_uid) REFERENCES recipes(uid) ON DELETE SET NULL
);

-- Sync metadata (track sync state)
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_created ON recipes(created DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_in_trash ON recipes(in_trash);
CREATE INDEX IF NOT EXISTS idx_recipes_favorites ON recipes(on_favorites);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_uid);

CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_recipe ON meals(recipe_uid);

CREATE INDEX IF NOT EXISTS idx_grocery_items_list ON grocery_items(list_uid);
CREATE INDEX IF NOT EXISTS idx_grocery_items_purchased ON grocery_items(purchased);
`;

/**
 * Database version for migration tracking
 */
export const SCHEMA_VERSION = 1;
