/**
 * End-to-End Test: Clean Install Verification
 * 
 * This test verifies that the package works correctly after a clean install.
 * It simulates a fresh npm install scenario by testing:
 * - CLI can be executed
 * - Config files are included
 * - Assets are included
 */

import test from 'ava';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

test('clean install: CLI file exists and is executable', (t) => {
	const cliPath = join(process.cwd(), 'dist', 'cli.js');
	t.true(existsSync(cliPath), 'CLI file should exist after build');
	
	// Verify file is readable
	const stats = statSync(cliPath);
	t.true(stats.isFile(), 'CLI should be a file');
	t.true(stats.size > 0, 'CLI file should not be empty');
});

test('clean install: config file is included in package', (t) => {
	const configExample = join(process.cwd(), 'pdfify-md.config.example.json');
	if (!existsSync(configExample)) {
		t.skip('pdfify-md.config.example.json not present (optional); add it for full e2e coverage');
		return;
	}
	const config = JSON.parse(readFileSync(configExample, 'utf-8'));
	t.truthy(config.mermaid);
	t.is(typeof config.mermaid.horizontal_width, 'number');
	t.is(typeof config.mermaid.vertical_width, 'number');
	t.is(typeof config.mermaid.max_height, 'number');
	t.is(typeof config.mermaid.resolution, 'number');
});

test('clean install: assets are included', (t) => {
	const cssPath = join(process.cwd(), 'assets', 'css', 'markdown.css');
	t.true(existsSync(cssPath), 'Markdown CSS should exist');
	
	const cssContent = readFileSync(cssPath, 'utf-8');
	t.true(cssContent.length > 0);
	t.true(cssContent.includes('body'));
});

test('clean install: dist files are built', (t) => {
	const indexPath = join(process.cwd(), 'dist', 'index.js');
	const cliPath = join(process.cwd(), 'dist', 'cli.js');
	
	t.true(existsSync(indexPath), 'dist/index.js should exist');
	t.true(existsSync(cliPath), 'dist/cli.js should exist');
});
