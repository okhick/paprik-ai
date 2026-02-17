# CLAUDE.md

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
├── api/                    # Paprika API client
│   ├── client.ts          # HTTP client with auth
│   ├── recipes.ts         # Recipe endpoints
│   └── types.ts           # API response types
├── commands/              # CLI command implementations (oclif)
├── components/            # Ink TUI components (React)
│   ├── Layout.tsx         # Common layout wrapper
│   ├── RecipeList.tsx     # Recipe browsing interface
│   ├── RecipeDetail.tsx   # Single recipe view
│   └── RecipeForm.tsx     # Recipe add/edit form
├── db/                    # Database layer
│   ├── index.ts           # Database connection & initialization
│   ├── schema.ts          # Table definitions
│   ├── migrations/        # Database migrations
│   │   └── 001_initial.ts
│   └── repositories/      # Data access objects
│       └── recipes.ts     # Recipe CRUD operations
├── services/              # Business logic
│   ├── recipe.ts          # Recipe operations
│   └── sync.ts            # Paprika API sync logic
├── types/                 # TypeScript type definitions
│   └── recipe.ts          # Domain models
├── utils/                 # Utilities
│   └── config.ts          # Environment config loader
└── index.ts               # CLI entry point
```

### Design Patterns

1. **Repository Pattern**: Database access is abstracted through repository classes in `db/repositories/`
2. **Service Layer**: Business logic lives in `services/`, separating concerns from CLI commands
3. **Dependency Injection**: Commands receive services/repos as dependencies where possible
4. **Schema Validation**: API responses validated with Zod schemas before database storage

## Key Components

### Database (`src/db/`)

- Uses better-sqlite3 for synchronous, fast SQLite operations
- Database location: `.data/recipes.db` (configurable via `DATABASE_PATH` env var)
- Schema mirrors Paprika's data structure
- Migrations in `db/migrations/` - named with numeric prefixes (e.g., `001_initial.ts`)

**Repository Pattern Example:**

```typescript
// src/db/repositories/recipes.ts
export class RecipeRepository {
  constructor(private db: Database) {}

  findAll(): Recipe[] {
    /* ... */
  }
  findById(uid: string): Recipe | null {
    /* ... */
  }
  create(recipe: Recipe): void {
    /* ... */
  }
  update(uid: string, recipe: Partial<Recipe>): void {
    /* ... */
  }
}
```

### API Client (`src/api/`)

- Communicates with Paprika API v1 (`https://www.paprikaapp.com/api/v1`)
- Uses HTTP Basic Auth with credentials from `.env`
- Handles gzip compression
- Response types in `api/types.ts` validated with Zod

### TUI Components (`src/components/`)

- Built with Ink (React-like API for terminal)
- Use React hooks (`useState`, `useEffect`, `useInput`)
- Keyboard-driven interfaces
- Components are functional with TypeScript

**Example Pattern:**

```typescript
import { Box, Text } from 'ink';
import { useInput } from 'ink';

export function RecipeList({ recipes }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
    if (key.downArrow) setSelectedIndex(i => Math.min(recipes.length - 1, i + 1));
  });

  return (
    <Box flexDirection="column">
      {recipes.map((recipe, i) => (
        <Text key={recipe.uid} inverse={i === selectedIndex}>
          {recipe.name}
        </Text>
      ))}
    </Box>
  );
}
```

### Commands (`src/commands/`)

- Implemented as oclif commands (classes extending `Command`)
- Each command is a separate file (e.g., `browse.ts`, `sync.ts`, `search.ts`)
- Use flags for options (e.g., `--favorites`, `--min-rating`)
- Commands coordinate between services and UI components

**Command Structure:**

```typescript
import { Command, Flags } from '@oclif/core';

export default class Browse extends Command {
  static description = 'Browse recipes in the terminal';

  static flags = {
    favorites: Flags.boolean({ description: 'Show only favorites' }),
    'min-rating': Flags.integer({ description: 'Minimum rating' }),
  };

  async run() {
    const { flags } = await this.parse(Browse);
    // Implementation
  }
}
```

## Configuration

Environment variables (loaded from `.env` file):

| Variable           | Description              | Required | Default                             |
| ------------------ | ------------------------ | -------- | ----------------------------------- |
| `PAPRIKA_EMAIL`    | Paprika account email    | Yes      | -                                   |
| `PAPRIKA_PASSWORD` | Paprika account password | Yes      | -                                   |
| `DATABASE_PATH`    | Custom database location | No       | `.data/recipes.db`                  |
| `PAPRIKA_API_URL`  | Custom API endpoint      | No       | `https://www.paprikaapp.com/api/v1` |

Configuration is loaded via `src/utils/config.ts` using Zod validation.

## Coding Conventions

### TypeScript

- Use strict mode (configured in `tsconfig.json`)
- Prefer interfaces for data structures
- Use type aliases for complex unions
- Export types alongside implementations

### Naming

- **Files**: kebab-case (e.g., `recipe-service.ts`)
- **Classes**: PascalCase (e.g., `RecipeRepository`)
- **Functions/Variables**: camelCase (e.g., `findRecipeById`)
- **Components**: PascalCase with `.tsx` extension
- **Constants**: UPPER_SNAKE_CASE for config values

### Async/Await

- better-sqlite3 is synchronous - no need for async in DB operations
- Use async/await for API calls
- Handle errors with try/catch

### Imports

- Use ES modules (`import`/`export`)
- Group imports: external deps → internal modules → types
- Use explicit file extensions in imports where needed

## Testing

- Test files colocated with source or in `test/` directory
- Use Vitest for testing
- Run tests: `npm test`
- Watch mode: `npm run test:watch`

## Future AI Integration Plans

The project name includes "ai" for planned Claude AI features:

### Planned Features

1. **Natural Language Recipe Search**
   - Parse natural language queries (e.g., "quick pasta dinner under 30 minutes")
   - Use Claude to interpret and map to database filters

2. **Recipe Suggestions**
   - Analyze user's recipe collection
   - Suggest new recipes based on preferences and available ingredients

3. **Meal Planning**
   - AI-assisted weekly meal planning
   - Consider dietary restrictions, variety, and user preferences

4. **Ingredient Substitutions**
   - Suggest substitutions based on dietary needs or availability
   - Maintain flavor profiles and cooking techniques

5. **Nutritional Analysis**
   - Parse ingredients and provide nutritional information
   - Track dietary goals

### Integration Points

When implementing AI features:

- Add AI service in `src/services/ai.ts`
- Keep AI logic separate from core recipe management
- Use environment variable for Claude API key: `ANTHROPIC_API_KEY`
- Consider caching AI responses in database for performance
- Add dedicated commands for AI features (e.g., `paprik suggest`, `paprik plan`)

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
./dist/index.js [command]
```

### Adding a New Command

1. Create file in `src/commands/` (e.g., `my-command.ts`)
2. Extend `Command` from `@oclif/core`
3. Define description, flags, and args
4. Implement `run()` method
5. Build and test: `npm run build && ./dist/index.js my-command`

### Adding a Database Table

1. Create migration in `src/db/migrations/` (increment number)
2. Define schema in `src/db/schema.ts`
3. Create repository in `src/db/repositories/`
4. Update `src/db/index.ts` to run new migration

### Adding a TUI Component

1. Create `.tsx` file in `src/components/`
2. Import Ink components (`Box`, `Text`, etc.)
3. Use `useInput` hook for keyboard handling
4. Export functional component
5. Render from command using `render()` from `ink`

## Common Tasks

### Sync from Paprika API

```typescript
// src/services/sync.ts
import { PaprikaClient } from '../api/client';
import { RecipeRepository } from '../db/repositories/recipes';

export async function syncRecipes() {
  const client = new PaprikaClient();
  const recipes = await client.getRecipes();
  const repo = new RecipeRepository(db);

  for (const recipe of recipes) {
    repo.upsert(recipe);
  }
}
```

### Render a TUI

```typescript
// In a command's run() method
import { render } from 'ink';
import { RecipeList } from '../components/RecipeList';

const { unmount, waitUntilExit } = render(<RecipeList recipes={recipes} />);
await waitUntilExit();
```

### Access Database

```typescript
import { getDatabase } from '../db';
import { RecipeRepository } from '../db/repositories/recipes';

const db = getDatabase();
const recipeRepo = new RecipeRepository(db);
const recipes = recipeRepo.findAll();
```

## Resources

- [Paprika API Docs (Kappari)](https://github.com/johnwbyrd/kappari) - Unofficial Paprika API documentation
- [Ink Documentation](https://github.com/vadimdemedes/ink) - Building terminal UIs
- [oclif Documentation](https://oclif.io) - CLI framework
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)

## Troubleshooting

### Database Issues

- Database is created in `.data/` on first sync
- Delete `.data/` directory to reset database
- Check `DATABASE_PATH` env var if using custom location

### API Authentication

- Verify `PAPRIKA_EMAIL` and `PAPRIKA_PASSWORD` in `.env`
- Test credentials at https://www.paprikaapp.com/account/login

### TUI Not Rendering

- Ensure terminal supports ANSI escape codes
- Check that stdout is a TTY
- Use `--no-color` flag if available for debugging

## Contributing Guidelines

When making changes:

1. **Maintain Architecture**: Follow existing patterns (repository, service layer, etc.)
2. **Type Safety**: Add types for all functions and data structures
3. **Error Handling**: Handle errors gracefully, provide helpful messages
4. **Testing**: Add tests for new functionality
5. **Documentation**: Update README.md and this file as needed
6. **Formatting**: Run `npm run format` before committing
7. **Linting**: Fix all `npm run lint` errors
8. **Type Checking**: Run `npm run typecheck` after TypeScript changes to catch type errors
9. **LSP Diagnostics**: For AI assistants, run LSP diagnostics after edits to verify correctness

## Verification Workflow

After making TypeScript changes, **always verify** with these steps:

```bash
# 1. Type checking (catches type errors that tsc might emit as JS)
npm run typecheck

# 2. Linting (catches style issues and code quality problems)
npm run lint

# 3. Build (generates JS output)
npm run build

# 4. Tests (if applicable)
npm test
```

**For AI Assistants**: After editing TypeScript files, run LSP diagnostics to catch type errors immediately:
- Use `lsp diagnostics` action to verify changes before claiming success
- `npm run build` may succeed even with type errors; use `npm run typecheck` or LSP for strict validation
## Contact

**Author**: Oliver Hickman
**License**: ISC
