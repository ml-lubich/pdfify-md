/**
 * ConverterService - Main service that orchestrates markdown to PDF/HTML conversion.
 * Uses dependency injection for all sub-services.
 */

import { dirname, relative, resolve } from 'node:path';
import puppeteer, { type Browser } from 'puppeteer';
import grayMatter from 'gray-matter';
import {
	type ConversionOutput,
	type MarkdownInput,
	type MermaidProcessResult,
	type PdfConversionOutput,
	type HtmlConversionOutput,
	type IMermaidProcessor,
	type IOutputGenerator,
	type IFileService,
	type IConfigService,
} from '../interfaces/index.js';
import { type Config } from '../config.js';
import { getHtml } from '../get-html.js';
import { getOutputFilePath } from '../get-output-file-path.js';
import { defaultLogger, type ILogger } from '../domain/Logger.js';
import { ValidationError, MermaidProcessError, OutputGenerationError } from '../domain/errors.js';
import { MERMAID_CONSTANTS } from '../config/constants.js';
import { MermaidProcessorService } from './MermaidProcessorService.js';
import { OutputGeneratorService } from './OutputGeneratorService.js';
import { FileService } from './FileService.js';
import { ConfigService } from './ConfigService.js';

/**
 * Factory function to create a ConverterService with default dependencies.
 *
 * This follows Clean Architecture principles by providing a convenient way
 * to create a fully-configured service while maintaining explicit dependencies.
 *
 * @param logger - Optional logger (defaults to console logger)
 * @returns Configured ConverterService instance
 */
export function createConverterService(logger: ILogger = defaultLogger): ConverterService {
	return new ConverterService(
		new MermaidProcessorService(),
		new OutputGeneratorService(),
		new FileService(),
		new ConfigService(),
		logger,
	);
}

export class ConverterService {
	private readonly mermaidProcessor: IMermaidProcessor;
	private readonly outputGenerator: IOutputGenerator;
	private readonly fileService: IFileService;
	private readonly configService: IConfigService;
	private readonly logger: ILogger;

	constructor(
		mermaidProcessor: IMermaidProcessor,
		outputGenerator: IOutputGenerator,
		fileService: IFileService,
		configService: IConfigService,
		logger: ILogger = defaultLogger,
	) {
		this.mermaidProcessor = mermaidProcessor;
		this.outputGenerator = outputGenerator;
		this.fileService = fileService;
		this.configService = configService;
		this.logger = logger;
	}

	/**
	 * Convert markdown input to PDF or HTML.
	 *
	 * This method orchestrates the conversion workflow:
	 * 1. Validate input
	 * 2. Read markdown content
	 * 3. Parse front-matter
	 * 4. Merge configuration
	 * 5. Process Mermaid diagrams
	 * 6. Generate HTML
	 * 7. Generate output (PDF/HTML)
	 * 8. Write output
	 *
	 * @param input - Markdown input (file path or content)
	 * @param config - Configuration object
	 * @param browser - Optional browser instance to reuse
	 * @returns Promise resolving to conversion output
	 * @throws ValidationError if input is invalid
	 * @throws OutputGenerationError if output generation fails
	 */
	public async convert(input: MarkdownInput, config: Config, browser?: Browser): Promise<ConversionOutput> {
		// Validate service dependencies
		if (!this.fileService) {
			throw new ValidationError(
				'File service is not initialized. Please ensure ConverterService is properly constructed.',
			);
		}

		if (!this.configService) {
			throw new ValidationError(
				'Config service is not initialized. Please ensure ConverterService is properly constructed.',
			);
		}

		if (!this.outputGenerator) {
			throw new ValidationError(
				'Output generator is not initialized. Please ensure ConverterService is properly constructed.',
			);
		}

		// Validate input
		this.validateInput(input);

		// Read markdown content with graceful error handling
		let mdContent: string;
		try {
			mdContent = await this.readMarkdownContent(input, config);
		} catch (error) {
			// Error is already formatted in readMarkdownContent, just re-throw
			throw error;
		}

		// Parse front-matter
		const { content: markdown, data: frontMatter } = this.parseFrontMatter(mdContent, config);

		// Merge front-matter into config
		const mergedConfig = this.configService.mergeConfigs(config, frontMatter as Partial<Config>);

		// Set output destination
		mergedConfig.dest ||= input.path ? getOutputFilePath(input.path, mergedConfig.as_html ? 'html' : 'pdf') : 'stdout';

		// Add highlight stylesheet
		this.addHighlightStylesheet(mergedConfig);

		// Process Mermaid diagrams only if Mermaid blocks are present
		// Use a new regex instance to avoid global state issues
		const mermaidRegex = new RegExp(MERMAID_CONSTANTS.BLOCK_REGEX.source, MERMAID_CONSTANTS.BLOCK_REGEX.flags);
		const hasMermaidBlocks = mermaidRegex.test(markdown);
		let mermaidImageFiles: string[] = [];
		let processedMarkdown: string;
		if (hasMermaidBlocks) {
			const mermaidResult = await this.processMermaidDiagrams(markdown, mergedConfig, browser, input.path);
			processedMarkdown = mermaidResult.processedMarkdown;
			mermaidImageFiles = mermaidResult.imageFiles;
		} else {
			processedMarkdown = markdown;
		}

		// Generate HTML using markdown parser
		const html = getHtml(processedMarkdown, mergedConfig);

		// Generate output (PDF or HTML)
		const relativePath = input.path ? relative(mergedConfig.basedir, input.path) : '.';
		const output = await this.outputGenerator.generate(html, relativePath, mergedConfig, browser);

		if (!output) {
			if (mergedConfig.devtools) {
				throw new OutputGenerationError('No file is generated with --devtools.');
			}

			throw new OutputGenerationError(`Failed to create ${mergedConfig.as_html ? 'HTML' : 'PDF'}.`);
		}

		// Write output to file or stdout
		await this.writeOutput(output);

		// Clean up Mermaid image files after PDF generation
		// Images are already embedded in the PDF/HTML, so we can safely remove temp files
		if (mermaidImageFiles.length > 0) {
			await this.mermaidProcessor.cleanup(mermaidImageFiles).catch((error: unknown) => {
				// Log but don't fail if cleanup fails
				this.logger.warn(
					`Failed to clean up some Mermaid images: ${error instanceof Error ? error.message : String(error)}`,
				);
			});
		}

		// Return properly typed output
		if (mergedConfig.as_html) {
			return output as HtmlConversionOutput;
		}

		return output as PdfConversionOutput;
	}

	/**
	 * Validate input according to business rules.
	 *
	 * @param input - Input to validate
	 * @throws ValidationError if input is invalid
	 */
	private validateInput(input: MarkdownInput): void {
		if (!input.path && !input.content) {
			throw new ValidationError('Input must have either path or content');
		}
	}

	/**
	 * Read markdown content from input source.
	 *
	 * @param input - Input source
	 * @param config - Configuration with encoding
	 * @returns Promise resolving to markdown content
	 * @throws ValidationError if file cannot be read
	 */
	private async readMarkdownContent(input: MarkdownInput, config: Config): Promise<string> {
		if (input.content) {
			return input.content;
		}

		if (!input.path) {
			throw new ValidationError('Input path is required when content is not provided');
		}

		if (!this.fileService) {
			throw new ValidationError('File service is not available. Cannot read file.');
		}

		try {
			return await this.fileService.readFile(input.path, config.md_file_encoding);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			// Provide user-friendly error message
			if (message.includes('ENOENT') || message.includes('no such file')) {
				throw new ValidationError(
					`File not found: "${input.path}". Please check that the file exists and the path is correct.`,
					error instanceof Error ? error : undefined,
				);
			}

			if (message.includes('EACCES') || message.includes('permission denied')) {
				throw new ValidationError(
					`Permission denied: "${input.path}". Please check that you have read permission for this file.`,
					error instanceof Error ? error : undefined,
				);
			}

			throw new ValidationError(
				`Failed to read markdown file "${input.path}": ${message}`,
				error instanceof Error ? error : undefined,
			);
		}
	}

	/**
	 * Parse front-matter from markdown content.
	 *
	 * Logs warnings but does not throw errors if front-matter parsing fails.
	 * This allows conversion to continue even with invalid front-matter.
	 *
	 * @param content - Markdown content with optional front-matter
	 * @param config - Configuration with gray-matter options
	 * @returns Object with parsed markdown content and front-matter data
	 */
	private parseFrontMatter(content: string, config: Config): { content: string; data: any } {
		try {
			const result = grayMatter(content, config.gray_matter_options);
			if (result.data instanceof Error) {
				this.logger.warn('Front-matter was ignored because it could not be parsed', result.data);
				return { content, data: {} };
			}

			return result;
		} catch (error) {
			const parseError = error instanceof Error ? error : new Error(String(error));
			this.logger.warn('Failed to parse front-matter, continuing without it', parseError);
			return { content, data: {} };
		}
	}

	/**
	 * Process Mermaid diagrams in markdown.
	 *
	 * @returns Object with processed markdown and image files to clean up
	 */
	private async processMermaidDiagrams(
		markdown: string,
		config: Config,
		browser: Browser | undefined,
		inputPath: string | undefined,
	): Promise<{ processedMarkdown: string; imageFiles: string[] }> {
		let mermaidBrowser: Browser | undefined = browser;
		let shouldCloseBrowser = false;
		const imageFiles: string[] = [];

		try {
			if (!mermaidBrowser) {
				mermaidBrowser = await puppeteer.launch({
					headless: config.launch_options?.headless ?? 'new',
					devtools: config.devtools,
					...config.launch_options,
				} as any);
				shouldCloseBrowser = true;
			}

			const markdownDir = inputPath ? dirname(inputPath) : undefined;
			const result: MermaidProcessResult = await this.mermaidProcessor.processCharts(
				markdown,
				mermaidBrowser,
				config.basedir,
				markdownDir,
				config.port,
				config,
			);

			// Log warnings
			if (result.warnings.length > 0) {
				this.logger.warn('Some Mermaid charts could not be compiled:');
				for (const warning of result.warnings) {
					this.logger.warn(`  - ${warning}`);
				}
			}

			imageFiles.push(...result.imageFiles);
			return { processedMarkdown: result.processedMarkdown, imageFiles };
		} catch (error) {
			const processError =
				error instanceof Error
					? new MermaidProcessError(`Failed to process Mermaid charts: ${error.message}`, undefined, error)
					: new MermaidProcessError(
							`Failed to process Mermaid charts: ${String(error)}`,
							undefined,
							new Error(String(error)),
						);

			this.logger.warn('Failed to process Mermaid charts, continuing without them', processError);
			return { processedMarkdown: markdown, imageFiles: [] };
		} finally {
			if (shouldCloseBrowser && mermaidBrowser) {
				await mermaidBrowser.close().catch(() => {
					// Ignore errors
				});
			}
		}
	}

	/**
	 * Add highlight.js stylesheet to config.
	 */
	private addHighlightStylesheet(config: Config): void {
		const highlightStylesheet = resolve(
			dirname(require.resolve('highlight.js')),
			'..',
			'styles',
			`${config.highlight_style}.css`,
		);

		config.stylesheet = [...new Set([...config.stylesheet, highlightStylesheet])];
	}

	/**
	 * Write output to file or stdout.
	 * Prints the output file path after successful write.
	 */
	private async writeOutput(output: ConversionOutput): Promise<void> {
		if (!output.filename) {
			return;
		}

		if (output.filename === 'stdout') {
			if (Buffer.isBuffer(output.content)) {
				process.stdout.write(output.content as any);
			} else {
				process.stdout.write(output.content);
			}
		} else {
			await this.fileService.writeFile(output.filename, output.content);
			this.printOutputPath(output.filename, output);
		}
	}

	/**
	 * Print the output file path to console.
	 * Follows Clean Code principles: single responsibility, clear naming, small functions.
	 *
	 * @param filePath - Path to the generated file (can be relative or absolute)
	 * @param output - The conversion output to determine file type
	 */
	private printOutputPath(filePath: string, output: ConversionOutput): void {
		const fileType = this.determineFileType(output);
		// Always resolve to absolute path for clarity
		// resolve() handles both relative and absolute paths correctly
		// If path is already absolute, resolve returns it unchanged; if relative, resolves from cwd
		const resolvedPath = resolve(filePath);
		// Always print the full absolute path - this is important for users to know where the file is
		console.log(`✓ Generated ${fileType}: ${resolvedPath}`);
	}

	/**
	 * Determine file type from output content.
	 * Small, focused function following Clean Code principles.
	 *
	 * @param output - The conversion output
	 * @returns File type string ('PDF' or 'HTML')
	 */
	private determineFileType(output: ConversionOutput): string {
		return Buffer.isBuffer(output.content) ? 'PDF' : 'HTML';
	}

	/**
	 * Cleanup resources.
	 */
	public async cleanup(): Promise<void> {
		await this.outputGenerator.closeBrowser();
	}
}
