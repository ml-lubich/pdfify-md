import { resolve } from 'node:path';
import { type GrayMatterOption } from 'gray-matter';
import { type marked } from 'marked';
import { type FrameAddScriptTagOptions, type launch, type PDFOptions } from 'puppeteer';

// Marked v4 types are in the marked namespace
export type MarkedOptions = marked.MarkedOptions;
export type MarkedExtension = any;

// Resolve markdown.css path - works in both source and compiled code
// In compiled: dist/lib/config -> dist -> .. -> assets/css/markdown.css (root)
// __dirname in compiled code is dist/lib/config
// We need: dist/lib/config -> dist/lib -> dist -> .. -> assets/css/markdown.css
const getMarkdownCssPath = (): string => {
	// Go up from dist/lib/config to dist, then up to root, then assets/css/markdown.css
	return resolve(__dirname, '..', '..', '..', 'assets', 'css', 'markdown.css');
};

export const defaultConfig: PdfConfig = {
	basedir: process.cwd(),
	stylesheet: [getMarkdownCssPath()],
	script: [],
	css: '',
	document_title: '',
	body_class: [],
	page_media_type: 'screen',
	highlight_style: 'github',
	marked_options: {},
	pdf_options: {
		printBackground: true,
		format: 'a4',
		margin: {
			top: '30mm',
			right: '40mm',
			bottom: '30mm',
			left: '20mm',
		},
		displayHeaderFooter: false,
	},
	launch_options: {},
	gray_matter_options: {
		engines: {
			js: () =>
				new Error(
					'The JS engine for front-matter is disabled by default for security reasons. You can enable it by configuring gray_matter_options.',
				),
		},
	},
	md_file_encoding: 'utf-8',
	stylesheet_encoding: 'utf-8',
	as_html: false,
	devtools: false,
	marked_extensions: [],
};

/**
 * In config keys, dashes of cli flag names are replaced with underscores.
 */
export type Config = PdfConfig | HtmlConfig;

export type PdfConfig = {
	/**
	 * If true, output HTML instead of PDF.
	 */
	as_html: false;
} & BasicConfig;

export type HtmlConfig = {
	/**
	 * If true, output HTML instead of PDF.
	 */
	as_html: true;
} & BasicConfig;

type BasicConfig = {
	/**
	 * Base directory to be served by the file server.
	 */
	basedir: string;

	/**
	 * Optional destination path for the output file (including the extension).
	 */
	dest?: string;

	/**
	 * List of css files to use for styling.
	 *
	 * @todo change to `FrameAddStyleTagOptions` (will be a breaking change)
	 */
	stylesheet: string[];

	/**
	 * Custom css styles.
	 */
	css: string;

	/**
	 * List of scripts to load into the page.
	 *
	 * @see https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pageaddscripttagoptions
	 */
	script: FrameAddScriptTagOptions[];

	/**
	 * Name of the HTML Document.
	 */
	document_title: string;

	/**
	 * List of classes for the body tag.
	 */
	body_class: string[];

	/**
	 * Media type to emulate the page with.
	 */
	page_media_type: 'screen' | 'print';

	/**
	 * Highlight.js stylesheet to use (without the .css extension).
	 *
	 * @see https://github.com/isagalaev/highlight.js/tree/master/src/styles
	 */
	highlight_style: string;

	/**
	 * Options for the Marked parser.
	 *
	 * @see https://marked.js.org/#/USING_ADVANCED.md
	 */
	marked_options: MarkedOptions;

	/**
	 * PDF options for Puppeteer.
	 *
	 * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
	 */
	pdf_options: PDFOptions;

	/**
	 * Launch options for Puppeteer.
	 *
	 * @see https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
	 */
	launch_options: PuppeteerLaunchOptions & { headless?: boolean | 'new' | 'shell' };

	/**
	 * Options for gray-matter (front-matter parser).
	 *
	 * @see https://github.com/jonschlinkert/gray-matter#options
	 */
	gray_matter_options: GrayMatterOption<string, any>;

	/**
	 * Markdown file encoding. Default: `utf-8`.
	 */
	md_file_encoding: string;

	/**
	 * CSS stylesheet encoding. Default: `utf-8`.
	 */
	stylesheet_encoding: string;

	/**
	 * If true, open chromium with devtools instead of saving the pdf. This is
	 * meant for development only, to inspect the rendered HTML.
	 */
	devtools: boolean;

	/**
	 * Extensions for the Marked parser.
	 *
	 * @see https://marked.js.org/#/USING_PRO.md#extensions
	 */
	marked_extensions: MarkedExtension[];

	/**
	 * Port number for the HTTP server. Automatically assigned if not provided.
	 */
	port?: number;
	/**
	 * Mermaid chart configuration.
	 */
	mermaid?: {
		/**
		 * Maximum width for horizontal charts (wide charts like sequence diagrams).
		 * Default: 1600
		 */
		horizontal_width?: number;
		/**
		 * Maximum width for vertical charts (tall charts like vertical flowcharts).
		 * Default: 250
		 */
		vertical_width?: number;
		/**
		 * Maximum height for charts (prevents vertical charts from spanning pages).
		 * Default: 200
		 */
		max_height?: number;
		/**
		 * Device scale factor for high-resolution screenshots.
		 * Any positive number is supported. Higher values = sharper images but larger file size.
		 * Common values: 2-4 for web, 6-10 for print.
		 * Default: 8
		 */
		resolution?: number;
		/**
		 * Timeout for Mermaid chart rendering in milliseconds.
		 * Increase for complex charts with many nodes.
		 * Default: 60000 (60 seconds)
		 */
		timeout?: number;
	};
};

type PuppeteerLaunchOptions = Parameters<typeof launch>[0];
