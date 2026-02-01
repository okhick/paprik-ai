# paprik-ai

A modern terminal UI (TUI) application for managing [Paprika](https://www.paprikaapp.com/) recipes with local SQLite caching and future Claude AI integration. The new pane-based TUI interface provides a seamless experience for browsing, searching, and viewing recipes.

## Features

- 📚 Browse and search your Paprika recipes in the terminal
- 🔄 Sync recipes from Paprika API to local SQLite database
- ⭐ Filter by favorites and ratings
- 🎨 Clean, intuitive terminal UI built with Ink
- 💾 Local caching for offline access
- 🚀 Fast search and navigation
- 🖥️ Full-screen interactive TUI with pane-based layout
- ⌨️ Comprehensive keyboard navigation and shortcuts

## Installation

### Prerequisites

- Node.js 18 or higher
- A Paprika account with email/password credentials

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd paprik-ai
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Create a `.env` file with your Paprika credentials:

```bash
cp .env.example .env
# Edit .env and add your Paprika email and password
```

5. Sync your recipes:

```bash
./dist/index.js sync
```

## Usage

### New TUI Interface (Recommended)

Launch the full-screen interactive TUI (the default when running without arguments):

```bash
./dist/index.js
```

Or explicitly run the TUI command:

```bash
./dist/index.js tui
```

The TUI provides a two-pane layout:

- Left pane: List of recipes with search and filter options
- Right pane: Detailed view of the selected recipe

#### TUI Keyboard Shortcuts

**Global Navigation:**

- `Tab` / `Shift+Tab`: Switch between panes
- `←` / `→` (Left/Right arrows): Focus left/right pane
- `q`: Quit application
- `?`: Toggle help overlay
- `Ctrl+C`: Exit

**Recipe List (Left Pane):**

- `↑` / `↓` (Up/Down arrows): Navigate through recipes
- `Page Up` / `Page Down`: Page through recipe list
- `/`: Activate search mode (type to filter recipes)
- `Escape` (when searching): Clear search or exit search mode
- `f`: Toggle favorites filter

**Recipe Detail (Right Pane):**

- `↑` / `↓` (Up/Down arrows): Scroll recipe content
- `Page Up` / `Page Down`: Page through recipe content

### Browse Recipes

> ⚠️ The following commands are being phased out in favor of the new TUI interface.

Browse all recipes:

```bash
./dist/index.js browse
```

Browse only favorites:

```bash
./dist/index.js browse --favorites
```

Browse highly-rated recipes:

```bash
./dist/index.js browse --min-rating 4
```

### Search Recipes

Search for recipes by name:

```bash
./dist/index.js search "chocolate"
```

### Add a Recipe

Add a recipe interactively:

```bash
./dist/index.js add
```

Add a recipe with flags:

```bash
./dist/index.js add --name "My Recipe" --description "A delicious recipe"
```

### Edit a Recipe

Edit a recipe interactively:

```bash
./dist/index.js edit <recipe-uid>
```

Update specific fields:

```bash
./dist/index.js edit <recipe-uid> --name "Updated Name" --rating 5
```

### Sync from Paprika

Sync all recipes from your Paprika account:

```bash
./dist/index.js sync
```

## Keyboard Navigation

### TUI Interface

See the "TUI Keyboard Shortcuts" section above.

### Recipe List

- `↑/↓` - Navigate through recipes
- `Enter` - View recipe details
- `q` - Quit

### Recipe Detail

- `q` - Back to list

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Watch mode for development
- `npm run typecheck` - Type checking without emitting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
paprik-ai/
├── src/
│   ├── commands/           # CLI commands (browse, search, add, edit, sync)
│   ├── components/         # Ink TUI components
│   ├── api/                # Paprika API client
│   ├── db/                 # SQLite database layer
│   │   ├── repositories/   # Data access objects
│   │   ├── migrations/     # Database migrations
│   │   └── schema.ts       # Table schemas
│   ├── services/           # Business logic
│   ├── utils/              # Utilities (config, etc.)
│   └── types/              # TypeScript type definitions
├── test/                   # Test files
├── .data/                  # SQLite database (created after sync)
└── dist/                   # Compiled output
```

## Database

The application uses SQLite for local storage:

- **Location**: `.data/recipes.db` (configurable via `DATABASE_PATH` env var)
- **Schema**: Mirrors Paprika's data structure
- **Tables**: recipes, categories, meals, grocery_lists, etc.

## API

The app uses the Paprika API v1:

- **Endpoint**: `https://www.paprikaapp.com/api/v1`
- **Auth**: HTTP Basic Authentication
- **Format**: JSON with gzip compression

## Future Enhancements

- 🤖 Claude AI integration for recipe suggestions
- 🍽️ Meal planning with AI
- 🔍 Natural language recipe search
- 📊 Nutritional analysis
- 📸 Image support in TUI

## Configuration

Configuration is loaded from environment variables or a `.env` file:

| Variable           | Description                   | Default                             |
| ------------------ | ----------------------------- | ----------------------------------- |
| `PAPRIKA_EMAIL`    | Your Paprika account email    | (required)                          |
| `PAPRIKA_PASSWORD` | Your Paprika account password | (required)                          |
| `DATABASE_PATH`    | Custom database location      | `.data/recipes.db`                  |
| `PAPRIKA_API_URL`  | Custom API URL                | `https://www.paprikaapp.com/api/v1` |

## Troubleshooting

## Migrating to the New TUI Interface

### What's New

The new pane-based TUI interface offers several advantages over the command-based approach:

1. **Seamless Experience**: Full-screen interface with multiple panes visible simultaneously
2. **Persistent State**: No need to re-run commands for different operations
3. **Keyboard-Driven**: Comprehensive shortcuts for navigation and actions
4. **Real-Time Search**: Filter as you type with debounced search
5. **Performance Optimizations**: Virtual scrolling for large recipe collections
6. **Rich Formatting**: Better recipe presentation with visual sections and icons

### Migration Steps

1. **Update to the latest version**:

   ```bash
   git pull
   npm install
   npm run build
   ```

2. **Launch the new TUI**:

   ```bash
   ./dist/index.js
   ```

3. **Learn the keyboard shortcuts**:
   Press `?` in the TUI to view all available shortcuts.

### Command Mapping

| Old Command          | New TUI Equivalent                |
| -------------------- | --------------------------------- |
| `browse`             | Just launch the TUI               |
| `browse --favorites` | Launch TUI, then press `f`        |
| `search "query"`     | Launch TUI, press `/`, type query |
| `edit`               | Coming in a future update         |

### Rollback If Needed

If you encounter issues with the new TUI, you can still use the old commands:

```bash
./dist/index.js browse
./dist/index.js search "query"
```

These commands will continue to work but will display a deprecation warning.

## Troubleshooting the TUI

### Terminal Size Issues

The TUI requires a terminal size of at least 80x24 characters. If your terminal is too small, you'll see a warning message. Resize your terminal and try again.

### Performance Issues

If you experience lag with large recipe collections:

1. Ensure your terminal emulator is up to date
2. Try reducing the number of recipes (if you have 1000+)
3. If using SSH, ensure your connection is stable

### Emergency Rollback

If the TUI has critical issues that prevent usage:

1. **Downgrade to previous version**:

   ```bash
   # Create a new branch from the last stable version
   git checkout -b pre-tui <commit-hash-before-tui>
   npm install
   npm run build
   ```

2. **Continue using command-based interface**:
   The command-based interface (browse, search) will remain available for several versions.

3. **Report issues**:
   Please open an issue on the repository with details about the problem.

### "Missing required configuration" error

Make sure you have created a `.env` file with your Paprika credentials:

```bash
PAPRIKA_EMAIL=your-email@example.com
PAPRIKA_PASSWORD=your-password
```

### Empty recipe list

Run the sync command to fetch recipes from Paprika:

```bash
./dist/index.js sync
```

### Database errors

Delete the database and re-sync:

```bash
rm -rf .data/
./dist/index.js sync
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

ISC

## References

- [Paprika Recipe Manager](https://www.paprikaapp.com/)
- [Kappari - Paprika API Documentation](https://github.com/johnwbyrd/kappari)
- [Ink - React for CLIs](https://github.com/vadimdemedes/ink)
- [oclif - Node.js CLI Framework](https://oclif.io)
