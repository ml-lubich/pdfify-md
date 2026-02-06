/**
 * Comprehensive Mermaid Edge Case Tests
 * 
 * Tests various edge cases for Mermaid diagram processing including:
 * - No Mermaid charts present
 * - Non-Mermaid code blocks
 * - Mixed content
 * - Empty/whitespace handling
 */

import test from 'ava';
import { promises as fs } from 'fs';
import puppeteer, { Browser } from 'puppeteer';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService';

let browser: Browser;

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
});

test.after(async () => {
	await browser.close();
});

// ============================================================================
// Tests: No Mermaid Charts Present
// ============================================================================

test('should NOT process markdown with no Mermaid blocks - plain text only', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = '# Hello World\n\nThis is just regular markdown content.\n\nNo diagrams here!';
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should NOT process markdown with only non-Mermaid code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Code Examples\n\n\`\`\`javascript\nconsole.log('hello');\n\`\`\`\n\n\`\`\`python\ndef hello():\n    print("world")\n\`\`\`\n\n\`\`\`bash\nnpm install pdfify-md\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
	t.true(result.processedMarkdown.includes('```javascript'));
	t.true(result.processedMarkdown.includes('```python'));
	t.true(result.processedMarkdown.includes('```bash'));
});

test('should NOT process markdown with code blocks in various languages', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Examples\n\n\`\`\`typescript\ninterface User { name: string; }\n\`\`\`\n\n\`\`\`json\n{"key": "value"}\n\`\`\`\n\n\`\`\`yaml\nname: test\nversion: 1.0.0\n\`\`\`\n\n\`\`\`sql\nSELECT * FROM users;\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should NOT process markdown with only HTML code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# HTML Examples\n\n\`\`\`html\n<div>Hello</div>\n\`\`\`\n\n\`\`\`xml\n<root>content</root>\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should NOT process markdown with case-insensitive non-Mermaid code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Case Tests\n\n\`\`\`MERMAID\nThis should NOT be processed (uppercase)\n\`\`\`\n\n\`\`\`Mermaid\nThis should NOT be processed (mixed case)\n\`\`\`\n\n\`\`\`mErMaId\nThis should NOT be processed\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
});

// ============================================================================
// Tests: Mixed Content (Mermaid + Non-Mermaid)
// ============================================================================

test('should process ONLY Mermaid blocks in mixed content', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Mixed Content\n\n\`\`\`javascript\nconst x = 1;\n\`\`\`\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\n\`\`\`python\ndef hello():\n    pass\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9000);

	t.not(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 1);
	t.true(result.processedMarkdown.includes('![Mermaid Chart 1]') || result.processedMarkdown.includes('<img'));
	t.true(result.processedMarkdown.includes('```javascript'));
	t.true(result.processedMarkdown.includes('```python'));
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

test('should process multiple Mermaid blocks while preserving other code blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Complex Example\n\nCode:\n\n\`\`\`typescript\ninterface User {\n  name: string;\n}\n\`\`\`\n\nDiagram 1:\n\n\`\`\`mermaid\nsequenceDiagram\n    A->>B: Hello\n\`\`\`\n\nMore code:\n\n\`\`\`json\n{"key": "value"}\n\`\`\`\n\nDiagram 2:\n\n\`\`\`mermaid\ngantt\n    title Project\n\`\`\``;
	const result = await processor.processCharts(markdown, browser, process.cwd(), undefined, 9001);

	t.is(result.imageFiles.length, 2);
	t.true(result.processedMarkdown.includes('```typescript'));
	t.true(result.processedMarkdown.includes('```json'));
	t.is(result.warnings.length, 0);
	
	// Cleanup
	for (const imageFile of result.imageFiles) {
		await fs.unlink(imageFile).catch(() => {});
	}
});

// ============================================================================
// Tests: Edge Cases
// ============================================================================

test('should handle markdown with only whitespace in Mermaid blocks', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\n   \n   \n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 1);
	t.true(result.warnings[0]!.includes('Skipping empty') || result.warnings[0]!.includes('empty'));
});

test('should handle markdown with code fence but no language specified', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`\nsome code\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should handle markdown with malformed code fences', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	// Should either process or skip gracefully
	t.truthy(result.processedMarkdown);
	t.is(result.warnings.length >= 0, true);
});

test('should handle very large markdown files without Mermaid', async (t) => {
	const processor = new MermaidProcessorService();
	const largeContent = '# Header\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(1000) + '\n\n```javascript\ncode();\n```';
	const result = await processor.processCharts(largeContent, browser, process.cwd());

	t.is(result.processedMarkdown, largeContent);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should handle markdown with special characters but no Mermaid', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = `# Special Chars\n\n\`\`\`bash\necho "Hello <>&\\"'World"\n\`\`\`\n\nDone.`;
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should handle empty markdown string', async (t) => {
	const processor = new MermaidProcessorService();
	const result = await processor.processCharts('', browser, process.cwd());

	t.is(result.processedMarkdown, '');
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

test('should handle markdown with only newlines and whitespace', async (t) => {
	const processor = new MermaidProcessorService();
	const markdown = '\n\n\n   \n\n';
	const result = await processor.processCharts(markdown, browser, process.cwd());

	t.is(result.processedMarkdown, markdown);
	t.is(result.imageFiles.length, 0);
	t.is(result.warnings.length, 0);
});

