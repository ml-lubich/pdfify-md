#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * This is the main entry point for the markpdf command-line tool.
 * It parses arguments and delegates to CliService for execution.
 */

import arg from 'arg';
import chalk from 'chalk';
import { defaultConfig } from './lib/config.js';
import { CliService } from './lib/cli/CliService.js';

/**
 * Parse CLI arguments and flags.
 * Supports all markpdf command-line options.
 */
export const cliFlags = arg({
	'--help': Boolean,
	'--version': Boolean,
	'--basedir': String,
	'--watch': Boolean,
	'--watch-options': String,
	'--stylesheet': [String],
	'--css': String,
	'--document-title': String,
	'--body-class': [String],
	'--page-media-type': String,
	'--highlight-style': String,
	'--marked-options': String,
	'--html-pdf-options': String,
	'--pdf-options': String,
	'--launch-options': String,
	'--gray-matter-options': String,
	'--port': Number,
	'--md-file-encoding': String,
	'--stylesheet-encoding': String,
	'--as-html': Boolean,
	'--config-file': String,
	'--devtools': Boolean,
	'--mermaid-horizontal-width': Number,
	'--mermaid-vertical-width': Number,
	'--mermaid-max-height': Number,
	'--mermaid-resolution': Number,
	'--mermaid-timeout': Number,

	// Aliases
	'-h': '--help',
	'-v': '--version',
	'-w': '--watch',
	'-r': '--mermaid-resolution',
	'-t': '--mermaid-timeout',
});

/**
 * Main execution function.
 * Creates CliService instance and runs with parsed arguments.
 */
async function main() {
	const cliService = new CliService();

	try {
		await cliService.run(cliFlags, defaultConfig);
	} catch (error) {
		// Format error message for user
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`\n${chalk.red('✖ Error:')} ${errorMessage}\n`);
		process.exitCode = 1;
	} finally {
		// Ensure cleanup happens
		try {
			await cliService.cleanup();
		} catch {
			// Ignore cleanup errors
		}
		
		// Force exit if not in watch mode to prevent hanging
		if (!cliFlags['--watch']) {
			// Give a small delay for any final cleanup, then exit
			setTimeout(() => {
				process.exit(process.exitCode || 0);
			}, 100);
		}
	}
}

// Execute main function
main();
