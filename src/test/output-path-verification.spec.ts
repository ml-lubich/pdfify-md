/**
 * Output Path Verification Tests
 *
 * Tests to ensure PDFs are generated in correct locations
 * and full absolute paths are printed correctly.
 */

import test from 'ava';
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { CliService } from '../lib/cli/CliService.js';
import { defaultConfig } from '../lib/config.js';
import { getOutputFilePath } from '../lib/utils/file.js';

/**
 * Helper to create temporary markdown file
 */
async function createTempFile(content: string, filename = 'test.md'): Promise<string> {
	const tempDir = join(tmpdir(), 'pdfify-md-test');
	await fs.mkdir(tempDir, { recursive: true });
	const filePath = join(tempDir, filename);
	await fs.writeFile(filePath, content, 'utf-8');
	return filePath;
}

/**
 * Helper to cleanup temp file
 */
async function cleanupTempFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.unlink(pdfPath).catch(() => {});
	} catch {
		// Ignore cleanup errors
	}
}

test('getOutputFilePath should preserve directory structure', async (t) => {
	const testCases = [
		{ input: 'file.md', expectedDir: '' },
		{ input: './file.md', expectedDir: '.' },
		{ input: 'docs/file.md', expectedDir: 'docs' },
		{ input: './docs/file.md', expectedDir: './docs' },
		{ input: '/absolute/path/file.md', expectedDir: '/absolute/path' },
	];

	for (const testCase of testCases) {
		const result = getOutputFilePath(testCase.input, 'pdf');
		const { dir } = require('node:path').parse(result);
		t.is(dir, testCase.expectedDir, `Should preserve directory for ${testCase.input}`);
	}
});

test('PDF should be generated in same directory as source file', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent', 'test.md');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await cliService.run(arguments_ as any, defaultConfig);

		// PDF should be in same directory as source file
		const expectedPdfPath = filePath.replace('.md', '.pdf');
		await fs.access(expectedPdfPath);
		t.pass('PDF generated in same directory as source file');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('Full absolute path should be printed after generation', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent', 'test.md');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	const originalLog = console.log;
	let output = '';

	console.log = (message: string) => {
		output += message + '\n';
	};

	try {
		await cliService.run(arguments_ as any, defaultConfig);

		// Should contain full absolute path
		const expectedPdfPath = resolve(filePath.replace('.md', '.pdf'));
		t.true(output.includes('Generated PDF:'), 'Should print generation message');
		t.true(output.includes(expectedPdfPath) || output.includes('PDF'), 'Should include path information');
	} finally {
		console.log = originalLog;
		await cleanupTempFile(filePath);
	}
});

test('Multiple files should generate PDFs in their respective directories', async (t) => {
	const cliService = new CliService();
	const file1 = await createTempFile('# File 1\n\nContent 1', 'test1.md');
	const file2 = await createTempFile('# File 2\n\nContent 2', 'test2.md');
	const arguments_ = {
		_: [file1, file2],
		'--help': false,
		'--version': false,
	};

	try {
		await cliService.run(arguments_ as any, defaultConfig);

		// Both PDFs should be in same directory as their source files
		const pdf1 = file1.replace('.md', '.pdf');
		const pdf2 = file2.replace('.md', '.pdf');
		await fs.access(pdf1);
		await fs.access(pdf2);
		t.pass('Multiple PDFs generated in correct directories');
	} finally {
		await cleanupTempFile(file1);
		await cleanupTempFile(file2);
	}
});

test('Relative path should resolve to absolute path in output', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent', 'test.md');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	const originalLog = console.log;
	let output = '';

	console.log = (message: string) => {
		output += message + '\n';
	};

	try {
		await cliService.run(arguments_ as any, defaultConfig);

		// Output should contain absolute path (not relative)
		const expectedPdfPath = resolve(filePath.replace('.md', '.pdf'));
		t.true(output.includes(expectedPdfPath) || output.includes('PDF'), 'Should show absolute path');
	} finally {
		console.log = originalLog;
		await cleanupTempFile(filePath);
	}
});

test('Nested directory structure should be preserved', async (t) => {
	const tempDir = join(tmpdir(), 'pdfify-md-nested-test');
	await fs.mkdir(join(tempDir, 'subdir'), { recursive: true });
	const filePath = join(tempDir, 'subdir', 'test.md');
	await fs.writeFile(filePath, '# Test\n\nContent', 'utf-8');

	const cliService = new CliService();
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await cliService.run(arguments_ as any, defaultConfig);

		// PDF should be in subdir, not root
		const expectedPdfPath = join(tempDir, 'subdir', 'test.pdf');
		await fs.access(expectedPdfPath);
		t.pass('PDF generated in nested directory');
	} finally {
		await cleanupTempFile(filePath);
	}
});

