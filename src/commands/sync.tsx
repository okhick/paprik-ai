import { Command } from '@oclif/core';
import { render } from 'ink';
import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { PaprikaClient } from '../lib/api/client.js';
import { createRecipeApi } from '../lib/api/recipes.js';
import { RecipeRepository } from '../lib/repositories/recipes.js';
import { CategoryRepository } from '../lib/repositories/categories.js';
import { SyncService, SyncStatus } from '../lib/services/sync.js';
import { getDatabase } from '../lib/db/index.js';
import { getConfig, validateConfig } from '../lib/config.js';
import { ErrorBox, LoadingBox, Layout } from '../components/ui.js';

/**
 * Sync recipes from Paprika API command
 */
export default class Sync extends Command {
  static description = 'Sync recipes from Paprika API';

  async run(): Promise<void> {
    const config = getConfig();

    try {
      validateConfig(config);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }

    // Initialize services
    const db = getDatabase(config.databasePath);
    const repository = new RecipeRepository(db);
    const categoryRepository = new CategoryRepository(db);
    const client = new PaprikaClient({
      email: config.paprikaEmail!,
      password: config.paprikaPassword!,
      baseUrl: config.apiBaseUrl,
    });
    const api = createRecipeApi(client);
    const syncService = new SyncService(api, repository, categoryRepository);

    // Render Ink component
    render(<SyncApp syncService={syncService} />);
  }
}

/**
 * Sync app component
 */
interface SyncAppProps {
  syncService: SyncService;
}

const SyncApp: React.FC<SyncAppProps> = ({ syncService }) => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const performSync = async () => {
      try {
        // First sync categories
        let categoryCounts = { total: 0, synced: 0 };
        await syncService.syncCategories((progress) => {
          setStatus(progress);
          categoryCounts = { ...progress.categories };
        });

        // Then sync recipes, preserving category counts
        const finalStatus = await syncService.syncRecipes((progress) => {
          setStatus({
            ...progress,
            categories: categoryCounts,
          });
        });

        setStatus({
          ...finalStatus,
          categories: categoryCounts,
        });
        setComplete(true);
        setTimeout(() => process.exit(0), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    performSync();
  }, [syncService]);

  if (error) {
    return <ErrorBox error={error} />;
  }

  if (!status) {
    return <LoadingBox message="Starting sync..." />;
  }

  const progress = status.total > 0 ? Math.round((status.synced / status.total) * 100) : 0;
  const isRunning = !complete;

  return (
    <Layout title="Syncing Recipes">
      <Box flexDirection="column" gap={1}>
        {status.categories.total > 0 && (
          <Box>
            <Text>
              Categories: {status.categories.synced} / {status.categories.total}
            </Text>
          </Box>
        )}

        <Box>
          <Text>
            Recipes: {status.synced} / {status.total} ({progress}%)
          </Text>
        </Box>

        {isRunning && (
          <Box>
            <Text color="yellow">Syncing...</Text>
          </Box>
        )}

        {complete && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="green" bold>
              ✓ Sync complete!
            </Text>
            <Text>Categories synced: {status.categories.synced}</Text>
            <Text>Recipes synced: {status.synced}</Text>
            {status.failed > 0 && <Text color="red">Failed: {status.failed}</Text>}
          </Box>
        )}

        {status.errors.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="red" bold>
              Errors:
            </Text>
            {status.errors.slice(0, 5).map((err, index) => (
              <Text key={index} dimColor>
                {err.uid}: {err.error}
              </Text>
            ))}
            {status.errors.length > 5 && (
              <Text dimColor>... and {status.errors.length - 5} more</Text>
            )}
          </Box>
        )}
      </Box>
    </Layout>
  );
};
