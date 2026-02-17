# AGENTS.md

Documentation for AI assistants working on the paprik-ai project.

## Project Overview

**paprik-ai** is a terminal UI (TUI) application for managing recipes from [Paprika Recipe Manager](https://www.paprikaapp.com/). It provides a fast, keyboard-driven interface with local SQLite caching and plans for Claude AI integration for intelligent recipe features.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **CLI Framework**: [oclif](https://oclif.io) - Node.js CLI framework
- **UI**: [Ink](https://github.com/vadimdemedes/ink) - React for terminal interfaces
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Synchronous SQLite3
- **Validation**: [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- **Testing**: [Vitest](https://vitest.dev)
- **Code Quality**: ESLint + Prettier

## Architecture

### Directory Structure

```
src/
├── commands/              # CLI command implementations (oclif)
│   ├── sync.tsx          # Sync recipes from Paprika API
│   └── tui.ts            # Launch full-screen TUI
├── components/            # React/Ink UI components
│   ├── tui/              # TUI-specific components (3-pane layout)
│   │   ├── TuiApp.tsx    # Main TUI application
│   │   ├── Layout.tsx    # TUI layout wrapper
│   │   ├── RecipeListPane.tsx
│   │   ├── RecipeDetailPane.tsx
│   │   ├── CategoryFilterPane.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Pane.tsx      # Base pane component
│   │   └── AppContext.tsx # Global state management
│   └── ui.tsx            # Shared UI primitives (Layout, ErrorBox, LoadingBox)
├── lib/                   # Business logic & infrastructure
│   ├── api/              # Paprika API client
│   │   ├── client.ts     # HTTP client with auth
│   │   ├── recipes.ts    # Recipe endpoints
│   │   └── types.ts      # API response types (Zod schemas)
│   ├── db/               # Database core
│   │   ├── index.ts      # Database connection & initialization
│   │   ├── schema.ts     # Table definitions
│   │   ├── schema-validators.ts # Zod validators for DB rows
│   │   ├── ensure-db.ts  # Database initialization check
│   │   └── migrations/   # Database migrations
│   │       └── 001_initial.ts
│   ├── repositories/     # Data access layer
│   │   ├── recipes.ts    # Recipe CRUD operations
│   │   └── categories.ts # Category CRUD operations
│   ├── services/         # Business logic
│   │   └── sync.ts       # Paprika API sync logic
│   └── config.ts         # Environment config loader
├── hooks/                 # React hooks
│   └── useScrollable.ts  # Scrollable list state management
├── types/                 # TypeScript type definitions
│   ├── recipe.ts         # Domain models (Recipe, Category, etc.)
│   └── tui.ts            # TUI state types
├── utils/                 # Pure utility functions
│   ├── text.ts           # Text processing utilities
│   └── text-components.tsx # Text rendering components
└── index.ts               # CLI entry point
```

### Design Patterns

1. **Repository Pattern**: Database access abstracted through repository classes in `lib/repositories/`
2. **Service Layer**: Business logic lives in `lib/services/`, separating concerns from CLI commands
3. **Schema Validation**: 
   - API responses validated with Zod schemas (`lib/api/types.ts`)
   - Database rows validated with Zod schemas (`lib/db/schema-validators.ts`)
   - Automatic type conversions (SQLite integers → TypeScript booleans)
4. **Component Composition**: TUI built with reusable Ink components

## Key Components

### Database (`src/lib/db/`)

- Uses better-sqlite3 for synchronous, fast SQLite operations
- Database location: `~/.paprik/recipes.db` (configurable via `DATABASE_PATH` env var)
- Schema mirrors Paprika's data structure
- **Tables**: `recipes`, `categories`, `recipe_categories`, `sync_metadata`
- **Zod Validators**: Runtime validation and type conversion for all database rows

**Schema Validation Example:**

```typescript
// src/lib/db/schema-validators.ts
export const RecipeSchema = z.object({
  uid: z.string(),
  name: z.string(),
  in_trash: sqliteBoolean, // Converts 0/1 to false/true
  // ... other fields
});

export function parseRecipe(row: unknown): Recipe {
  return RecipeSchema.parse(row); // Runtime validation + conversion
}
```

### Repositories (`src/lib/repositories/`)

- **Pattern**: No type casts - all database results validated through Zod schemas
- Handle CRUD operations with type safety
- Convert between SQLite and TypeScript types automatically

**Repository Pattern Example:**

```typescript
// src/lib/repositories/recipes.ts
export class RecipeRepository {
  constructor(private db: Database.Database) {}

  getAll(includeTrash = false): Recipe[] {
    const query = includeTrash
      ? 'SELECT * FROM recipes ORDER BY name'
      : 'SELECT * FROM recipes WHERE in_trash = 0 ORDER BY name';
    return parseRecipes(this.db.prepare(query).all()); // Validated
  }
  
  getByUid(uid: string): Recipe | undefined {
    const row = this.db.prepare('SELECT * FROM recipes WHERE uid = ?').get(uid);
    return row ? parseRecipe(row) : undefined; // Validated
  }
}
```

### API Client (`src/lib/api/`)

- Communicates with Paprika API v1 (`https://www.paprikaapp.com/api/v1`)
- Uses HTTP Basic Auth with credentials from `.env`
- Handles gzip compression
- Response types in `api/types.ts` validated with Zod

### TUI Components (`src/components/tui/`)

- Built with Ink (React-like API for terminal)
- Three-pane layout: Categories (left) | Recipes (center) | Detail (right)
- Global state management via React Context (`AppContext.tsx`)
- Keyboard-driven navigation with comprehensive shortcuts
- Virtual scrolling for performance

**Component Pattern:**

```typescript
import { Box, Text, useInput } from 'ink';
import { useAppState, useAppActions } from './AppContext';

export function RecipeListPane({ height }: { height: number }) {
  const state = useAppState();
  const actions = useAppActions();

  useInput((input, key) => {
    if (key.upArrow) actions.selectPreviousRecipe();
    if (key.downArrow) actions.selectNextRecipe();
    if (input === '/') actions.activateSearch();
  });

  return (
    <Box flexDirection="column" height={height}>
      {state.visibleRecipes.map((recipe, i) => (
        <Text key={recipe.uid} inverse={i === state.selectedIndex}>
          {recipe.name}
        </Text>
      ))}
    </Box>
  );
}
```

### Commands (`src/commands/`)

- Implemented as oclif commands (classes extending `Command`)
- **Active Commands**:
  - `sync`: Sync recipes from Paprika API
  - `tui`: Launch full-screen TUI (default)
- Commands coordinate between services and UI components

**Command Structure:**

```typescript
import { Command } from '@oclif/core';

export default class Tui extends Command {
  static description = 'Launch the full-screen TUI for browsing recipes';

  async run(): Promise<void> {
    if (!ensureDatabase()) {
      this.log('Database not found. Run "paprik sync" first.');
      return;
    }

    const { default: TuiApp } = await import('../components/tui/TuiApp.js');
    const { waitUntilExit } = render(React.createElement(TuiApp));
    await waitUntilExit();
  }
}
```

## Configuration

Environment variables (loaded from `.env` file):

| Variable           | Description              | Required | Default                             |
| ------------------ | ------------------------ | -------- | ----------------------------------- |
| `PAPRIKA_EMAIL`    | Paprika account email    | Yes      | -                                   |
| `PAPRIKA_PASSWORD` | Paprika account password | Yes      | -                                   |
| `DATABASE_PATH`    | Custom database location | No       | `~/.paprik/recipes.db`              |
| `PAPRIKA_API_URL`  | Custom API endpoint      | No       | `https://www.paprikaapp.com/api/v1` |

Configuration is loaded via `src/lib/config.ts` using Zod validation.

## Coding Conventions

### TypeScript

- Use strict mode (configured in `tsconfig.json`)
- Prefer interfaces for data structures
- Use type aliases for complex unions
- Export types alongside implementations
- **Never use type casts (`as Type`)** - use Zod validation instead

### Naming

- **Files**: kebab-case (e.g., `recipe-repository.ts`)
- **Classes**: PascalCase (e.g., `RecipeRepository`)
- **Functions/Variables**: camelCase (e.g., `getRecipeByUid`)
- **Components**: PascalCase with `.tsx` extension
- **Constants**: UPPER_SNAKE_CASE for config values

### Async/Await

- better-sqlite3 is synchronous - no need for async in DB operations
- Use async/await for API calls
- Handle errors with try/catch

### Imports

- Use ES modules (`import`/`export`)
- Relative imports within `src/` (e.g., `'../lib/api/client.js'`)
- Path alias available: `@/` maps to `src/` (configured in tsconfig.json)
- Always include `.js` extension in imports (ES modules requirement)

### Database Operations

- **Always** validate database results through Zod schemas
- Use `parseRecipe()`, `parseRecipes()`, `parseCategory()`, `parseCategories()`
- Never cast database results: `db.get() as Recipe` ❌
- Boolean fields stored as integers (0/1) are auto-converted to TypeScript booleans

## Testing

- Test files in `test/` directory
- Use Vitest for testing
- Run tests: `npm test`
- Watch mode: `npm run test:watch`

## Development Workflow

### Getting Started

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in dev mode (watch)
npm run dev

# Run the CLI
node dist/index.js [command]
```

### Adding a New Database Table

1. Update schema in `src/lib/db/schema.ts`
2. Create Zod validator in `src/lib/db/schema-validators.ts`
3. Create repository in `src/lib/repositories/`
4. Create migration in `src/lib/db/migrations/` if needed

### Adding a TUI Component

1. Create `.tsx` file in `src/components/tui/`
2. Import Ink components (`Box`, `Text`, etc.)
3. Use `useAppState` and `useAppActions` for state
4. Use `useInput` hook for keyboard handling
5. Export functional component

## Common Tasks

### Sync from Paprika API

```typescript
// src/lib/services/sync.ts
import { RecipeApi } from '../api/recipes';
import { RecipeRepository } from '../repositories/recipes';
import { CategoryRepository } from '../repositories/categories';

export class SyncService {
  async syncRecipes(onProgress?: (status: SyncStatus) => void): Promise<SyncStatus> {
    const recipeList = await this.api.listRecipes();
    
    for (const item of recipeList) {
      const apiRecipe = await this.api.getRecipe(item.uid);
      const dbRecipe = this.convertToDbRecipe(apiRecipe);
      this.repository.upsert(dbRecipe);
      
      if (onProgress) onProgress(status);
    }
    
    return status;
  }
}
```

### Access Database

```typescript
import { getDatabase } from '../lib/db';
import { RecipeRepository } from '../lib/repositories/recipes';

const db = getDatabase();
const recipeRepo = new RecipeRepository(db);
const recipes = recipeRepo.getAll(); // Returns Recipe[] (validated)
```

## Resources

- [Paprika API Docs (Kappari)](https://github.com/johnwbyrd/kappari) - Unofficial Paprika API documentation
- [Ink Documentation](https://github.com/vadimdemedes/ink) - Building terminal UIs
- [oclif Documentation](https://oclif.io) - CLI framework
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Zod Documentation](https://zod.dev) - Schema validation

## Troubleshooting

### Database Issues

- Database is created in `~/.paprik/` on first sync
- Delete `~/.paprik/` directory to reset database
- Check `DATABASE_PATH` env var if using custom location

### API Authentication

- Verify `PAPRIKA_EMAIL` and `PAPRIKA_PASSWORD` in `.env`
- Test credentials at https://www.paprikaapp.com/account/login

### TUI Not Rendering

- Ensure terminal supports ANSI escape codes
- Check that stdout is a TTY
- Terminal must be at least 80x24 characters

## Contributing Guidelines

When making changes:

1. **Maintain Architecture**: Follow existing patterns (repository, service layer, etc.)
2. **Type Safety**: Add types for all functions and data structures
3. **No Type Casts**: Use Zod validation instead of `as` casts
4. **Error Handling**: Handle errors gracefully, provide helpful messages
5. **Testing**: Add tests for new functionality
6. **Documentation**: Update README.md and this file as needed
7. **Formatting**: Run `npm run format` before committing
8. **Linting**: Fix all `npm run lint` errors

## Verification Workflow

After making TypeScript changes, **always verify** with these steps:

```bash
# 1. Type checking (catches type errors)
npm run typecheck

# 2. Linting (catches style issues)
npm run lint

# 3. Build (generates JS output)
npm run build

# 4. Tests
npm test
```

**For AI Assistants**: After editing TypeScript files, run LSP diagnostics or `npm run typecheck` to catch type errors immediately before claiming success.

## Future Enhancements

Planned features for Claude AI integration:

1. **Natural Language Recipe Search** - Parse queries like "quick pasta under 30 minutes"
2. **Recipe Suggestions** - Analyze collection and suggest new recipes
3. **Meal Planning** - AI-assisted weekly planning
4. **Ingredient Substitutions** - Smart substitutions maintaining flavor profiles
5. **Nutritional Analysis** - Parse ingredients and track dietary goals

### Integration Points

When implementing AI features:

- Add AI service in `src/lib/services/ai.ts`
- Keep AI logic separate from core recipe management
- Use environment variable for Claude API key: `ANTHROPIC_API_KEY`
- Consider caching AI responses in database
- Add dedicated commands (e.g., `paprik suggest`, `paprik plan`)

## Contact

**Author**: Oliver Hickman  
**License**: ISC
