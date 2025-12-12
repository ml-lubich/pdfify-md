/**
 * Tests for MermaidProcessorService
 *
 * Tests Mermaid diagram processing and image generation.
 */

import { promises as fs } from 'node:fs';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
// Import from dist to avoid ts-node module resolution issues
import { MermaidProcessorService } from '../../dist/lib/services/MermaidProcessorService.js';
import { type Config } from '../../dist/lib/config.js';

/**
 * Creates a partial config for testing mermaid options.
 * Used for tests that only need to override specific mermaid settings.
 */
function createTestConfig(mermaidOptions: Config['mermaid']): Config {
	return {
		mermaid: mermaidOptions,
	} as unknown as Config;
}

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

test('processCharts should return original markdown when no mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = '# Hello World\n\nRegular content.';
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should process simple mermaid diagram', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	// Check for data URI embedded image
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle multiple mermaid diagrams', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 2);
	t.is(result.warnings.length, 0);
	// Check for multiple embedded images
	const imageMatches = result.processedMarkdown.match(/data:image\/png;base64,/g);
	t.is(imageMatches?.length, 2);

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle empty mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\n\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));
});

test('processCharts should continue processing when one diagram is empty', async (t) => {
	const processor = new MermaidProcessorService();
	// Second mermaid block is empty (whitespace only)
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`mermaid\n   \n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	// Should have processed the valid diagram
	t.is(result.imageFiles.length, 1);
	// Should have a warning for the empty diagram
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty'));

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should process diagram with config options', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`;
	const config = createTestConfig({
		timeout: 30000,
		horizontal_width: 800,
		vertical_width: 400,
		max_height: 600,
		resolution: 2,
	});
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, undefined, config);

	t.truthy(result.processedMarkdown);
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));
	t.is(result.imageFiles.length, 1);

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should NOT process markdown with no Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Hello World\n\nThis is regular markdown content.\n\n\`\`\`javascript\nconsole.log('hello');\n\`\`\`\n\nMore content here.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should NOT process non-Mermaid code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`javascript\nconst x = 1;\n\`\`\`\n\n\`\`\`python\ndef hello():\n    print("world")\n\`\`\`\n\n\`\`\`json\n{"key": "value"}\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should only process Mermaid blocks, not other code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`javascript\nconst x = 1;\n\`\`\`\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`python\ndef hello():\n    pass\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));
	t.true(result.processedMarkdown.includes('```javascript'));
	t.true(result.processedMarkdown.includes('```python'));

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle markdown with mixed Mermaid and non-Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\nSome text.\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nCode example:\n\n\`\`\`typescript\ninterface User {\n  name: string;\n}\n\`\`\`\n\nAnother diagram:\n\n\`\`\`mermaid\ngantt\n    title Project Timeline\n    section Phase 1\n    Task 1: 2024-01-01, 30d\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 2);
	const imageMatches = result.processedMarkdown.match(/data:image\/png;base64,/g);
	t.is(imageMatches?.length, 2);
	t.true(result.processedMarkdown.includes('```typescript'));
	t.is(result.warnings.length, 0);

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle markdown with only regular code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Code Examples\n\n\`\`\`bash\nnpm install markpdf\n\`\`\`\n\n\`\`\`yaml\nname: markpdf\nversion: 1.0.0\n\`\`\`\n\nNo Mermaid here!`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('processCharts should process gitGraph diagram with capital G (Mermaid 10.x syntax)', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Git Graph Test\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

test('processCharts should process complex gitGraph with branches and merges', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Complex Git Graph\n\n\`\`\`mermaid\ngitGraph\n    commit id: "Initial"\n    commit id: "Feature A"\n    branch develop\n    checkout develop\n    commit id: "Dev Work 1"\n    commit id: "Dev Work 2"\n    checkout main\n    commit id: "Hotfix"\n    checkout develop\n    commit id: "Dev Work 3"\n    checkout main\n    merge develop\n    commit id: "Release"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('mermaid-chart-container'));

	// Cleanup
	await processor.cleanup(result.imageFiles);
});

// Additional tests for better coverage

test('cleanup should remove image files and attempt directory cleanup', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 1);

	// Verify file exists before cleanup
	const fileExistsBefore = await fs.access(result.imageFiles[0]!).then(() => true).catch(() => false);
	t.true(fileExistsBefore);

	// Cleanup
	await processor.cleanup(result.imageFiles);

	// Verify file is deleted after cleanup
	const fileExistsAfter = await fs.access(result.imageFiles[0]!).then(() => true).catch(() => false);
	t.false(fileExistsAfter);
});

test('cleanup should handle non-existent files gracefully', async (t) => {
	const processor = new MermaidProcessorService();

	// Should not throw when cleaning up non-existent files
	await t.notThrowsAsync(async () => {
		await processor.cleanup(['/non/existent/path/image.png']);
	});
});

test('cleanup should handle empty array', async (t) => {
	const processor = new MermaidProcessorService();

	await t.notThrowsAsync(async () => {
		await processor.cleanup([]);
	});
});

test('processCharts should detect horizontal flowchart (LR direction)', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Horizontal Flowchart\n\n\`\`\`mermaid\nflowchart LR\n    A --> B --> C --> D\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));

	await processor.cleanup(result.imageFiles);
});

test('processCharts should detect vertical flowchart (TD direction)', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Vertical Flowchart\n\n\`\`\`mermaid\nflowchart TD\n    A --> B\n    B --> C\n    C --> D\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));

	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle RL (right-to-left) flowchart', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Right-to-Left Flowchart\n\n\`\`\`mermaid\ngraph RL\n    A --> B --> C\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);

	await processor.cleanup(result.imageFiles);
});

test('processCharts should handle BT (bottom-to-top) flowchart', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Bottom-to-Top Flowchart\n\n\`\`\`mermaid\ngraph BT\n    A --> B\n    B --> C\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);

	await processor.cleanup(result.imageFiles);
});

test('processCharts should process class diagram', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Class Diagram\n\n\`\`\`mermaid\nclassDiagram\n    class Animal {\n        +String name\n        +move()\n    }\n    class Dog {\n        +bark()\n    }\n    Animal <|-- Dog\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	await processor.cleanup(result.imageFiles);
});

test('processCharts should process pie chart', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Pie Chart\n\n\`\`\`mermaid\npie title Market Share\n    "Product A" : 45\n    "Product B" : 30\n    "Product C" : 25\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	await processor.cleanup(result.imageFiles);
});

test('processCharts should respect custom timeout from config', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``;
	const config = createTestConfig({
		timeout: 60000, // 60 second timeout
	});
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, undefined, config);

	t.is(result.imageFiles.length, 1);
	t.is(result.warnings.length, 0);

	await processor.cleanup(result.imageFiles);
});

test('processCharts should respect custom resolution from config', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\``;
	const config = createTestConfig({
		resolution: 1, // Lower resolution
	});
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, undefined, config);

	t.is(result.imageFiles.length, 1);
	t.true(result.processedMarkdown.includes('data:image/png;base64,'));

	await processor.cleanup(result.imageFiles);
});
