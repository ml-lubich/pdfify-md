/**
 * CliService - Handles CLI-specific logic and orchestration.
 * Separates CLI concerns from core conversion logic.
 */

import path from 'node:path';
import { basename, join } from 'node:path';
import chalk from 'chalk';
import { watch } from 'chokidar';
import getPort from 'get-port';
import getStdin from 'get-stdin';
import Listr from 'listr';
import { readFileSync } from 'node:fs';
import { type PackageJson } from '../../index.js';
import { type Config, defaultConfig } from '../config.js';
import { getMarkdownFiles } from '../utils/file.js';
import { convertMdToPdf } from '../core/converter.js';
import { ConfigService } from '../services/ConfigService.js';
import { ServerService } from '../services/ServerService.js';
import { OutputGeneratorService } from '../services/OutputGeneratorService.js';
import { validateNodeVersion } from '../validators/node-version.js';
import { help } from './help.js';
// Chokidar v4 doesn't export WatchOptions - types handled inline

export type CliArgs = typeof import('../../cli').cliFlags;

/**
 * Service for handling CLI operations.
 * Manages argument parsing, configuration, file processing, and watch mode.
 */
export class CliService {
	private readonly configService: ConfigService;
	private readonly serverService: ServerService;
	private readonly outputGenerator: OutputGeneratorService;

	constructor() {
		this.configService = new ConfigService();
		this.serverService = new ServerService();
		this.outputGenerator = new OutputGeneratorService();
	}

	/**
	 * Main CLI entry point.
	 * Processes arguments and executes conversion.
	 *
	 * @param args - Parsed CLI arguments
	 * @param config - Base configuration
	 */
	public async run(arguments_: CliArgs, config: Config = defaultConfig): Promise<void> {
		process.title = 'pdfify-md';

		// Validate Node version
		if (!validateNodeVersion()) {
			throw new Error('Please use a Node.js version that satisfies the version specified in the engines field.');
		}

		// Handle version flag
		if (arguments_['--version']) {
			return this.showVersion();
		}

		// Handle help flag
		if (arguments_['--help']) {
			return help();
		}

		// Get input files or stdin
		const inputArgs = arguments_._ || [];
		const files = (await Promise.all(inputArgs.map((arg) => getMarkdownFiles(arg)))).flat();
		const stdin = await getStdin();

		if (files.length === 0 && !stdin) {
			return help();
		}

		// Load and merge configuration
		const mergedConfig = await this.loadConfiguration(arguments_, config);

		// Start server
		await this.serverService.start(mergedConfig);

		// Setup cleanup
		const cleanup = async () => {
			try {
				await this.outputGenerator.closeBrowser();
			} catch (error) {
				// Ignore browser cleanup errors
			}
			try {
				await this.serverService.stop();
			} catch (error) {
				// Ignore server cleanup errors
			}
		};

		try {
			// Process stdin or files
			if (stdin) {
				await this.processStdin(stdin, mergedConfig, arguments_);
			} else {
				await this.processFiles(files, mergedConfig, arguments_, cleanup);
				// Cleanup is handled in processFiles finally block for files
				return;
			}
		} catch (error) {
			await cleanup();
			throw error;
		} finally {
			// Always cleanup after stdin processing (not handled in processStdin)
			if (stdin) {
				await cleanup();
			}
		}
	}

	/**
	 * Show version information.
	 */
	private showVersion(): void {
		// Resolve package.json path: from dist/lib/cli/CliService.js -> package.json (root)
		const packagePath = join(__dirname, '..', '..', '..', 'package.json');
		const package_ = JSON.parse(readFileSync(packagePath, 'utf-8')) as PackageJson;
		console.log(package_.version);
	}

	/**
	 * Load and merge configuration from various sources.
	 *
	 * @param args - CLI arguments
	 * @param baseConfig - Base configuration
	 * @returns Merged configuration
	 */
	private async loadConfiguration(arguments_: CliArgs, baseConfig: Config): Promise<Config> {
		let config = { ...baseConfig };

		// Load config file if specified
		if (arguments_['--config-file']) {
			config = this.loadConfigFile(arguments_['--config-file'], config);
		}

		// Merge CLI arguments
		config = this.configService.mergeCliArgs(
			config,
			arguments_ as unknown as Record<string, string | string[] | boolean>,
		);

		// Set basedir from CLI
		if (arguments_['--basedir']) {
			config.basedir = arguments_['--basedir'];
		}

		// Set port
		const portArgument = arguments_['--port'];
		config.port = (typeof portArgument === 'number' ? portArgument : undefined) ?? (await getPort());

		return config;
	}

	/**
	 * Load configuration from file.
	 *
	 * @param configFilePath - Path to config file
	 * @param baseConfig - Base configuration to merge with
	 * @returns Merged configuration
	 */
	private loadConfigFile(configFilePath: string, baseConfig: Config): Config {
		try {
			const configFile: Partial<Config> = require(path.resolve(configFilePath));
			return this.configService.mergeConfigs(baseConfig, configFile);
		} catch (error) {
			console.warn(chalk.red(`Warning: couldn't read config file: ${path.resolve(configFilePath)}`));
			console.warn(error instanceof SyntaxError ? error.message : error);
			return baseConfig;
		}
	}

	/**
	 * Process stdin input.
	 *
	 * @param stdin - Standard input content
	 * @param config - Configuration
	 * @param args - CLI arguments
	 */
	private async processStdin(stdin: string, config: Config, arguments_: CliArgs): Promise<void> {
		await convertMdToPdf({ content: stdin }, config, { args: arguments_ });
	}

	/**
	 * Process file inputs with optional watch mode.
	 *
	 * @param files - Array of file paths
	 * @param config - Configuration
	 * @param args - CLI arguments
	 * @param cleanup - Cleanup function
	 */
	private async processFiles(
		files: string[],
		config: Config,
		arguments_: CliArgs,
		cleanup: () => Promise<void>,
	): Promise<void> {
		const getListrTask = (file: string) => {
			// Windows-compatible path display - use basename for long paths to avoid truncation
			const displayPath = file.length > 60 ? basename(file) : file;
			return {
				title: `generating ${arguments_['--as-html'] ? 'HTML' : 'PDF'} from ${displayPath}`,
				task: async () => {
					try {
						await convertMdToPdf({ path: file }, config, { args: arguments_ });
						// File path is printed by ConverterService after successful write
						// The full absolute path will be printed after Listr completes
					} catch (error) {
						// Format error message for user
						const errorMessage = this.formatErrorMessage(error, file);
						throw new Error(errorMessage);
					}
				},
			};
		};

		try {
			// Set environment variable to indicate CLI context for logging suppression
			process.env.LISTR_DISABLE_OUTPUT = 'false';
			// Process all files concurrently
			await new Listr(files.map(getListrTask), {
				concurrent: true,
				exitOnError: false,
				renderer: process.stdout.isTTY ? 'default' : 'verbose'
			}).run();

			// Handle watch mode
			if (arguments_['--watch']) {
				await this.startWatchMode(files, config, arguments_, getListrTask);
			}
		} catch (error) {
			// Re-throw with formatted message
			const errorMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to process files: ${errorMessage}`);
		} finally {
			// Always cleanup (except in watch mode)
			if (!arguments_['--watch']) {
				await cleanup();
			}
		}
	}

	/**
	 * Start watch mode for file changes.
	 *
	 * @param files - Files to watch
	 * @param config - Configuration
	 * @param args - CLI arguments
	 * @param getListrTask - Function to create Listr tasks
	 */
	private async startWatchMode(
		files: string[],
		_config: Config,
		arguments_: CliArgs,
		getListrTask: (file: string) => { title: string; task: () => Promise<void> },
	): Promise<void> {
		console.log(chalk.blue('\n✓ Watching for changes...\n'));

		const watchOptions = arguments_['--watch-options'] ? JSON.parse(arguments_['--watch-options']) : {};

		const watcher = watch(files, watchOptions);
		(watcher as any).on('change', async (file: string) => {
			try {
				await new Listr([getListrTask(file)], { exitOnError: false }).run();
			} catch (error) {
				const errorMessage = this.formatErrorMessage(error, file);
				console.error(chalk.red(`\n✖ Error: ${errorMessage}\n`));
			}
		});
	}

	/**
	 * Format error message for user-friendly display.
	 *
	 * @param error - Error object
	 * @param file - File path (optional)
	 * @returns Formatted error message
	 */
	private formatErrorMessage(error: unknown, file?: string): string {
		if (error instanceof Error) {
			// Check if it's a domain error with a user-friendly message
			if ('code' in error && 'message' in error) {
				const { message } = error;
				// Remove technical details and make it user-friendly
				if (message.includes('File not found')) {
					return message;
				}

				if (message.includes('Permission denied')) {
					return message;
				}

				if (message.includes('Failed to read markdown file')) {
					return message;
				}

				if (message.includes('Failed to create')) {
					return message;
				}

				// For other errors, provide context
				return file ? `Error processing "${file}": ${message}` : message;
			}

			return file ? `Error processing "${file}": ${error.message}` : error.message;
		}

		return file ? `Unknown error processing "${file}"` : 'Unknown error occurred';
	}

	/**
	 * Cleanup resources.
	 */
	public async cleanup(): Promise<void> {
		await this.outputGenerator.closeBrowser();
		await this.serverService.stop();
	}
}
