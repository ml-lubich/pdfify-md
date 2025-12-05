/**
 * MermaidProcessorService - Handles processing Mermaid diagrams.
 * Renders Mermaid code blocks to images and replaces them in markdown.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type Browser, type Page } from 'puppeteer';
import { type IMermaidProcessor, type MermaidProcessResult } from '../interfaces/index.js';
import { MERMAID_CONSTANTS, IMAGE_CONSTANTS } from '../config/constants.js';
import { type Config } from '../config.js';
import { generateContentHash } from '../utils/hash.js';

export class MermaidProcessorService implements IMermaidProcessor {
	/**
	 * Process Mermaid charts in markdown by rendering them to images.
	 *
	 * @param markdown - The markdown content to process
	 * @param browser - Puppeteer browser instance for rendering
	 * @param baseDir - Base directory (unused, kept for compatibility)
	 * @param markdownDir - Markdown file directory (unused, kept for compatibility)
	 * @param _serverPort - HTTP server port (unused, images are embedded as data URIs)
	 * @returns Processed markdown with image references
	 */
	public async processCharts(
		markdown: string,
		browser: Browser,
		_baseDir: string,
		_markdownDir?: string,
		_serverPort?: number,
		config?: Config,
	): Promise<MermaidProcessResult> {
		const imageFiles: string[] = [];
		const warnings: string[] = [];
		let processedMarkdown = markdown;

		const imageDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
		const matches = [...markdown.matchAll(MERMAID_CONSTANTS.BLOCK_REGEX)];

		if (matches.length === 0) {
			return {
				processedMarkdown: markdown,
				imageFiles: [],
				warnings: [],
			};
		}

		await this.ensureImageDirectory(imageDir);

		const totalCharts = matches.length;
		// Get timeout from config or use default constant
		const renderTimeout = config?.mermaid?.timeout ?? MERMAID_CONSTANTS.RENDER_TIMEOUT_MS;
		// Always show progress for Mermaid charts (useful for debugging slow charts)
		// Use stderr to bypass Listr's stdout capture
		const showProgress = process.stderr.isTTY;
		if (totalCharts > 0 && showProgress) {
			process.stderr.write(`\n  Processing ${totalCharts} Mermaid chart${totalCharts > 1 ? 's' : ''} (timeout: ${Math.round(renderTimeout / 1000)}s)...\n`);
		}

		// Process charts sequentially to avoid overloading browser
		// Sequential processing is more reliable for complex charts
		const results: Array<{ fullMatch: string; imageMarkdown: string; imagePath: string | null }> = [];
		
		for (let index = 0; index < matches.length; index++) {
			const match = matches[index]!;
			const mermaidCode = match[1]?.trim();
			const fullMatch = match[0];

			if (!mermaidCode) {
				warnings.push(`Skipping empty Mermaid chart at index ${index}`);
				results.push({ fullMatch, imageMarkdown: '', imagePath: null });
				continue;
			}

			try {
				// Show progress for this chart
				if (showProgress) {
					process.stderr.write(`    [${index + 1}/${totalCharts}] Rendering chart ${index + 1}...`);
				}
				
				// Generate short 8-character hash for filename
				const contentHash = generateContentHash(mermaidCode, 8);
				// Wrap in Promise.race with configurable timeout to prevent stalling
				const imagePath = await Promise.race([
					this.renderMermaidToImage(mermaidCode, browser, imageDir, contentHash, index, config),
					new Promise<string>((_, reject) => 
						setTimeout(() => reject(new Error(`Chart rendering timeout after ${renderTimeout}ms`)), renderTimeout + 1000)
					),
				]);

				// Read PNG and convert to base64 data URI for embedding in PDF
				const imageBuffer = await fs.readFile(imagePath);
				const imageBase64 = imageBuffer.toString('base64');
				const imageDataUri = `data:${IMAGE_CONSTANTS.MIME_TYPE};base64,${imageBase64}`;

				// Use HTML img tag directly - marked will pass it through
				// High-res image but constrained display size for compact, normal-sized charts
				const maxWidthPercent = MERMAID_CONSTANTS.MAX_CHART_WIDTH_PERCENT;
				const imageMarkdown = `<div class="${MERMAID_CONSTANTS.CONTAINER_CLASS}" style="max-width: ${maxWidthPercent}%; margin: 0.5em auto; text-align: center;"><img src="${imageDataUri}" alt="Mermaid Chart ${index + 1}" style="max-width: 100%; width: auto; height: auto; display: block; margin: 0 auto;" /></div>`;

				// Show success for this chart
				if (showProgress) {
					process.stderr.write(` done\n`);
				}

				results.push({ fullMatch, imageMarkdown, imagePath });
			} catch (error) {
				// Remove the failed Mermaid diagram from markdown instead of including broken image
				const errorMessage = error instanceof Error ? error.message : String(error);
				warnings.push(`Skipping Mermaid chart ${index + 1} due to syntax error: ${errorMessage}`);
				// Show failure for this chart
				if (showProgress) {
					process.stderr.write(` FAILED\n`);
				}
				// Return empty markdown to remove the code block
				results.push({ fullMatch, imageMarkdown: '', imagePath: null });
			}
		}

		// Apply results to markdown and collect image files
		for (const result of results) {
			processedMarkdown = processedMarkdown.replace(result.fullMatch, result.imageMarkdown);
			if (result.imagePath) {
				imageFiles.push(result.imagePath);
			}
		}

		// Show completion message
		if (totalCharts > 0 && showProgress) {
			process.stderr.write(`  All ${totalCharts} Mermaid chart${totalCharts > 1 ? 's' : ''} processed\n\n`);
		}

		return {
			processedMarkdown,
			imageFiles,
			warnings,
		};
	}

	/**
	 * Clean up temporary Mermaid image files.
	 *
	 * @param imageFiles - Array of image file paths to delete
	 */
	public async cleanup(imageFiles: string[]): Promise<void> {
		for (const imagePath of imageFiles) {
			try {
				await fs.unlink(imagePath);
			} catch {
				// Ignore errors - file might already be deleted
			}
		}

		try {
			const temporaryImageDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
			const files = await fs.readdir(temporaryImageDir);
			if (files.length === 0) {
				await fs.rmdir(temporaryImageDir);
			}
		} catch {
			// Ignore errors - directory might not exist
		}
	}

	/**
	 * Render a Mermaid chart to a PNG image.
	 *
	 * @param mermaidCode - The Mermaid diagram code
	 * @param browser - Puppeteer browser instance
	 * @param imageDir - Directory for saving images
	 * @param contentHash - Content-based hash for unique filename
	 * @param index - Index for ordering (used in filename)
	 * @returns Path to the generated image file
	 */
	private async renderMermaidToImage(
		mermaidCode: string,
		browser: Browser,
		imageDir: string,
		contentHash: string,
		index: number,
		config?: Config,
	): Promise<string> {
		const page = await browser.newPage();
		
		// Get timeout from config or use default constant
		const renderTimeout = config?.mermaid?.timeout ?? MERMAID_CONSTANTS.RENDER_TIMEOUT_MS;
		
		// Set page timeout to prevent hanging
		page.setDefaultTimeout(renderTimeout);
		page.setDefaultNavigationTimeout(renderTimeout);
		
		// Block unnecessary resources to speed up loading and prevent hangs
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const resourceType = request.resourceType();
			// Only allow essential resources - block images, fonts, stylesheets (we only need the script)
			if (resourceType === 'script' || request.url().includes('mermaid')) {
				request.continue();
			} else {
				request.abort();
			}
		});

		try {
			const html = this.createMermaidHtml(mermaidCode);
			// Use domcontentloaded for faster loading - don't wait for all resources
			// Mermaid CDN loads quickly, and we wait for render anyway
			// Set content without waiting - Mermaid will load asynchronously
			await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: renderTimeout });

			await this.waitForMermaidRender(page, renderTimeout);

			const dimensions = await this.getSvgDimensions(page);
			if (!dimensions) {
				throw new Error('Could not find rendered Mermaid SVG element');
			}

			// Scale charts intelligently based on orientation
			// For flowcharts: detect based on direction (TD/LR/BT/RL)
			// For other chart types: use rendered dimensions (aspect ratio)
			let chartWidth = dimensions.width;
			let chartHeight = dimensions.height;
			
			// Detect orientation: first try to parse flowchart direction, then fall back to aspect ratio
			let isHorizontal: boolean;
			const flowchartMatch = mermaidCode.match(/^(?:flowchart|graph)\s+(TD|LR|BT|RL|TB)/i);
			if (flowchartMatch && flowchartMatch[1]) {
				// Flowchart: use direction keyword
				const direction = flowchartMatch[1].toUpperCase();
				isHorizontal = direction === 'LR' || direction === 'RL'; // Left-Right or Right-Left = horizontal
			} else {
				// Other chart types (sequenceDiagram, gantt, classDiagram, etc.): use aspect ratio
				const aspectRatio = chartWidth / chartHeight;
				isHorizontal = aspectRatio > 1.2; // Wider than tall
			}
			
			// Get chart size limits from config or use defaults
			const mermaidConfig = config?.mermaid;
			const maxHorizontalWidth = mermaidConfig?.horizontal_width ?? MERMAID_CONSTANTS.MAX_HORIZONTAL_CHART_WIDTH_PX;
			const maxVerticalWidth = mermaidConfig?.vertical_width ?? MERMAID_CONSTANTS.MAX_VERTICAL_CHART_WIDTH_PX;
			const maxHeight = mermaidConfig?.max_height ?? MERMAID_CONSTANTS.MAX_CHART_HEIGHT_PX;
			
			// Different max widths for horizontal vs vertical charts
			const maxWidth = isHorizontal ? maxHorizontalWidth : maxVerticalWidth;
			
			// For horizontal charts: only constrain width, allow natural height
			// For vertical charts: constrain both width and height
			let scale = 1;
			if (isHorizontal) {
				// Horizontal charts: only scale if width exceeds max
				if (chartWidth > maxWidth) {
					scale = maxWidth / chartWidth;
				}
			} else {
				// Vertical charts: constrain both dimensions
				const widthScale = chartWidth > maxWidth ? maxWidth / chartWidth : 1;
				const heightScale = chartHeight > maxHeight ? maxHeight / chartHeight : 1;
				scale = Math.min(widthScale, heightScale);
			}
			
			if (scale < 1) {
				chartWidth = chartWidth * scale;
				chartHeight = chartHeight * scale;
			}

			// Set viewport with high device scale factor for high-resolution screenshots
			// Ensure minimum viewport size for quality, especially for small vertical charts
			// For very small charts, use a larger viewport to ensure sharp rendering
			const minViewportSize = 400; // Minimum viewport dimension for quality rendering
			const viewportWidth = Math.max(Math.ceil(chartWidth) + MERMAID_CONSTANTS.CHART_PADDING_PX, minViewportSize);
			const viewportHeight = Math.max(Math.ceil(chartHeight) + MERMAID_CONSTANTS.CHART_PADDING_PX, minViewportSize);
			
			// Get resolution from config or use default
			const deviceScaleFactor = config?.mermaid?.resolution ?? MERMAID_CONSTANTS.DEVICE_SCALE_FACTOR;
			
			await page.setViewport({
				width: viewportWidth,
				height: viewportHeight,
				deviceScaleFactor,
			});

			// Scale the SVG element to the constrained visual size
			// The screenshot will capture this at high resolution due to deviceScaleFactor
			await page.evaluate((width, height) => {
				const svg = document.querySelector('.mermaid svg') as SVGElement | null;
				if (svg) {
					svg.setAttribute('width', String(width));
					svg.setAttribute('height', String(height));
					(svg as any).style.width = `${width}px`;
					(svg as any).style.height = `${height}px`;
				}
			}, chartWidth, chartHeight);

			// Use content hash for filename to ensure uniqueness across parallel processes
			// Format: mermaid-{hash}-{index}.png
			const imageFilename = `mermaid-${contentHash}-${index}${IMAGE_CONSTANTS.EXTENSION}`;
			const temporaryImagePath = join(imageDir, imageFilename);
			const mermaidElement = await page.$('.mermaid');
			if (!mermaidElement) {
				throw new Error('Mermaid element not found for screenshot');
			}

			// Take high-resolution screenshot with timeout
			// Screenshot is fast even at high resolution (3x device scale)
			await Promise.race([
				mermaidElement.screenshot({
					path: temporaryImagePath,
					type: 'png',
				} as any),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot timeout')), renderTimeout)),
			]);

			return temporaryImagePath;
		} catch (error) {
			// Ensure page is closed even on error/timeout
			try {
				await page.close();
			} catch {
				// Ignore errors when closing page
			}
			throw error;
		} finally {
			// Double-check page is closed
			try {
				if (!page.isClosed()) {
					await page.close();
				}
			} catch {
				// Ignore errors
			}
		}
	}

	/**
	 * Create HTML page with Mermaid.js for rendering.
	 *
	 * Note: mermaidCode is inserted directly without escaping because:
	 * 1. Mermaid syntax requires special characters (<, >, etc.) to function
	 * 2. This processes the user's own markdown file (trusted input)
	 * 3. The code is executed in an isolated Puppeteer context
	 */
	private createMermaidHtml(mermaidCode: string): string {
		return `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<script src="${MERMAID_CONSTANTS.CDN_URL}"></script>
	<style>
		body {
			margin: 0;
			padding: 20px;
			background: white;
		}
		.mermaid {
			display: flex;
			justify-content: center;
			align-items: center;
		}
	</style>
</head>
<body>
	<div class="mermaid">
${mermaidCode}
	</div>
	<script>
		mermaid.initialize({ startOnLoad: true, theme: 'default' });
	</script>
</body>
</html>`;
	}

	/**
	 * Wait for Mermaid to render the SVG.
	 * Uses configurable timeout and polling to prevent stalling.
	 */
	private async waitForMermaidRender(page: Page, timeout: number = MERMAID_CONSTANTS.RENDER_TIMEOUT_MS): Promise<void> {
		try {
			// Use configurable timeout with frequent polling to detect failures quickly
			await Promise.race([
				page.waitForFunction(
					() => {
						const mermaidElement = document.querySelector('.mermaid svg');
						return mermaidElement !== null && mermaidElement.children.length > 0;
					},
					{ timeout, polling: 50 },
				),
				new Promise((_, reject) => 
					setTimeout(() => reject(new Error('Mermaid render timeout')), timeout)
				),
			]);
		} catch (error) {
			throw new Error(`Mermaid chart did not render within ${timeout}ms timeout`);
		}
	}

	/**
	 * Get SVG element dimensions.
	 */
	private async getSvgDimensions(page: Page): Promise<{ width: number; height: number } | undefined> {
		return page.evaluate(() => {
			const svg = document.querySelector('.mermaid svg');
			if (!svg) {
				return undefined;
			}

			return {
				width: svg.getBoundingClientRect().width,
				height: svg.getBoundingClientRect().height,
			};
		});
	}

	/**
	 * Ensure image directory exists.
	 */
	private async ensureImageDirectory(imageDir: string): Promise<void> {
		await fs.mkdir(imageDir, { recursive: true });
	}
}
