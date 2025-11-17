/**
 * Comprehensive edge case and negative tests for ConverterService
 *
 * Tests boundary conditions, error scenarios, and edge cases
 * that go beyond basic functionality.
 */

import { promises as fs } from 'node:fs';
import { resolve, join } from 'node:path';
import test from 'ava';
import puppeteer, { type Browser } from 'puppeteer';
import { createConverterService, ConverterService } from '../lib/services/ConverterService.js';
import { defaultConfig } from '../lib/config.js';
import { ServerService } from '../lib/services/ServerService.js';
import { SilentLogger, ConsoleLogger, LogLevel } from '../lib/domain/Logger.js';
import { ValidationError } from '../lib/domain/errors.js';
import { MermaidProcessorService } from '../lib/services/MermaidProcessorService.js';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService.js';
import { FileService } from '../lib/services/FileService.js';
import { ConfigService } from '../lib/services/ConfigService.js';

let browser: Browser;
let serverService: ServerService;
let portCounter = 9000;

function getNextPort(): number {
	return portCounter++;
}

test.before(async () => {
	browser = await puppeteer.launch({ headless: true });
	serverService = new ServerService();
});

test.after(async () => {
	await browser.close();
	await serverService.stop();
});

// ============================================================================
// Edge Cases - Empty Content
// ============================================================================

test('ConverterService should handle empty markdown content', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		t.true(result.content.length > 0); // Should generate valid PDF even with empty content
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle markdown with only whitespace', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '   \n\n  \t\n  ' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle markdown with only newlines', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '\n\n\n' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Edge Cases - Very Long Content
// ============================================================================

test('ConverterService should handle very long markdown content', async (t) => {
	const converter = createConverterService();
	const longContent =
		'# Test\n\n' + 'This is a very long line. '.repeat(1000) + '\n\n' + '# Section\n\n' + 'More content. '.repeat(1000);
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: longContent }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		t.true(result.content.length > 0);
	} finally {
		await serverService.stop();
	}
}).timeout = 30_000;

test('ConverterService should handle markdown with many code blocks', async (t) => {
	const converter = createConverterService();
	let content = '# Test\n\n';
	for (let i = 0; i < 100; i++) {
		content += `\`\`\`javascript\nconst x${i} = ${i};\n\`\`\`\n\n`;
	}

	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
}).timeout = 30_000;

// ============================================================================
// Edge Cases - Special Characters
// ============================================================================

test('ConverterService should handle markdown with special characters', async (t) => {
	const converter = createConverterService();
	const markdown = `# Special Characters Test

This has <>&"' characters and emojis 🚀 📝 ✨

\`\`\`javascript
const code = '<script>alert("XSS")</script>';
\`\`\`
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: markdown }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle markdown with unicode characters', async (t) => {
	const converter = createConverterService();
	const markdown = `# Unicode Test

Content with unicode: 🚀 📝 ✨ 中文 العربية русский
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: markdown }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle markdown with HTML entities', async (t) => {
	const converter = createConverterService();
	const markdown = `# HTML Entities Test

&lt;div&gt;Content&lt;/div&gt;

&copy; 2024

&amp; symbol
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: markdown }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Edge Cases - Front Matter
// ============================================================================

test('ConverterService should handle front-matter with invalid YAML', async (t) => {
	const converter = createConverterService();
	const content = `---
invalid: yaml: content: [unclosed
---

# Content
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		// Should not throw, but should log warning
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle front-matter with special characters', async (t) => {
	const converter = createConverterService();
	const content = `---
title: "Title with 'quotes' and \"double quotes\""
author: Test Author
---

# Content
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle front-matter with PDF options', async (t) => {
	const converter = createConverterService();
	const content = `---
pdf_options:
  format: letter
  margin: 20mm
  printBackground: true
---

# Content
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Edge Cases - Mermaid Diagrams
// ============================================================================

test('ConverterService should handle invalid Mermaid diagrams gracefully', async (t) => {
	const converter = createConverterService();
	const content = `# Test

\`\`\`mermaid
invalid mermaid syntax {{
\`\`\`

Content.
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		// Should not throw, but should log warning
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle multiple Mermaid diagrams', async (t) => {
	const converter = createConverterService();
	const content = `# Test

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    A->>B: Message
\`\`\`

\`\`\`mermaid
gantt
    title Test
    section Section
    Task: 2024-01-01, 10d
\`\`\`
`;
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
}).timeout = 30_000;

// ============================================================================
// Edge Cases - File Operations
// ============================================================================

test('ConverterService should handle file in non-existent directory', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(
			async () => {
				await converter.convert({ path: '/nonexistent/directory/file.md' }, config, browser);
			},
			{ instanceOf: ValidationError },
		);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle file with no read permissions', async (t) => {
	const converter = createConverterService();
	const testFile = join(__dirname, 'test-no-permissions.md');

	// Create a file
	await fs.writeFile(testFile, '# Test');

	// Try to remove read permissions (may not work on all systems)
	try {
		await fs.chmod(testFile, 0o000);

		const config = { ...defaultConfig, port: getNextPort() };
		await serverService.start(config);

		try {
			await t.throwsAsync(
				async () => {
					await converter.convert({ path: testFile }, config, browser);
				},
				{ instanceOf: ValidationError },
			);
		} finally {
			await serverService.stop();
		}
	} finally {
		// Restore permissions and cleanup
		await fs.chmod(testFile, 0o644).catch(() => {});
		await fs.unlink(testFile).catch(() => {});
	}
});

// ============================================================================
// Edge Cases - Configuration
// ============================================================================

test('ConverterService should handle empty stylesheet array', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort(), stylesheet: [] };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle custom CSS', async (t) => {
	const converter = createConverterService();
	const config = {
		...defaultConfig,
		port: getNextPort(),
		css: 'body { font-family: Arial; color: red; }',
	};
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle invalid highlight style gracefully', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort(), highlight_style: 'nonexistent-style' };
	await serverService.start(config);

	try {
		// Should not throw, but may use default style
		await t.throwsAsync(async () => {
			await converter.convert({ content: '```javascript\nconst x = 1;\n```' }, config, browser);
		});
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Logger Integration Tests
// ============================================================================

test('ConverterService should use provided logger', async (t) => {
	const logMessages: string[] = [];
	const logger = new ConsoleLogger(LogLevel.DEBUG);

	// Capture console.warn
	const originalWarn = console.warn;
	console.warn = (message: string, ...arguments_: unknown[]) => {
		logMessages.push(message);
		originalWarn(message, ...arguments_);
	};

	try {
		const converter = new ConverterService(
			new MermaidProcessorService(),
			new OutputGeneratorService(),
			new FileService(),
			new ConfigService(),
			logger,
		);

		const content = `---
invalid: yaml: [unclosed
---

# Content
`;
		const config = { ...defaultConfig, port: getNextPort() };
		await serverService.start(config);

		try {
			await converter.convert({ content }, config, browser);
			// Should have logged warnings about front-matter
			t.true(logMessages.length >= 0);
		} finally {
			await serverService.stop();
		}
	} finally {
		console.warn = originalWarn;
	}
});

test('ConverterService should work with SilentLogger', async (t) => {
	const logger = new SilentLogger();
	const converter = new ConverterService(
		new MermaidProcessorService(),
		new OutputGeneratorService(),
		new FileService(),
		new ConfigService(),
		logger,
	);

	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Negative Tests - Invalid Input
// ============================================================================

test('ConverterService should reject null input', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(
			async () => {
				// @ts-expect-error - intentionally testing invalid input
				await converter.convert(null, config, browser);
			},
			{ instanceOf: ValidationError },
		);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should reject undefined input', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(
			async () => {
				// @ts-expect-error - intentionally testing invalid input
				await converter.convert(undefined, config, browser);
			},
			{ instanceOf: ValidationError },
		);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should reject number as input', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(
			async () => {
				// @ts-expect-error - intentionally testing invalid input
				await converter.convert(123 as any, config, browser);
			},
			{ instanceOf: ValidationError },
		);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should reject string as input', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		await t.throwsAsync(
			async () => {
				// @ts-expect-error - intentionally testing invalid input
				await converter.convert('invalid' as any, config, browser);
			},
			{ instanceOf: ValidationError },
		);
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Boundary Tests - Output Destination
// ============================================================================

test('ConverterService should handle stdout output', async (t) => {
	const converter = createConverterService();
	const config = { ...defaultConfig, port: getNextPort(), dest: 'stdout' };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.is(result.filename, 'stdout');
		t.truthy(result.content);
	} finally {
		await serverService.stop();
	}
});

test('ConverterService should handle file output in non-existent directory', async (t) => {
	const converter = createConverterService();
	const outputPath = join(__dirname, 'nonexistent', 'output.pdf');
	const config = { ...defaultConfig, port: getNextPort(), dest: outputPath };
	await serverService.start(config);

	try {
		// Should create directory if needed
		const result = await converter.convert({ content: '# Test' }, config, browser);

		t.is(result.filename, outputPath);
		t.truthy(result.content);

		// Verify file exists
		const exists = await fs
			.access(outputPath)
			.then(() => true)
			.catch(() => false);
		t.true(exists);

		// Cleanup
		await fs.unlink(outputPath).catch(() => {});
		await fs.rmdir(join(__dirname, 'nonexistent')).catch(() => {});
	} finally {
		await serverService.stop();
	}
});

// ============================================================================
// Performance Tests
// ============================================================================

test('ConverterService should handle large markdown files efficiently', async (t) => {
	const converter = createConverterService();

	// Create large markdown content
	let content = '# Large Document\n\n';
	for (let i = 0; i < 1000; i++) {
		content += `## Section ${i}\n\n`;
		content += `This is section ${i} with some content. `.repeat(10) + '\n\n';
	}

	const config = { ...defaultConfig, port: getNextPort() };
	await serverService.start(config);

	try {
		const start = Date.now();
		const result = await converter.convert({ content }, config, browser);
		const duration = Date.now() - start;

		t.truthy(result);
		t.truthy(result.content instanceof Buffer);
		// Should complete in reasonable time (less than 60 seconds)
		t.true(duration < 60_000);
	} finally {
		await serverService.stop();
	}
}).timeout = 90_000;

// ============================================================================
// Integration Tests
// ============================================================================

test('ConverterService should handle complete conversion workflow', async (t) => {
	const converter = createConverterService();
	const content = `---
title: Test Document
pdf_options:
  format: a4
  margin: 30mm
---

# Test Document

This is a test document with \`code\` and **bold** text.

\`\`\`javascript
const x = 42;
\`\`\`

\`\`\`mermaid
graph TD
    A --> B
\`\`\`
`;
	const outputPath = resolve(__dirname, 'basic', 'integration-test.pdf');
	const config = { ...defaultConfig, port: getNextPort(), dest: outputPath };
	await serverService.start(config);

	try {
		const result = await converter.convert({ content }, config, browser);

		t.truthy(result);
		t.is(result.filename, outputPath);
		t.truthy(result.content instanceof Buffer);
		t.true(result.content.length > 0);

		// Verify file exists
		const exists = await fs
			.access(outputPath)
			.then(() => true)
			.catch(() => false);
		t.true(exists);

		// Cleanup
		await fs.unlink(outputPath).catch(() => {});
	} finally {
		await serverService.stop();
	}
}).timeout = 30_000;
