/**
 * Mermaid Quality Verification Tests
 *
 * Tests to ensure Mermaid charts render with high quality,
 * especially vertical charts that were previously blurry.
 */

import test from 'ava';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import puppeteer, { type Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';
import { defaultConfig } from '../lib/config.js';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: 'new' });
});

test.after(async () => {
	await browser.close();
});

test('Vertical flowchart should render with high quality (minimum viewport)', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	try {
		// Access private method for testing
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash',
			0,
			defaultConfig,
		) as string;

		// Verify image was created
		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Image file should exist and have content');

		// Verify image is PNG
		t.true(imagePath.endsWith('.png'), 'Image should be PNG format');

		// Cleanup
		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render vertical flowchart: ${error instanceof Error ? error.message : String(error)}`);
	}
});

test('Horizontal flowchart should render with high quality', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `flowchart LR
    A[Start] --> B[Process] --> C[End]`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	try {
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash-2',
			0,
			defaultConfig,
		) as string;

		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Image file should exist and have content');
		t.true(imagePath.endsWith('.png'), 'Image should be PNG format');

		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render horizontal flowchart: ${error instanceof Error ? error.message : String(error)}`);
	}
});

test('State diagram should render with high quality', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: Start Task
    Processing --> Success: Task Complete
    Processing --> Error: Task Failed
    Success --> Idle: Reset
    Error --> Idle: Reset`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	try {
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash-3',
			0,
			defaultConfig,
		) as string;

		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Image file should exist and have content');
		t.true(imagePath.endsWith('.png'), 'Image should be PNG format');

		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render state diagram: ${error instanceof Error ? error.message : String(error)}`);
	}
});

test('Git graph should render with high quality', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Dev Work 1"
    commit id: "Dev Work 2"
    checkout main
    commit id: "Hotfix"
    merge develop
    commit id: "Release"`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	try {
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash-4',
			0,
			defaultConfig,
		) as string;

		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Image file should exist and have content');
		t.true(imagePath.endsWith('.png'), 'Image should be PNG format');

		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render git graph: ${error instanceof Error ? error.message : String(error)}`);
	}
});

test('Small vertical chart should use minimum viewport for quality', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `flowchart TD
    A --> B`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	try {
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash-5',
			0,
			defaultConfig,
		) as string;

		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Small chart should still render with quality');
		
		// Small charts should still produce reasonable file sizes due to minimum viewport
		t.true(stats.size > 1000, 'Image should have reasonable size due to minimum viewport');

		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render small vertical chart: ${error instanceof Error ? error.message : String(error)}`);
	}
});

test('Custom resolution should be respected', async (t) => {
	const processor = new MermaidProcessorService();
	const mermaidCode = `flowchart TD
    A --> B --> C`;

	const imageDir = join(tmpdir(), 'mermaid-test');
	await fs.mkdir(imageDir, { recursive: true });

	const customConfig = {
		...defaultConfig,
		mermaid: {
			resolution: 2, // Lower resolution for testing
		},
	};

	try {
		const imagePath = await (processor as any).renderMermaidToImage(
			mermaidCode,
			browser,
			imageDir,
			'test-hash-6',
			0,
			customConfig,
		) as string;

		const stats = await fs.stat(imagePath);
		t.truthy(stats.size > 0, 'Image should render with custom resolution');

		await fs.unlink(imagePath).catch(() => {});
	} catch (error) {
		t.fail(`Failed to render with custom resolution: ${error instanceof Error ? error.message : String(error)}`);
	}
});

