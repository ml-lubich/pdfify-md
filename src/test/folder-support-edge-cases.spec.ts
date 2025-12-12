/**
 * Edge case tests for folder support functionality.
 * Tests various boundary conditions and error scenarios.
 */

import test from 'ava';
import { getMarkdownFiles } from '../lib/utils/file.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { tmpdir } from 'os';

// Helper to create temporary test directory
const createTempDir = async (name: string): Promise<string> => {
    const dir = path.join(tmpdir(), `pdfify-test-${name}-${Date.now()}`);
    await fs.mkdir(dir, { recursive: true });
    return dir;
};

// Helper to cleanup temp directory
const cleanup = async (dir: string): Promise<void> => {
    try {
        await fs.rm(dir, { recursive: true, force: true });
    } catch {
        // Ignore cleanup errors
    }
};

// ============================================================================
// Empty Directory Tests
// ============================================================================

test('getMarkdownFiles should return empty array for empty directory', async (t) => {
    const dir = await createTempDir('empty');
    try {
        const files = await getMarkdownFiles(dir);
        t.deepEqual(files, []);
    } finally {
        await cleanup(dir);
    }
});

test('getMarkdownFiles should return empty array for directory with no md files', async (t) => {
    const dir = await createTempDir('non-md');
    try {
        await fs.writeFile(path.join(dir, 'file.txt'), 'content');
        await fs.writeFile(path.join(dir, 'file.json'), '{}');
        const files = await getMarkdownFiles(dir);
        t.deepEqual(files, []);
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Nested Directory Tests
// ============================================================================

test('getMarkdownFiles should handle deeply nested directories', async (t) => {
    const dir = await createTempDir('deep');
    try {
        // Create 10 levels deep
        let currentPath = dir;
        for (let i = 0; i < 10; i++) {
            currentPath = path.join(currentPath, `level${i}`);
            await fs.mkdir(currentPath);
        }
        await fs.writeFile(path.join(currentPath, 'deep.md'), '# Deep');

        const files = await getMarkdownFiles(dir);
        t.is(files.length, 1);
        t.true(files[0].endsWith('deep.md'));
    } finally {
        await cleanup(dir);
    }
});

test('getMarkdownFiles should collect files from multiple subdirectories', async (t) => {
    const dir = await createTempDir('multi');
    try {
        await fs.mkdir(path.join(dir, 'sub1'));
        await fs.mkdir(path.join(dir, 'sub2'));
        await fs.mkdir(path.join(dir, 'sub2', 'sub2a'));

        await fs.writeFile(path.join(dir, 'root.md'), '# Root');
        await fs.writeFile(path.join(dir, 'sub1', 'file1.md'), '# File 1');
        await fs.writeFile(path.join(dir, 'sub2', 'file2.md'), '# File 2');
        await fs.writeFile(path.join(dir, 'sub2', 'sub2a', 'file3.md'), '# File 3');

        const files = await getMarkdownFiles(dir);
        t.is(files.length, 4);
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Mixed Content Tests
// ============================================================================

test('getMarkdownFiles should filter out non-markdown files', async (t) => {
    const dir = await createTempDir('mixed');
    try {
        await fs.writeFile(path.join(dir, 'file.md'), '# MD');
        await fs.writeFile(path.join(dir, 'file.markdown'), '# Markdown');
        await fs.writeFile(path.join(dir, 'file.txt'), 'Text');
        await fs.writeFile(path.join(dir, 'file.html'), '<html>');
        await fs.writeFile(path.join(dir, 'file.pdf'), 'PDF');

        const files = await getMarkdownFiles(dir);
        t.is(files.length, 2);
        t.true(files.some(f => f.endsWith('.md')));
        t.true(files.some(f => f.endsWith('.markdown')));
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Error Handling Tests
// ============================================================================

test('getMarkdownFiles should return empty array for non-existent path', async (t) => {
    const files = await getMarkdownFiles('/nonexistent/path/to/nowhere');
    t.deepEqual(files, []);
});

test('getMarkdownFiles should handle permission denied gracefully', async (t) => {
    // Skip on Windows or if running as root
    if (process.platform === 'win32' || process.getuid?.() === 0) {
        t.pass('Skipping permission test on Windows or root');
        return;
    }

    const dir = await createTempDir('perms');
    try {
        await fs.chmod(dir, 0o000); // Remove all permissions
        const files = await getMarkdownFiles(dir);
        // Should handle gracefully by returning empty array
        t.true(Array.isArray(files));
    } finally {
        // Restore permissions before cleanup
        await fs.chmod(dir, 0o755);
        await cleanup(dir);
    }
});

// ============================================================================
// Edge Case: Special Characters
// ============================================================================

test('getMarkdownFiles should handle directories with special characters', async (t) => {
    const dir = await createTempDir('special chars & symbols');
    try {
        await fs.writeFile(path.join(dir, 'file with spaces.md'), '# Spaces');
        const files = await getMarkdownFiles(dir);
        t.is(files.length, 1);
        t.true(files[0].includes('file with spaces.md'));
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Performance Edge Case: Many Files
// ============================================================================

test('getMarkdownFiles should handle directory with many files efficiently', async (t) => {
    const dir = await createTempDir('many');
    try {
        // Create 100 markdown files
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(fs.writeFile(path.join(dir, `file${i}.md`), `# File ${i}`));
        }
        await Promise.all(promises);

        const start = Date.now();
        const files = await getMarkdownFiles(dir);
        const duration = Date.now() - start;

        t.is(files.length, 100);
        // Should complete in reasonable time (< 1 second for 100 files)
        t.true(duration < 1000, `Took ${duration}ms, should be under 1000ms`);
    } finally {
        await cleanup(dir);
    }
});
