/**
 * ConfigService - Manages configuration merging and validation.
 * Handles default config, front-matter, CLI args, and config files.
 */

import { type IConfigService } from '../interfaces/index.js';
import { type Config, defaultConfig } from '../config.js';
import { getMarginObject } from '../utils/pdf.js';

export class ConfigService implements IConfigService {
	/**
	 * Get default configuration.
	 *
	 * @returns Default config object
	 */
	public getDefaultConfig(): Config {
		return { ...defaultConfig };
	}

	/**
	 * Merge multiple configuration objects.
	 * Later configs override earlier ones.
	 *
	 * @param configs - Configuration objects to merge
	 * @returns Merged configuration
	 */
	public mergeConfigs(...configs: Array<Partial<Config>>): Config {
		let merged: any = { ...defaultConfig };

		for (const config of configs) {
			merged = {
				...merged,
				...config,
				pdf_options: {
					...merged.pdf_options,
					...config.pdf_options,
				},
			};
		}

		// Ensure as_html is properly set
		if (merged.as_html !== true) {
			merged.as_html = false;
		}

		// Ensure pdf_options is always defined
		if (!merged.pdf_options) {
			merged.pdf_options = { ...defaultConfig.pdf_options };
		}

		// Sanitize array options
		const arrayOptions = ['body_class', 'script', 'stylesheet'] as const;
		for (const option of arrayOptions) {
			if (!Array.isArray(merged[option])) {
				merged[option] = [merged[option]].filter(Boolean);
			}
		}

		// Sanitize margin
		if (typeof merged.pdf_options.margin === 'string') {
			merged.pdf_options.margin = getMarginObject(merged.pdf_options.margin);
		}

		// Handle header/footer display
		const { headerTemplate, footerTemplate, displayHeaderFooter } = merged.pdf_options;
		if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
			merged.pdf_options.displayHeaderFooter = true;
		} else if (!headerTemplate && !footerTemplate && displayHeaderFooter === undefined) {
			merged.pdf_options.displayHeaderFooter = false;
		}

		return merged as Config;
	}

	/**
	 * Validate configuration.
	 * Throws error if configuration is invalid.
	 *
	 * @param config - Configuration to validate
	 */
	public validateConfig(config: Config): void {
		if (!config.basedir) {
			throw new Error('basedir is required');
		}

		if (config.port !== undefined && (config.port < 1 || config.port > 65_535)) {
			throw new Error('port must be between 1 and 65535');
		}

		if (!Array.isArray(config.stylesheet)) {
			throw new TypeError('stylesheet must be an array');
		}

		if (!Array.isArray(config.body_class)) {
			throw new TypeError('body_class must be an array');
		}
	}

	/**
	 * Merge CLI arguments into config.
	 *
	 * @param config - Base configuration
	 * @param args - CLI arguments object
	 * @returns Merged configuration
	 */
	public mergeCliArgs(config: Config, arguments_: Record<string, string | string[] | boolean | number>): Config {
		const jsonArguments = new Set(['--marked-options', '--pdf-options', '--launch-options']);
		const merged = { ...config };

		// Initialize mermaid config if any mermaid flags are present
		if (!merged.mermaid) {
			merged.mermaid = {};
		}

		for (const [argumentKey, argumentValue] of Object.entries(arguments_)) {
			if (!argumentKey.startsWith('--')) {
				continue;
			}

			// Handle mermaid-specific flags
			if (argumentKey === '--mermaid-horizontal-width' && typeof argumentValue === 'number') {
				merged.mermaid.horizontal_width = argumentValue;
				continue;
			}
			if (argumentKey === '--mermaid-vertical-width' && typeof argumentValue === 'number') {
				merged.mermaid.vertical_width = argumentValue;
				continue;
			}
			if (argumentKey === '--mermaid-max-height' && typeof argumentValue === 'number') {
				merged.mermaid.max_height = argumentValue;
				continue;
			}
		if (argumentKey === '--mermaid-resolution' && typeof argumentValue === 'number') {
			merged.mermaid.resolution = argumentValue;
			continue;
		}
		if (argumentKey === '--mermaid-timeout' && typeof argumentValue === 'number') {
			merged.mermaid.timeout = argumentValue;
			continue;
		}

			const key = argumentKey.slice(2).replaceAll('-', '_');

			if (jsonArguments.has(argumentKey) && typeof argumentValue === 'string') {
				try {
					(merged as any)[key] = JSON.parse(argumentValue);
				} catch {
					// Ignore invalid JSON
				}
			} else if (argumentValue !== undefined && argumentValue !== null) {
				(merged as any)[key] = argumentValue;
			}
		}

		return merged;
	}
}
