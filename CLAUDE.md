# paprik-ai - Claude Documentation

## Quick Start

Terminal UI for managing Paprika recipes with local SQLite caching. Built with TypeScript, Ink (React for CLIs), oclif, and better-sqlite3.

**Entry points:**
- `src/index.ts` - CLI entry
- `src/commands/tui.tsx` - TUI mode (main interface)
- `src/tui/App.tsx` - TUI application root
- `src/services/sync.ts` - API/DB sync orchestration

## Architecture

**Three layers:**
1. **CLI** (`src/commands/`) - oclif commands: browse, search, add, edit, sync, tui
2. **Services** (`src/services/`) - Business logic, SyncService for API ↔ DB
3. **Data** - `src/api/` (Paprika API client) + `src/db/` (SQLite repositories)

**TUI pattern:**
- `src/tui/` - App shell (Router, CommandPalette, StatusBar, keyboard shortcuts)
- `src/views/` - View components (Browse, Detail, Form, Search, Sync, Help)
- `src/store/` - Zustand stores (viewStore, recipeStore, uiStore)
- Each view is self-contained React component; navigation via viewStore.navigate()

**Database:**
- SQLite at `.data/recipes.db` (set via `DATABASE_PATH` env var)
- Tables: recipes, categories, recipe_categories, meals, grocery_lists/items, sync_metadata
- Access via repository pattern: `RecipeRepository` in `src/db/repositories/recipes.ts`
- Schema: `src/db/schema.ts`

## Key Conventions

**Repository Pattern:**
```typescript
const repo = new RecipeRepository(db);
repo.getAll();
repo.getByUid(uid);
repo.upsert(recipe);
repo.delete(uid);       // Soft delete (in_trash = 1)
repo.hardDelete(uid);   // Permanent delete
```

**State Management (Zustand):**
```typescript
const { navigate } = useViewStore();
const { recipes, filteredRecipes, setFilter } = useRecipeStore();
const { commandPaletteOpen } = useUIStore();
```

**Type Safety:**
- Strict TypeScript mode, no implicit `any`
- API responses validated with Zod schemas (`api/types.ts`)
- Use `Maybe<T>` helper for nullable fields

**Configuration (`.env`):**
```bash
PAPRIKA_EMAIL=your@email.com    # Required
PAPRIKA_PASSWORD=yourpassword   # Required
DATABASE_PATH=.data/recipes.db  # Optional
```

## Common Commands

```bash
# Build & Run
npm run build                    # Compile TypeScript → dist/
npm run dev                      # Watch mode for development
./dist/index.js tui              # Launch TUI
./dist/index.js sync             # Sync from Paprika API

# Testing & Quality
npm test                         # Run vitest
npm run typecheck                # Type check
npm run lint:fix                 # ESLint auto-fix
npm run format                   # Prettier format

# Database
rm -rf .data/ && ./dist/index.js sync    # Reset DB and re-sync
sqlite3 .data/recipes.db "SELECT name FROM recipes LIMIT 10;"
```

## Adding Features

**New oclif command:** Create `src/commands/foo.ts` extending `Command`, export default class with `run()`

**New TUI view:** Create `src/views/FooView.tsx`, add to `Router.tsx`, add navigation shortcuts

**New Zustand store:** Create `src/store/fooStore.ts`, export `useFooStore()` hook

**Database schema change:** Update `src/db/schema.ts`, create migration, reset DB for dev

## Critical Gotchas

**Ingredients:** Stored as JSON string in DB. Parse with `JSON.parse(recipe.ingredients)`

**Soft deletes:** `repo.delete()` sets `in_trash = 1`, not permanent deletion. Use `repo.hardDelete()` to actually remove.

**Sync rate limiting:** 100ms delay between API calls in `SyncService.delay()` - don't remove or you'll hit rate limits

**better-sqlite3:** Synchronous SQLite - no async/await needed for queries (but service methods may still be async)

**TUI persistence:** TUI runs continuously until Ctrl+Q. State persists across navigation. Command mode exits after each operation.

**Ink limitations:** No mouse support, text-only layout. Performance degrades with >1000 items in lists - consider pagination.

**Photos:** BLOBs stored in DB but not displayed in TUI yet

**Paprika API:** HTTP Basic Auth to `https://www.paprikaapp.com/api/v1`, gzip compression, credentials from `.env`

## Questions to Ask User

When implementing features, clarify:
- Should changes sync to Paprika API immediately or wait for manual sync?
- Offline-first mode with conflict resolution?
- Image display in TUI - ASCII art, external viewer, or iTerm2 inline images?
- Multi-user support or single user only?

## Quick Reference

```bash
# Fresh start
rm -rf .data/ dist/ && npm install && npm run build && ./dist/index.js sync

# Two-terminal development
npm run dev              # Terminal 1 (watch build)
./dist/index.js tui      # Terminal 2 (run TUI)

# Debug
node --inspect ./dist/index.js tui
```

**Security:** Credentials in plaintext `.env`, no DB encryption. Never commit `.env` or `.data/`

**Performance:** Indexes on name/rating/dates. Pagination recommended for >500 recipes.

**Main branch:** `master` (no CI/CD currently)
