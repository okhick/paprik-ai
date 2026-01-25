# paprik-ai

A modern terminal UI (TUI) application for managing [Paprika](https://www.paprikaapp.com/) recipes with local SQLite caching and future Claude AI integration.

## Features

- 📚 Browse and search your Paprika recipes in the terminal
- 🔄 Sync recipes from Paprika API to local SQLite database
- ⭐ Filter by favorites and ratings
- 🎨 Clean, intuitive terminal UI built with Ink
- 💾 Local caching for offline access
- 🚀 Fast search and navigation

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

### Browse Recipes

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
