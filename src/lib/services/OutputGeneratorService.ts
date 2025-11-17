/**
 * OutputGeneratorService - Handles PDF and HTML generation.
 * Manages Puppeteer browser instances and page rendering.
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import {
	type IOutputGenerator,
	type ConversionOutput,
	type PdfConversionOutput,
	type HtmlConversionOutput,
} from '../interfaces/index.js';
import { type Config, type HtmlConfig, type PdfConfig } from '../config.js';
import { isHttpUrl } from '../utils/url.js';

export class OutputGeneratorService implements IOutputGenerator {
	private browserPromise: Promise<Browser> | undefined;
	private browserInstance: Browser | undefined;

	/**
	 * Generate PDF or HTML output from HTML content.
	 *
	 * @param html - The HTML content to convert
	 * @param relativePath - Relative path for the HTML file
	 * @param config - Configuration object
	 * @param browserRef - Optional browser instance to reuse
	 * @returns Promise resolving to output object
	 */
	public async generate(
		html: string,
		relativePath: string,
		config: Config,
		browserReference?: Browser,
	): Promise<ConversionOutput | undefined> {
		const browser = await this.getBrowser(browserReference, config);
		const page = await browser.newPage();

		try {
			await this.setupPage(page, html, relativePath, config);
			await this.loadResources(page, config);
			await this.waitForResources(page);

			const output = await this.generateOutput(page, config);
			return output;
		} finally {
			await page.close();
		}
	}

	/**
	 * Close the browser instance.
	 */
	public async closeBrowser(): Promise<void> {
		if (this.browserInstance) {
			try {
				// Close all pages first
				const pages = await this.browserInstance.pages();
				await Promise.all(pages.map(page => page.close().catch(() => {})));
				
				// Then close browser with timeout
				await Promise.race([
					this.browserInstance.close(),
					new Promise<void>((resolve) => {
						setTimeout(() => resolve(), 1000); // 1s timeout
					}),
				]);
			} catch (error) {
				// Ignore close errors
			} finally {
				this.browserInstance = undefined;
				this.browserPromise = undefined;
			}
		}
	}

	/**
	 * Get or create browser instance.
	 */
	private async getBrowser(browserReference: Browser | undefined, config: Config): Promise<Browser> {
		if (browserReference) {
			return browserReference;
		}

		if (!this.browserPromise) {
			this.browserPromise = puppeteer.launch({
				headless: config.launch_options?.headless ?? 'new',
				devtools: config.devtools,
				...config.launch_options,
			} as any);
			this.browserInstance = await this.browserPromise;
		}

		return this.browserInstance ?? (await this.browserPromise);
	}

	/**
	 * Setup the page with HTML content.
	 * Windows-compatible path handling.
	 */
	private async setupPage(page: Page, html: string, relativePath: string, config: Config): Promise<void> {
		const { join, sep, posix } = await import('node:path');
		// Windows-compatible path conversion
		const urlPathname = join(relativePath, 'index.html').split(sep).join(posix.sep);

		if (config.port) {
			// Try to navigate with timeout, but don't fail if it doesn't work
			// The setContent below will overwrite anyway
			try {
				await page
					.goto(`http://localhost:${config.port}/${urlPathname}`, {
						waitUntil: 'domcontentloaded',
						timeout: 5000,
					})
					.catch(() => {
						// Ignore navigation errors - we'll set content directly
					});
			} catch {
				// Navigation failed, continue with setContent
			}
		}

		await page.setContent(html);
	}

	/**
	 * Load stylesheets and scripts.
	 */
	private async loadResources(page: Page, config: Config): Promise<void> {
		for (const stylesheet of config.stylesheet) {
			await page.addStyleTag(isHttpUrl(stylesheet) ? { url: stylesheet } : { path: stylesheet });
		}

		if (config.css) {
			await page.addStyleTag({ content: config.css });
		}

		for (const scriptTagOptions of config.script) {
			await page.addScriptTag(scriptTagOptions);
		}
	}

	/**
	 * Wait for all resources to load.
	 * Since we use data URIs for Mermaid images (instant), we only need a small fixed delay.
	 */
	private async waitForResources(_page: Page): Promise<void> {
		// Data URIs are instant, just wait for page rendering
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	/**
	 * Generate the actual output (PDF or HTML).
	 */
	private async generateOutput(page: Page, config: Config): Promise<ConversionOutput | undefined> {
		if (config.devtools) {
			await new Promise((resolve) => page.on('close', resolve));
			return undefined;
		}

		if (this.isHtmlConfig(config)) {
			const content = await page.content();
			return { filename: config.dest, content } as HtmlConversionOutput;
		}

		// For PDF config
		const pdfConfig = config as PdfConfig;
		await page.emulateMediaType(pdfConfig.page_media_type);
		const pdfBuffer = await page.pdf(pdfConfig.pdf_options);
		return { filename: pdfConfig.dest, content: Buffer.from(pdfBuffer) } as PdfConversionOutput;
	}

	/**
	 * Type guard for HTML config.
	 */
	private isHtmlConfig(config: Config): config is HtmlConfig {
		return config.as_html;
	}
}
