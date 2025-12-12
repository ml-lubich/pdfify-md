/**
 * File Utilities
 * Pure utility functions for file system operations and file type detection.
 */

import { promises as fs } from 'node:fs';
import { join, parse } from 'node:path';

/**
 * Regular expression matching markdown file extensions.
 * Supports: .md, .mkd, .mdown, .markdown (with optional .txt suffix)
 */
const MARKDOWN_EXTENSIONS = /\.(md|mkd|mdown|markdown)(\.txt)?$/i;

/**
 * Check whether a file path indicates a markdown file.
 *
 * @param path - File path to check
 * @returns `true` if path has a markdown extension, `false` otherwise
 */
export const isMdFile = (path: string): boolean => MARKDOWN_EXTENSIONS.test(path);

/**
 * Read a file with the given encoding and return its content as a string.
 *
 * Handles UTF-8 encoding natively and uses iconv-lite for other encodings
 * to solve compatibility issues with Windows encodings.
 *
 * @param file - Path to the file to read
 * @param encoding - File encoding (default: 'utf-8')
 * @returns Promise resolving to file content as string
 */
export const readFile = async (file: string, encoding = 'utf-8'): Promise<string> =>
	/utf-?8/i.test(encoding)
		? fs.readFile(file, { encoding: 'utf-8' })
		: (await import('iconv-lite')).decode(await fs.readFile(file), encoding);

/**
 * Derive the output file path from a source markdown file.
 *
 * Replaces the markdown file extension with the specified output extension.
 * Preserves the directory structure and base filename.
 *
 * @param mdFilePath - Path to the source markdown file
 * @param extension - Output file extension ('html' or 'pdf')
 * @returns Output file path with new extension
 */
export const getOutputFilePath = (mdFilePath: string, extension: 'html' | 'pdf'): string => {
	const { dir, name } = parse(mdFilePath);
	return join(dir, `${name}.${extension}`);
};

/**
 * Recursively find all markdown files in a path (file or directory).
 *
 * @param inputPath - File or directory path
 * @returns Promise resolving to array of markdown file paths
 */
export const getMarkdownFiles = async (inputPath: string): Promise<string[]> => {
	try {
		const stats = await fs.stat(inputPath);

		if (stats.isDirectory()) {
			const files = await fs.readdir(inputPath);
			const paths = await Promise.all(
				files.map((file) => getMarkdownFiles(join(inputPath, file))),
			);
			return paths.flat();
		}

		if (isMdFile(inputPath)) {
			return [inputPath];
		}

		return [];
	} catch (error) {
		// Ignore errors for non-existent files during recursion, unless it's the root call
		// But here we just return empty array for simplicity in recursion
		return [];
	}
};
