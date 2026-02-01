import { Command } from '@oclif/core';
import { render } from 'ink';
import React from 'react';
import { ensureDatabase } from '../db/ensure-db.js';

export default class Tui extends Command {
  static description = 'Launch the full-screen TUI for browsing recipes';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    try {
      // Check if database is initialized
      if (!ensureDatabase()) {
        this.log('Database not found or empty. Please run the "sync" command first:');
        this.log('  paprik-ai sync');
        return;
      }

      // Load the TUI app component
      const { default: TuiApp } = await import('../components/tui/TuiApp.js');
      const { waitUntilExit } = render(React.createElement(TuiApp));

      await waitUntilExit();
    } catch (error) {
      // Handle error when raw mode is not supported
      if (error instanceof Error && error.message.includes('Raw mode is not supported')) {
        this.log('Error: Raw mode is not supported in this environment.');
        this.log('The TUI requires an interactive terminal to run.');
        this.log('Try running in a regular terminal application.');
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  }
}
