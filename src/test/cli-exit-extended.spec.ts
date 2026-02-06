/**
 * Extended CLI Exit and Cleanup Tests
 * 
 * Additional comprehensive tests for CLI exit, cleanup, and edge cases.
 */

import test from 'ava';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CliService } from '../lib/cli/CliService.js';
import { OutputGeneratorService } from '../lib/services/OutputGeneratorService.js';
import { ServerService } from '../lib/services/ServerService.js';
import { defaultConfig } from '../lib/config.js';

// Helper to create a temporary markdown file
async function createTempMarkdown(content: string, filename?: string): Promise<string> {
	const tempDir = join(tmpdir(), 'pdfify-md-test-extended');
	await fs.mkdir(tempDir, { recursive: true });
	const filePath = join(tempDir, filename || `test-${Date.now()}.md`);
	await fs.writeFile(filePath, content, 'utf-8');
	return filePath;
}

// Helper to clean up temp file
async function cleanupTempFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
		const dir = join(filePath, '..');
		const files = await fs.readdir(dir);
		if (files.length === 0) {
			await fs.rmdir(dir).catch(() => {});
		}
	} catch {
		// Ignore cleanup errors
	}
}

// ============================================================================
// Multiple File Processing Tests
// ============================================================================

test('CliService should cleanup after processing multiple files', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile1 = await createTempMarkdown('# Test 1\n\nContent 1.');
	const testFile2 = await createTempMarkdown('# Test 2\n\nContent 2.');
	const outputFile1 = testFile1.replace('.md', '.pdf');
	const outputFile2 = testFile2.replace('.md', '.pdf');

	try {
		await cliService.run({ _: [testFile1, testFile2] } as any, defaultConfig);

		// Wait for cleanup
		await new Promise(resolve => setTimeout(resolve, 200));

		// Verify cleanup
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(serverService['server'], undefined);

		// Verify PDFs created
		await fs.access(outputFile1);
		await fs.access(outputFile2);
		t.pass('Multiple PDFs created successfully');
	} finally {
		await cleanupTempFile(testFile1);
		await cleanupTempFile(testFile2);
		await cleanupTempFile(outputFile1).catch(() => {});
		await cleanupTempFile(outputFile2).catch(() => {});
	}
});

test('CliService should cleanup even if one file fails', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile1 = await createTempMarkdown('# Test\n\nContent.');
	const outputFile1 = testFile1.replace('.md', '.pdf');

	try {
		// Process with one valid and one invalid file
		await t.throwsAsync(
			async () => {
				await cliService.run({ _: [testFile1, '/non/existent/file.md'] } as any, defaultConfig);
			},
			{ message: /Failed to process files/ },
		);

		// Wait for cleanup
		await new Promise(resolve => setTimeout(resolve, 200));

		// Cleanup should still have been called
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(serverService['server'], undefined);
	} finally {
		await cleanupTempFile(testFile1);
		await cleanupTempFile(outputFile1).catch(() => {});
	}
});

// ============================================================================
// Browser Lifecycle Tests
// ============================================================================

test('OutputGeneratorService should handle multiple closeBrowser calls', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const mockBrowser = {
		close: async () => {
			// Simulate close
		},
	} as any;

	outputGenerator['browserInstance'] = mockBrowser;

	// First close
	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	// Second close should not throw
	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	t.is(outputGenerator['browserInstance'], undefined);
});

test('OutputGeneratorService should handle closeBrowser when browser is null', async (t) => {
	const outputGenerator = new OutputGeneratorService();

	// Should not throw when browser is already undefined
	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	t.is(outputGenerator['browserInstance'], undefined);
});

test('OutputGeneratorService should handle closeBrowser when browserPromise is undefined', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const mockBrowser = {
		close: async () => {
			// Simulate close
		},
	} as any;

	outputGenerator['browserInstance'] = mockBrowser;
	outputGenerator['browserPromise'] = undefined;

	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	t.is(outputGenerator['browserInstance'], undefined);
});

// ============================================================================
// Server Lifecycle Tests
// ============================================================================

test('ServerService should handle multiple stop calls', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 3003, basedir: process.cwd() };

	await serverService.start(config);
	await serverService.stop();

	// Second stop should not throw
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});

	t.is(serverService['server'], undefined);
});

test('ServerService should handle stop when server is already undefined', async (t) => {
	const serverService = new ServerService();

	// Should not throw when server is already undefined
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});

	t.is(serverService['server'], undefined);
});

test('ServerService should handle stop when port is already undefined', async (t) => {
	const serverService = new ServerService();

	// Should not throw when port is already undefined
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});

	t.is(serverService.getPort(), undefined);
});

test('ServerService stop should clear port even if server close fails', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 3004, basedir: process.cwd() };

	await serverService.start(config);

	// Create a server that throws on close
	const errorServer = {
		close: (_callback?: () => void) => {
			throw new Error('Close failed');
		},
		closeAllConnections: (() => {}) as (() => void) | undefined,
	} as any;
	serverService['server'] = errorServer;

	// Stop should handle error and clear state
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});

	t.is(serverService['server'], undefined);
	t.is(serverService.getPort(), undefined);
});

// ============================================================================
// Cleanup Error Handling Tests
// ============================================================================

test('CliService cleanup should continue even if browser cleanup throws', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Create browser that throws
	outputGenerator['browserInstance'] = {
		close: async () => {
			throw new Error('Browser close failed');
		},
	} as any;

	// Create server that works
	const config = { ...defaultConfig, port: 3005, basedir: process.cwd() };
	await serverService.start(config);

	// Cleanup should handle browser error and still cleanup server
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});

	// Browser should be cleared
	t.is(outputGenerator['browserInstance'], undefined);
	// Server should still be cleaned up
	t.is(serverService['server'], undefined);
});

test('CliService cleanup should continue even if server cleanup throws', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Create browser that works
	outputGenerator['browserInstance'] = {
		close: async () => {
			// Success
		},
	} as any;

	// Create server that throws
	serverService['server'] = {
		close: (_callback?: () => void) => {
			throw new Error('Server close failed');
		},
		closeAllConnections: (() => {
			throw new Error('Close connections failed');
		}) as (() => void) | undefined,
	} as any;

	// Cleanup should handle server error and still cleanup browser
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});

	// Browser should be cleared
	t.is(outputGenerator['browserInstance'], undefined);
	// Server reference should be cleared
	t.is(serverService['server'], undefined);
});

test('CliService cleanup should handle both browser and server throwing', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Create browser that throws
	outputGenerator['browserInstance'] = {
		close: async () => {
			throw new Error('Browser close failed');
		},
	} as any;

	// Create server that throws
	serverService['server'] = {
		close: (_callback?: () => void) => {
			throw new Error('Server close failed');
		},
		closeAllConnections: (() => {
			throw new Error('Close connections failed');
		}) as (() => void) | undefined,
	} as any;

	// Cleanup should not throw even if both fail
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});

	// Both should be cleared
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);
});

// ============================================================================
// Resource Cleanup Tests
// ============================================================================

test('CliService should cleanup browser after HTML generation', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile = await createTempMarkdown('# Test\n\nContent.');
	const outputFile = testFile.replace('.md', '.html');

	try {
		await cliService.run({ _: [testFile], '--as-html': true } as any, defaultConfig);

		// Wait for cleanup
		await new Promise(resolve => setTimeout(resolve, 200));

		// Verify cleanup
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(serverService['server'], undefined);

		// Verify HTML created
		await fs.access(outputFile);
		t.pass('HTML created and cleanup completed');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

test('CliService should cleanup after processing file with Mermaid diagrams', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile = await createTempMarkdown(`# Test\n\n\`\`\`mermaid\ngraph TD\n    A --> B\n\`\`\`\n\nDone.`);
	const outputFile = testFile.replace('.md', '.pdf');

	try {
		await cliService.run({ _: [testFile] } as any, defaultConfig);

		// Wait for cleanup (Mermaid processing takes time)
		await new Promise(resolve => setTimeout(resolve, 500));

		// Verify cleanup
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(serverService['server'], undefined);

		// Verify PDF created
		await fs.access(outputFile);
		t.pass('PDF with Mermaid created and cleanup completed');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

// ============================================================================
// Process Exit Integration Tests
// ============================================================================

test('CLI process should exit after processing multiple files', async (t) => {
	const testFile1 = await createTempMarkdown('# Test 1\n\nContent 1.', 'test1.md');
	const testFile2 = await createTempMarkdown('# Test 2\n\nContent 2.', 'test2.md');
	const outputFile1 = testFile1.replace('.md', '.pdf');
	const outputFile2 = testFile2.replace('.md', '.pdf');

	try {
		await new Promise<void>((resolve, reject) => {
			const proc = spawn('node', ['dist/cli.js', testFile1, testFile2], {
				stdio: 'inherit',
			});

			let exited = false;
			proc.on('exit', (code) => {
				exited = true;
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});

			setTimeout(() => {
				if (!exited) {
					proc.kill();
					reject(new Error('Process did not exit within 30 seconds'));
				}
			}, 30000);
		});

		// Verify PDFs created
		await fs.access(outputFile1);
		await fs.access(outputFile2);
		t.pass('Multiple PDFs created and process exited');
	} finally {
		await cleanupTempFile(testFile1);
		await cleanupTempFile(testFile2);
		await cleanupTempFile(outputFile1).catch(() => {});
		await cleanupTempFile(outputFile2).catch(() => {});
	}
});

test('CLI process should exit after HTML generation', async (t) => {
	const testFile = await createTempMarkdown('# Test\n\nContent.');
	const outputFile = testFile.replace('.md', '.html');

	try {
		await new Promise<void>((resolve, reject) => {
			const proc = spawn('node', ['dist/cli.js', testFile, '--as-html'], {
				stdio: 'inherit',
			});

			let exited = false;
			proc.on('exit', (code) => {
				exited = true;
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});

			setTimeout(() => {
				if (!exited) {
					proc.kill();
					reject(new Error('Process did not exit within 30 seconds'));
				}
			}, 30000);
		});

		// Verify HTML created
		await fs.access(outputFile);
		t.pass('HTML created and process exited');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

// ============================================================================
// Concurrent Operations Tests
// ============================================================================

test('CliService should handle concurrent cleanup calls', async (t) => {
	const cliService = new CliService();

	// Start multiple cleanup calls concurrently
	const cleanupPromises = [
		cliService.cleanup(),
		cliService.cleanup(),
		cliService.cleanup(),
	];

	// All should complete without throwing
	await t.notThrowsAsync(async () => {
		await Promise.all(cleanupPromises);
	});

	t.pass('Concurrent cleanup calls handled correctly');
});

test('OutputGeneratorService should handle concurrent closeBrowser calls', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const mockBrowser = {
		close: async () => {
			await new Promise(resolve => setTimeout(resolve, 50));
		},
	} as any;

	outputGenerator['browserInstance'] = mockBrowser;

	// Start multiple close calls concurrently
	const closePromises = [
		outputGenerator.closeBrowser(),
		outputGenerator.closeBrowser(),
		outputGenerator.closeBrowser(),
	];

	// All should complete without throwing
	await t.notThrowsAsync(async () => {
		await Promise.all(closePromises);
	});

	t.is(outputGenerator['browserInstance'], undefined);
});

test('ServerService should handle concurrent stop calls', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 3006, basedir: process.cwd() };

	await serverService.start(config);

	// Start multiple stop calls concurrently
	const stopPromises = [
		serverService.stop(),
		serverService.stop(),
		serverService.stop(),
	];

	// All should complete without throwing
	await t.notThrowsAsync(async () => {
		await Promise.all(stopPromises);
	});

	t.is(serverService['server'], undefined);
});

// ============================================================================
// State Verification Tests
// ============================================================================

test('CliService should properly initialize and cleanup all resources', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile = await createTempMarkdown('# Test\n\nContent.');
	const outputFile = testFile.replace('.md', '.pdf');

	try {
		// Initial state
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(serverService['server'], undefined);

		// Process file
		await cliService.run({ _: [testFile] } as any, defaultConfig);

		// Wait for cleanup
		await new Promise(resolve => setTimeout(resolve, 200));

		// Final state - should be cleaned up
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(outputGenerator['browserPromise'] as any, undefined);
		t.is(serverService['server'], undefined);
		t.is(serverService.getPort(), undefined);

		t.pass('All resources properly initialized and cleaned up');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

// ============================================================================
// Error Recovery Tests
// ============================================================================

test('CliService should recover from errors and still cleanup', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Try to process non-existent file
	await t.throwsAsync(
		async () => {
			await cliService.run({ _: ['/non/existent/file.md'] } as any, defaultConfig);
		},
		{ message: /Failed to process files/ },
	);

	// Wait for cleanup
	await new Promise(resolve => setTimeout(resolve, 200));

	// Should still be cleaned up after error
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);

	t.pass('Recovered from error and cleaned up');
});

test('CliService should cleanup after help is shown', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Show help (doesn't start server/browser, but tests cleanup path)
	await cliService.run({ '--help': true } as any, defaultConfig);

	// Should not have started resources
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);

	t.pass('Cleanup after help');
});

test('CliService should cleanup after version is shown', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Show version (doesn't start server/browser, but tests cleanup path)
	await cliService.run({ '--version': true } as any, defaultConfig);

	// Should not have started resources
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);

	t.pass('Cleanup after version');
});

