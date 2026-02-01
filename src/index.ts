#!/usr/bin/env node

import { run, flush, Command, Flags } from '@oclif/core';

/**
 * Default export class that runs when no command is specified
 * This will launch the TUI by default
 */
export default class PaprikAi extends Command {
  static description = 'Interactive Paprika recipe manager';

  static examples = ['<%= config.bin %>'];

  static flags = {
    version: Flags.version({ char: 'v' }),
    help: Flags.help({ char: 'h' }),
    noTui: Flags.boolean({
      char: 'n',
      description: 'Do not launch TUI, show help instead',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PaprikAi);

    // Show help instead of TUI if --no-tui flag is used
    if (flags.noTui) {
      await this.config.runCommand('help');
      return;
    }

    try {
      this.log('Launching paprik-ai TUI...');

      const { default: TuiCommand } = await import('./commands/tui.js');
      const instance = new TuiCommand(this.argv, this.config);
      await instance.run();
    } catch (error) {
      // If TUI fails (e.g., not an interactive terminal), fall back to help
      this.log('Failed to launch TUI:');
      this.log(error instanceof Error ? error.message : String(error));
      await this.config.runCommand('help');
    }
  }
}

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
