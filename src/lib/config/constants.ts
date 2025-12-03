/**
 * Constants used throughout the mdpdf application.
 * Centralizes magic numbers, strings, and configuration values.
 */

/**
 * Mermaid diagram processing constants.
 */
export const MERMAID_CONSTANTS = {
	/**
	 * Regex pattern for matching Mermaid code blocks in markdown.
	 */
	BLOCK_REGEX: /```mermaid\s*\n([\s\S]*?)```/g,

	/**
	 * CDN URL for Mermaid.js library.
	 */
	CDN_URL: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',

	/**
	 * Timeout for Mermaid rendering in milliseconds.
	 * Set to aggressive value to prevent stalling - fail fast if chart doesn't render quickly.
	 * Most charts render in 1-2 seconds, so 2.5 seconds is sufficient for fast processing.
	 */
	RENDER_TIMEOUT_MS: 2_500,

	/**
	 * Padding around Mermaid charts in pixels.
	 */
	CHART_PADDING_PX: 40,

	/**
	 * Maximum width for Mermaid chart containers as percentage of page width.
	 * Keeps diagrams at a normal, readable size in the PDF.
	 * Higher for horizontal charts, lower for vertical charts.
	 */
	MAX_CHART_WIDTH_PERCENT: 90,

	/**
	 * Maximum pixel width for horizontal charts (wide charts like sequence diagrams).
	 * Horizontal charts can be wider since they don't take up vertical space.
	 * Increased significantly for much better readability of horizontal flowcharts and sequence diagrams.
	 */
	MAX_HORIZONTAL_CHART_WIDTH_PX: 1600,

	/**
	 * Maximum pixel width for vertical charts (tall charts like vertical flowcharts).
	 * Vertical charts need width constraint to fit on page.
	 * Reduced significantly to make vertical charts way smaller.
	 */
	MAX_VERTICAL_CHART_WIDTH_PX: 250,

	/**
	 * Maximum pixel height for rendered Mermaid charts (visual size).
	 * Prevents vertical flowcharts from taking multiple pages.
	 * Charts taller than this will be scaled down while maintaining aspect ratio.
	 * Only applies to vertical charts - horizontal charts are not height-constrained.
	 * Reduced significantly to make vertical charts way smaller.
	 */
	MAX_CHART_HEIGHT_PX: 200,

	/**
	 * Device scale factor for high-resolution screenshots.
	 * 8 = 8x resolution (Ultra High-Res) - gives ultra-sharp PNGs even at smaller visual sizes
	 * Higher values produce sharper images. Any positive number is supported.
	 * Common values: 2 (good), 3 (better), 4 (excellent), 8 (maximum quality for print).
	 */
	DEVICE_SCALE_FACTOR: 8,

	/**
	 * Temporary directory name for Mermaid images.
	 */
	TEMP_DIR_NAME: 'mdpdf-mermaid-images',

	/**
	 * URL path prefix for serving temporary Mermaid images.
	 */
	TEMP_URL_PATH: '__mdpdf_temp__',

	/**
	 * CSS class name for Mermaid chart containers.
	 */
	CONTAINER_CLASS: 'mermaid-chart-container',
} as const;

/**
 * Image generation constants.
 */
export const IMAGE_CONSTANTS = {
	/**
	 * Default image file extension.
	 */
	EXTENSION: '.png',

	/**
	 * Image MIME type.
	 */
	MIME_TYPE: 'image/png',
} as const;

/**
 * File system constants.
 */
export const FS_CONSTANTS = {
	/**
	 * Default file encoding.
	 */
	DEFAULT_ENCODING: 'utf-8',
} as const;
