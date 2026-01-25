#!/usr/bin/env node

import { run, flush } from '@oclif/core';

/**
 * Main entry point for paprik-ai CLI
 */
async function main() {
  await run(process.argv.slice(2), import.meta.url);
  await flush();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
