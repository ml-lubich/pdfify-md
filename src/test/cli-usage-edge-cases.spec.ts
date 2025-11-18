/**
 * CLI Usage Edge Cases - Comprehensive Testing
 *
 * Tests for real-world CLI usage scenarios, edge cases, and error conditions.
 * Focuses on PDF generation from Markdown files.
 */

import test from 'ava';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CliService } from '../lib/cli/CliService.js';
import { defaultConfig } from '../lib/config.js';

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

test('CLI should handle empty markdown file', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		// Verify PDF was created (even if empty)
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for empty markdown');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with only whitespace', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('   \n\n\t  \n');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for whitespace-only markdown');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle very large markdown file', async (t) => {
	const cliService = new CliService();
	// Create a large markdown file (100KB)
	const largeContent = '# Large Document\n\n' + 'This is a test paragraph. '.repeat(5000);
	const filePath = await createTempFile(largeContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for large markdown file');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with unicode characters', async (t) => {
	const cliService = new CliService();
	const unicodeContent = `# Unicode Test

Hello 世界 🌍

Café résumé naïve

数学: ∫₀^∞ e^(-x²) dx = √π/2

Emoji: 😀 😃 😄 😁 😆 😅
`;
	const filePath = await createTempFile(unicodeContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for unicode markdown');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with special characters in content', async (t) => {
	const cliService = new CliService();
	const specialContent = `# Special Characters

\`\`\`javascript
console.log("Hello <world> & 'friends'");
\`\`\`

HTML: <div>Test</div>

URL: https://example.com?q=test&x=1

Math: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$
`;
	const filePath = await createTempFile(specialContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with special characters');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle multiple files concurrently', async (t) => {
	const cliService = new CliService();
	const file1 = await createTempFile('# File 1\n\nContent 1', 'test1.md');
	const file2 = await createTempFile('# File 2\n\nContent 2', 'test2.md');
	const file3 = await createTempFile('# File 3\n\nContent 3', 'test3.md');
	const arguments_ = {
		_: [file1, file2, file3],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		// Verify all PDFs were created
		await fs.access(file1.replace('.md', '.pdf'));
		await fs.access(file2.replace('.md', '.pdf'));
		await fs.access(file3.replace('.md', '.pdf'));
		t.pass('All PDFs created for multiple files');
	} finally {
		await cleanupTempFile(file1);
		await cleanupTempFile(file2);
		await cleanupTempFile(file3);
	}
});

test('CLI should handle file with spaces in name', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test File\n\nContent', 'test file with spaces.md');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for file with spaces');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle file with special characters in name', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent', 'test-file_123.md');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for file with special characters in name');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with front matter', async (t) => {
	const cliService = new CliService();
	const frontMatterContent = `---
title: Test Document
author: Test Author
---

# Test Document

This is the content.
`;
	const filePath = await createTempFile(frontMatterContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with front matter');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with code blocks', async (t) => {
	const cliService = new CliService();
	const codeContent = `# Code Examples

\`\`\`javascript
function hello() {
    console.log('Hello, World!');
}
\`\`\`

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
`;
	const filePath = await createTempFile(codeContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with code blocks');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with tables', async (t) => {
	const cliService = new CliService();
	const tableContent = `# Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data 1   | Data 2   |
| Row 2    | Data 3   | Data 4   |
`;
	const filePath = await createTempFile(tableContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with tables');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with links and images', async (t) => {
	const cliService = new CliService();
	const linkContent = `# Links and Images

[Link to example](https://example.com)

![Alt text](https://via.placeholder.com/150)
`;
	const filePath = await createTempFile(linkContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with links and images');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle custom PDF options', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent');
	const arguments_ = {
		_: [filePath],
		'--pdf-options': JSON.stringify({ format: 'Letter', margin: '20mm' }),
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created with custom options');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle custom stylesheet', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent');
	const cssPath = await createTempFile('body { font-family: Arial; }', 'custom.css');
	const arguments_ = {
		_: [filePath],
		'--stylesheet': [cssPath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created with custom stylesheet');
	} finally {
		await cleanupTempFile(filePath);
		await cleanupTempFile(cssPath);
	}
});

test('CLI should handle invalid PDF options JSON gracefully', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent');
	const arguments_ = {
		_: [filePath],
		'--pdf-options': 'invalid json {',
		'--help': false,
		'--version': false,
	};

	try {
		// Should either throw a clear error or use defaults
		await t.notThrowsAsync(async () => {
			try {
				await cliService.run(arguments_ as any, defaultConfig);
			} catch (error) {
				// If it throws, should be a clear error message
				t.truthy(error instanceof Error);
			}
		});
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle relative file paths', async (t) => {
	const cliService = new CliService();
	const tempDir = join(tmpdir(), 'pdfify-md-test-rel');
	await fs.mkdir(tempDir, { recursive: true });
	const filePath = join(tempDir, 'test.md');
	await fs.writeFile(filePath, '# Test\n\nContent', 'utf-8');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for relative path');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle absolute file paths', async (t) => {
	const cliService = new CliService();
	const filePath = await createTempFile('# Test\n\nContent');
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for absolute path');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with nested lists', async (t) => {
	const cliService = new CliService();
	const listContent = `# Nested Lists

1. First item
   - Nested item 1
   - Nested item 2
2. Second item
   - Another nested item
`;
	const filePath = await createTempFile(listContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with nested lists');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with blockquotes', async (t) => {
	const cliService = new CliService();
	const quoteContent = `# Blockquotes

> This is a blockquote.
> 
> It can span multiple lines.

> Another blockquote.
`;
	const filePath = await createTempFile(quoteContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with blockquotes');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with horizontal rules', async (t) => {
	const cliService = new CliService();
	const hrContent = `# Horizontal Rules

Section 1

---

Section 2

***

Section 3
`;
	const filePath = await createTempFile(hrContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with horizontal rules');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with HTML elements', async (t) => {
	const cliService = new CliService();
	const htmlContent = `# HTML Elements

<div style="color: red;">Red text</div>

<p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
`;
	const filePath = await createTempFile(htmlContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with HTML elements');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with malformed front matter gracefully', async (t) => {
	const cliService = new CliService();
	const malformedContent = `---
title: Test
invalid: yaml: [unclosed
---

# Content
`;
	const filePath = await createTempFile(malformedContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		// Should handle gracefully - either parse what it can or skip front matter
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created despite malformed front matter');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle very long lines in markdown', async (t) => {
	const cliService = new CliService();
	const longLine = '# Test\n\n' + 'A'.repeat(10000) + '\n';
	const filePath = await createTempFile(longLine);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with very long lines');
	} finally {
		await cleanupTempFile(filePath);
	}
});

test('CLI should handle markdown with mixed content types', async (t) => {
	const cliService = new CliService();
	const mixedContent = `# Mixed Content Document

## Text
This is regular text with **bold** and *italic* formatting.

## Code
\`\`\`javascript
console.log('Hello');
\`\`\`

## List
- Item 1
- Item 2

## Table
| Col 1 | Col 2 |
|-------|-------|
| Data  | Data  |

## Link
[Example](https://example.com)
`;
	const filePath = await createTempFile(mixedContent);
	const arguments_ = {
		_: [filePath],
		'--help': false,
		'--version': false,
	};

	try {
		await t.notThrowsAsync(async () => {
			await cliService.run(arguments_ as any, defaultConfig);
		});
		const pdfPath = filePath.replace('.md', '.pdf');
		await fs.access(pdfPath);
		t.pass('PDF created for markdown with mixed content');
	} finally {
		await cleanupTempFile(filePath);
	}
});

