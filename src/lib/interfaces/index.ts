/**
 * Core interfaces for the mdpdf system.
 * These define contracts that all implementations must follow.
 */

import { type Browser } from 'puppeteer';
import { type Config } from '../config.js';

/**
 * Input source for markdown conversion.
 */
export type MarkdownInput = {
	readonly path?: string;
	readonly content?: string;
};

/**
 * Output result from conversion.
 */
export type ConversionOutput = PdfConversionOutput | HtmlConversionOutput;

export type PdfConversionOutput = {
	readonly filename: string | undefined;
	readonly content: Buffer;
};

export type HtmlConversionOutput = {
	readonly filename: string | undefined;
	readonly content: string;
};

/**
 * Mermaid processing result.
 */
export type MermaidProcessResult = {
	readonly processedMarkdown: string;
	readonly imageFiles: string[];
	readonly warnings: string[];
};

/**
 * Service interface for markdown parsing.
 */
export type IMarkdownParser = {
	parse(markdown: string): string;
};

/**
 * Service interface for Mermaid diagram processing.
 */
export type IMermaidProcessor = {
	processCharts(
		markdown: string,
		browser: Browser,
		baseDir: string,
		markdownDir?: string,
		serverPort?: number,
		config?: Config,
	): Promise<MermaidProcessResult>;
	cleanup(imageFiles: string[]): Promise<void>;
};

/**
 * Service interface for PDF/HTML generation.
 */
export type IOutputGenerator = {
	generate(
		html: string,
		relativePath: string,
		config: Config,
		browser?: Browser,
	): Promise<ConversionOutput | undefined>;
	closeBrowser(): Promise<void>;
};

/**
 * Service interface for file operations.
 */
export type IFileService = {
	readFile(path: string, encoding?: string): Promise<string>;
	writeFile(path: string, content: Buffer | string): Promise<void>;
	ensureDirectory(path: string): Promise<void>;
};

/**
 * Service interface for HTTP server management.
 */
export type IServerService = {
	start(config: Config): Promise<void>;
	stop(): Promise<void>;
	getPort(): number | undefined;
};

/**
 * Service interface for configuration management.
 */
export type IConfigService = {
	getDefaultConfig(): Config;
	mergeConfigs(...configs: Array<Partial<Config>>): Config;
	validateConfig(config: Config): void;
	mergeCliArgs(config: Config, arguments_: Record<string, string | string[] | boolean>): Config;
};

/**
 * Logger interface for dependency inversion.
 * Services should depend on this interface, not on console directly.
 *
 * This follows Clean Architecture principles by inverting the dependency
 * on concrete implementations (console) in favor of abstractions.
 *
 * Re-exported from domain layer.
 */
export type { ILogger } from '../domain/Logger.js';
export { ConsoleLogger, SilentLogger, defaultLogger, LogLevel } from '../domain/Logger.js';
