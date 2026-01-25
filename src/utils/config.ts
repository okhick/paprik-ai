import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Application configuration
 */
export interface AppConfig {
  paprikaEmail?: string;
  paprikaPassword?: string;
  databasePath: string;
  apiBaseUrl: string;
}

/**
 * Load configuration from environment variables and .env file
 */
export function loadConfig(): AppConfig {
  // Try to load .env file
  loadEnvFile();

  return {
    paprikaEmail: process.env.PAPRIKA_EMAIL,
    paprikaPassword: process.env.PAPRIKA_PASSWORD,
    databasePath: process.env.DATABASE_PATH || join(process.cwd(), '.data', 'recipes.db'),
    apiBaseUrl: process.env.PAPRIKA_API_URL || 'https://www.paprikaapp.com/api/v1',
  };
}

/**
 * Load environment variables from .env file
 */
function loadEnvFile(): void {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  try {
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      // Skip comments and empty lines
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // Only set if not already in environment
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load .env file:', error);
  }
}

/**
 * Validate that required config is present
 */
export function validateConfig(config: AppConfig): void {
  if (!config.paprikaEmail || !config.paprikaPassword) {
    throw new Error(
      'Missing required configuration. Please set PAPRIKA_EMAIL and PAPRIKA_PASSWORD environment variables or create a .env file.'
    );
  }
}

/**
 * Get config with validation
 */
export function getConfig(): AppConfig {
  const config = loadConfig();
  return config;
}
