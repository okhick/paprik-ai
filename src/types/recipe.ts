export type Maybe<T> = T | null | undefined;

/**
 * Domain types for recipes and related entities
 */

export interface Recipe {
  uid: string;
  name: string;
  ingredients?: Maybe<string>; // JSON string
  directions?: Maybe<string>;
  description?: Maybe<string>;
  notes?: Maybe<string>;
  nutritional_info?: Maybe<string>;
  servings?: Maybe<string>;
  prep_time?: Maybe<string>;
  cook_time?: Maybe<string>;
  total_time?: Maybe<string>;
  difficulty?: Maybe<string>;
  rating?: Maybe<number>;
  source?: Maybe<string>;
  source_url?: Maybe<string>;
  image_url?: Maybe<string>;
  photo?: Maybe<Buffer>;
  in_trash?: Maybe<boolean>;
  on_favorites?: Maybe<boolean>;
  on_grocery_list?: Maybe<boolean>;
  scale?: Maybe<string>;
  hash?: Maybe<string>;
  created?: Maybe<string>;
  updated?: Maybe<string>;
  photo_hash?: Maybe<string>;
  photo_large?: Maybe<Buffer>;
  categories?: Category[]; // Populated when loaded with categories
}

export interface Category {
  uid: string;
  order_flag?: number;
  name: string;
  parent_uid?: string | null;
  created?: string;
  updated?: string;
}

export interface Meal {
  uid: string;
  recipe_uid?: string;
  date: string;
  type?: string;
  name?: string;
  order_flag?: number;
  created?: string;
  updated?: string;
}

export interface GroceryList {
  uid: string;
  name: string;
  is_default?: number;
  created?: string;
  updated?: string;
}

export interface GroceryItem {
  uid: string;
  list_uid: string;
  recipe_uid?: string;
  name: string;
  order_flag?: number;
  purchased?: number;
  quantity?: string;
  aisle?: string;
  created?: string;
  updated?: string;
}

export interface SyncMetadata {
  key: string;
  value?: string;
  last_sync?: string;
}
