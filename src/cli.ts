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

	// Aliases
	'-h': '--help',
	'-v': '--version',
	'-w': '--watch',
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
	}
	// Don't force exit - let the process exit naturally after cleanup
	// Watch mode needs to keep running, and normal mode will exit after cleanup
}

// Execute main function
main();
