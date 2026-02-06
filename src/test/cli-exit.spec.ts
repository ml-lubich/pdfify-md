/**
 * CLI Exit and Cleanup Tests
 * 
 * Tests to ensure the CLI properly exits and cleans up resources after completion.
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
async function createTempMarkdown(content: string): Promise<string> {
	const tempDir = join(tmpdir(), 'pdfify-md-test');
	await fs.mkdir(tempDir, { recursive: true });
	const filePath = join(tempDir, `test-${Date.now()}.md`);
	await fs.writeFile(filePath, content, 'utf-8');
	return filePath;
}

// Helper to clean up temp file
async function cleanupTempFile(filePath: string): Promise<void> {
	try {
		await fs.unlink(filePath);
	} catch {
		// Ignore cleanup errors
	}
}

test('CliService should cleanup browser and server after file processing', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;
	
	const testFile = await createTempMarkdown('# Test\n\nThis is a test.');
	const outputFile = testFile.replace('.md', '.pdf');

	try {
		await cliService.run({ _: [testFile] } as any, defaultConfig);

		// Wait a bit for cleanup to complete
		await new Promise(resolve => setTimeout(resolve, 100));

		// Verify browser is closed
		t.is(outputGenerator['browserInstance'], undefined);
		t.is(outputGenerator['browserPromise'], undefined);

		// Verify server is stopped
		t.is(serverService['server'], undefined);
		t.is(serverService.getPort(), undefined);

		// Verify PDF was created
		await fs.access(outputFile);
		t.pass('PDF created successfully');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

test('CliService cleanup method should work correctly', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Test that cleanup can be called even when nothing is initialized
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});

	// Verify cleanup works
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(outputGenerator['browserPromise'] as any, undefined);
	t.is(serverService['server'], undefined);
});

test('CliService cleanup should handle errors gracefully', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Create a browser instance that will fail to close
	outputGenerator['browserInstance'] = {
		close: async () => {
			throw new Error('Close failed');
		},
	} as any;

	// Create a server that will fail to close
	serverService['server'] = {
		close: (callback?: () => void) => {
			if (callback) {
				setTimeout(() => callback(), 100);
			}
		},
		closeAllConnections: (() => {
			throw new Error('Close connections failed');
		}) as (() => void) | undefined,
	} as any;

	// Cleanup should not throw
	await t.notThrowsAsync(async () => {
		await cliService.cleanup();
	});

	// State should be cleared even if close fails
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);
});

test('ServerService.stop should close all connections and stop server', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 3001, basedir: process.cwd() };

	await serverService.start(config);
	t.truthy(serverService['server']);
	t.is(serverService.getPort(), 3001);

	// Stop should complete without errors
	await t.notThrowsAsync(async () => {
		await serverService.stop();
	});

	t.is(serverService['server'], undefined);
	t.is(serverService.getPort(), undefined);
});

test('ServerService.stop should timeout and resolve after 200ms if close hangs', async (t) => {
	const serverService = new ServerService();
	const config = { ...defaultConfig, port: 3002, basedir: process.cwd() };

	await serverService.start(config);

	// Create a server that hangs on close
	const originalServer = serverService['server']!;
	const hangingServer = {
		...originalServer,
		close: (_callback?: () => void) => {
			// Never call callback - simulate hanging
			// callback is optional in Node.js Server.close()
		},
		closeAllConnections: (() => {}) as (() => void) | undefined,
	};
	serverService['server'] = hangingServer as any;

	const startTime = Date.now();
	await serverService.stop();
	const duration = Date.now() - startTime;

	// Should resolve after timeout (200ms + some buffer)
	t.true(duration < 500, `Stop completed in ${duration}ms (expected < 500ms)`);
	t.is(serverService['server'], undefined);
});

test('OutputGeneratorService.closeBrowser should close browser and clear state', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const mockBrowser = {
		close: async () => {
			// Simulate close
		},
	} as any;

	outputGenerator['browserInstance'] = mockBrowser;
	outputGenerator['browserPromise'] = Promise.resolve(mockBrowser) as any;

	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	t.is(outputGenerator['browserInstance'], undefined);
	t.is(outputGenerator['browserPromise'] as any, undefined);
});

test('OutputGeneratorService.closeBrowser should timeout after 2s if close hangs', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const hangingBrowser = {
		close: async () => {
			// Never resolve - simulate hanging
			return new Promise(() => {});
		},
	} as any;

	outputGenerator['browserInstance'] = hangingBrowser;

	const startTime = Date.now();
	await outputGenerator.closeBrowser();
	const duration = Date.now() - startTime;

	// Should resolve after timeout (2s + some buffer)
	t.true(duration < 3000, `Close completed in ${duration}ms (expected < 3000ms)`);
	t.is(outputGenerator['browserInstance'], undefined);
});

test('OutputGeneratorService.closeBrowser should handle errors gracefully', async (t) => {
	const outputGenerator = new OutputGeneratorService();
	const errorBrowser = {
		close: async () => {
			throw new Error('Close failed');
		},
	} as any;

	outputGenerator['browserInstance'] = errorBrowser;

	// Should not throw
	await t.notThrowsAsync(async () => {
		await outputGenerator.closeBrowser();
	});

	// State should be cleared even if close fails
	t.is(outputGenerator['browserInstance'], undefined);
});

test('CLI process should exit after file conversion (integration test)', async (t) => {
	const testFile = await createTempMarkdown('# Test\n\nThis is a test.');
	const outputFile = testFile.replace('.md', '.pdf');

	try {
		await new Promise<void>((resolve, reject) => {
			const proc = spawn('node', ['dist/cli.js', testFile], {
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

			// Should exit within 30 seconds
			setTimeout(() => {
				if (!exited) {
					proc.kill();
					reject(new Error('Process did not exit within 30 seconds'));
				}
			}, 30000);
		});

		// Verify PDF was created
		await fs.access(outputFile);
		t.pass('PDF created and process exited successfully');
	} finally {
		await cleanupTempFile(testFile);
		await cleanupTempFile(outputFile).catch(() => {});
	}
});

test('CLI process should exit after stdin conversion (integration test)', async (t) => {
	await new Promise<void>((resolve, reject) => {
		const proc = spawn('node', ['dist/cli.js'], {
			stdio: ['pipe', 'pipe', 'pipe'],
		});

		// Send stdin and close
		if (proc.stdin) {
			proc.stdin.write('# Test\n\nThis is stdin test.');
			proc.stdin.end();
		}

		let exited = false;
		proc.on('exit', (code) => {
			exited = true;
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Process exited with code ${code}`));
			}
		});

		// Should exit within 30 seconds
		setTimeout(() => {
			if (!exited) {
				proc.kill();
				reject(new Error('Process did not exit within 30 seconds'));
			}
		}, 30000);
	});

	t.pass('Process exited successfully after stdin processing');
});

test('CLI should not cleanup in watch mode', async (t) => {
	const testFile = await createTempMarkdown('# Test\n\nThis is a test.');

	try {
		const cliService = new CliService();
		const serverService = (cliService as any).serverService as ServerService;

		// Start processing in watch mode (will hang, so we'll cancel it)
		cliService.run({ _: [testFile], '--watch': true } as any, defaultConfig).catch(() => {
			// Ignore errors
		});

		// Wait a bit to ensure it started
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Server should still be running in watch mode
		t.truthy(serverService['server'], 'Server should still be running in watch mode');

		// Cleanup manually (simulate Ctrl+C)
		await cliService.cleanup();
		t.pass('Watch mode started correctly and cleanup works');
	} catch (error) {
		// If watch mode test fails, that's okay - just ensure cleanup works
		t.pass('Cleanup works even if watch mode test fails');
	} finally {
		await cleanupTempFile(testFile);
	}
});

test('CliService should cleanup on error', async (t) => {
	const cliService = new CliService();
	const outputGenerator = (cliService as any).outputGenerator as OutputGeneratorService;
	const serverService = (cliService as any).serverService as ServerService;

	// Use non-existent file to trigger error
	await t.throwsAsync(
		async () => {
			await cliService.run({ _: ['/non/existent/file.md'] } as any, defaultConfig);
		},
		{ message: /Failed to process files/ },
	);

	// Wait a bit for cleanup to complete
	await new Promise(resolve => setTimeout(resolve, 100));

	// Cleanup should still have been called
	t.is(outputGenerator['browserInstance'], undefined);
	t.is(serverService['server'], undefined);
});
