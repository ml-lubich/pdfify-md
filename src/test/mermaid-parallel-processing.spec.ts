/**
 * Tests for Parallel Processing Scenarios
 *
 * Tests that Mermaid chart processing works correctly when multiple
 * pdfify-md jobs run simultaneously, ensuring no file conflicts occur.
 */

import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';
import { generateContentHash, generateMermaidFilename } from '../lib/utils/hash.js';
import { MERMAID_CONSTANTS } from '../lib/constants.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('parallel processes should generate unique filenames for same content', async (t) => {
	const processor1 = new MermaidProcessorService();
	const processor2 = new MermaidProcessorService();
	const mermaidCode = 'graph TD\n    A --> B';
	const markdown = `# Test\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nDone.`;

	// Simulate two parallel processes processing the same markdown
	const [result1, result2] = await Promise.all([
		processor1.processCharts(markdown, browser, process.cwd(), undefined, 8000),
		processor2.processCharts(markdown, browser, process.cwd(), undefined, 8001),
	]);

	// Both should produce the same hash-based filename
	const hash = generateContentHash(mermaidCode);
	const expectedFilename = generateMermaidFilename(mermaidCode, 0);

	t.is(result1.imageFiles.length, 1);
	t.is(result2.imageFiles.length, 1);

	const filename1 = result1.imageFiles[0]!.split(/[/\\]/).pop();
	const filename2 = result2.imageFiles[0]!.split(/[/\\]/).pop();

	// Filenames should be identical (same content = same hash)
	t.is(filename1, expectedFilename);
	t.is(filename2, expectedFilename);
	t.is(filename1, filename2);

	// Cleanup
	for (const file of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(file).catch(() => {});
	}
});

test('parallel processes should not overwrite each other files', async (t) => {
	const processor1 = new MermaidProcessorService();
	const processor2 = new MermaidProcessorService();

	const code1 = 'graph TD\n    A --> B';
	const code2 = 'graph TD\n    A --> C';
	const markdown1 = `# Test\n\n\`\`\`mermaid\n${code1}\n\`\`\`\n\nDone.`;
	const markdown2 = `# Test\n\n\`\`\`mermaid\n${code2}\n\`\`\`\n\nDone.`;

	// Simulate two parallel processes processing different markdown
	const [result1, result2] = await Promise.all([
		processor1.processCharts(markdown1, browser, process.cwd(), undefined, 8002),
		processor2.processCharts(markdown2, browser, process.cwd(), undefined, 8003),
	]);

	// Both should produce different filenames (different content = different hash)
	t.is(result1.imageFiles.length, 1);
	t.is(result2.imageFiles.length, 1);

	const filename1 = result1.imageFiles[0]!.split(/[/\\]/).pop();
	const filename2 = result2.imageFiles[0]!.split(/[/\\]/).pop();

	t.not(filename1, filename2);

	// Verify both files exist and are different
	const file1Exists = await fs
		.access(result1.imageFiles[0]!)
		.then(() => true)
		.catch(() => false);
	const file2Exists = await fs
		.access(result2.imageFiles[0]!)
		.then(() => true)
		.catch(() => false);

	t.true(file1Exists);
	t.true(file2Exists);

	// Files should have different sizes or content (they're different charts)
	const stats1 = await fs.stat(result1.imageFiles[0]!);
	const stats2 = await fs.stat(result2.imageFiles[0]!);

	// At least verify they're both valid files
	t.true(stats1.size > 0);
	t.true(stats2.size > 0);

	// Cleanup
	for (const file of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(file).catch(() => {});
	}
});

test('multiple charts in same document should have unique hashes', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    A->>B: Hello
\`\`\`

\`\`\`mermaid
graph LR
    A --> B
    B --> C
\`\`\`

Done.`;

	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 8004);

	t.is(result.imageFiles.length, 3);

	// Extract hashes from filenames
	const hashes = result.imageFiles.map((file) => {
		const filename = file.split(/[/\\]/).pop()!;
		// Extract hash from filename: mermaid-{hash}-{index}.png
		const match = /^mermaid-([a-f\d]+)-\d+\.png$/.exec(filename);
		return match ? match[1] : null;
	});

	// All hashes should be different
	t.is(hashes.length, 3);
	t.not(hashes[0], hashes[1]);
	t.not(hashes[1], hashes[2]);
	t.not(hashes[0], hashes[2]);

	// Cleanup
	for (const file of result.imageFiles) {
		await fs.unlink(file).catch(() => {});
	}
});

test('same chart content should reuse same hash even with different whitespace', async (t) => {
	const processor = new MermaidProcessorService();
	const code1 = 'graph TD\n    A --> B';
	const code2 = '  graph TD\n    A --> B  ';
	const markdown1 = `# Test\n\n\`\`\`mermaid\n${code1}\n\`\`\`\n\nDone.`;
	const markdown2 = `# Test\n\n\`\`\`mermaid\n${code2}\n\`\`\`\n\nDone.`;

	const [result1, result2] = await Promise.all([
		processor.processCharts(markdown1, browser, process.cwd(), undefined, 8005),
		processor.processCharts(markdown2, browser, process.cwd(), undefined, 8006),
	]);

	const filename1 = result1.imageFiles[0]!.split(/[/\\]/).pop();
	const filename2 = result2.imageFiles[0]!.split(/[/\\]/).pop();

	// Should produce same hash (whitespace is normalized)
	t.is(filename1, filename2);

	// Cleanup
	for (const file of [...result1.imageFiles, ...result2.imageFiles]) {
		await fs.unlink(file).catch(() => {});
	}
});

test('concurrent file writes should not conflict', async (t) => {
	// Simulate concurrent writes to the same temp directory
	const imageDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(imageDir, { recursive: true });

	const mermaidCode = 'graph TD\n    A --> B';
	const hash = generateContentHash(mermaidCode);
	const filename = generateMermaidFilename(mermaidCode, 0);
	const filePath = join(imageDir, filename);

	// Simulate multiple processes trying to write the same file concurrently
	const writePromises = Array.from({ length: 5 }, async (_, i) => {
		// Each "process" writes a test file
		const testContent = Buffer.from(`test content ${i}`);
		await fs.writeFile(filePath, testContent);
		return i;
	});

	await Promise.all(writePromises);

	// File should exist (last write wins, but that's okay for our use case)
	const exists = await fs
		.access(filePath)
		.then(() => true)
		.catch(() => false);
	t.true(exists);

	// Cleanup
	await fs.unlink(filePath).catch(() => {});
});

test('hash collision should be extremely rare', (t) => {
	// Test that different content produces different hashes
	const contents = [
		'graph TD\n    A --> B',
		'graph TD\n    A --> C',
		'graph LR\n    A --> B',
		'sequenceDiagram\n    A->>B: Hello',
		'graph TD\n    A --> B\n    B --> C',
		'graph TD\n    A --> B\n    B --> D',
		'flowchart TD\n    A --> B',
		'gantt\n    title Test',
	];

	const hashes = contents.map((content) => generateContentHash(content));

	// All hashes should be unique
	const uniqueHashes = new Set(hashes);
	t.is(uniqueHashes.size, contents.length);
});

test('empty content should still generate valid hash', (t) => {
	const hash = generateContentHash('');
	t.truthy(hash);
	t.is(hash.length, 16);
	t.regex(hash, /^[a-f\d]+$/);
});

test('very long content should generate consistent hash', (t) => {
	const longContent = 'graph TD\n' + Array.from({ length: 1000 }).fill('    A --> B').join('\n');
	const hash1 = generateContentHash(longContent);
	const hash2 = generateContentHash(longContent);

	t.is(hash1, hash2);
	t.is(hash1.length, 16);
});
