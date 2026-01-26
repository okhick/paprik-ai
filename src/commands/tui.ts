import { Command } from '@oclif/core';
import { render } from 'ink';
import React from 'react';

export default class Tui extends Command {
  static description = 'Launch the full-screen TUI for browsing recipes';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  async run(): Promise<void> {
    // Placeholder - will be replaced with actual TuiApp component
    const { default: TuiApp } = await import('../components/tui/TuiApp.js');

    const { waitUntilExit } = render(React.createElement(TuiApp));

    await waitUntilExit();
  }
}
