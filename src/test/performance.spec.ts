/**
 * Performance tests for PDF generation.
 * Ensures reasonable performance for common use cases.
 */

import test from 'ava';
import { promises as fs } from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import { convertMdToPdf } from '../lib/core/converter.js';
import { defaultConfig } from '../lib/config.js';

// Helper to create temporary test directory
const createTempDir = async (name: string): Promise<string> => {
    const dir = path.join(tmpdir(), `pdfify-perf-${name}-${Date.now()}`);
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
// Large File Processing
// ============================================================================

test('should process large markdown file (100KB) in reasonable time', async (t) => {
    const dir = await createTempDir('large');
    try {
        // Create ~100KB markdown file
        const content = '# Large File\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(3500);
        const inputPath = path.join(dir, 'large.md');
        const outputPath = path.join(dir, 'large.pdf');
        await fs.writeFile(inputPath, content);

        const start = Date.now();
        await convertMdToPdf({ path: inputPath }, { dest: outputPath, ...defaultConfig });
        const duration = Date.now() - start;

        // Should complete in under 10 seconds
        t.true(duration < 10000, `Took ${duration}ms, should be under 10000ms`);

        // Verify PDF was created
        const stats = await fs.stat(outputPath);
        t.true(stats.size > 0);
    } finally {
        await cleanup(dir);
    }
});

test('should process markdown with large table in reasonable time', async (t) => {
    const dir = await createTempDir('table');
    try {
        // Create table with 50 rows
        const rows = Array.from({ length: 50 }, (_, i) =>
            `| Row ${i} | Value ${i} | Data ${i} | Info ${i} |`
        ).join('\n');
        const content = `# Large Table\n\n| Header 1 | Header 2 | Header 3 | Header 4 |\n|---|---|---|---|\n${rows}`;

        const inputPath = path.join(dir, 'table.md');
        const outputPath = path.join(dir, 'table.pdf');
        await fs.writeFile(inputPath, content);

        const start = Date.now();
        await convertMdToPdf({ path: inputPath }, { dest: outputPath, ...defaultConfig });
        const duration = Date.now() - start;

        // Should complete in under 10 seconds
        t.true(duration < 10000, `Took ${duration}ms, should be under 10000ms`);

        const stats = await fs.stat(outputPath);
        t.true(stats.size > 0);
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Memory Usage
// ============================================================================

test('should handle multiple small files without excessive memory growth', async (t) => {
    const dir = await createTempDir('memory');
    try {
        const memBefore = process.memoryUsage().heapUsed;

        // Process 10 small files sequentially
        for (let i = 0; i < 10; i++) {
            const inputPath = path.join(dir, `file${i}.md`);
            const outputPath = path.join(dir, `file${i}.pdf`);
            await fs.writeFile(inputPath, `# File ${i}\n\nContent for file ${i}`);
            await convertMdToPdf({ path: inputPath }, { dest: outputPath, ...defaultConfig });
        }

        const memAfter = process.memoryUsage().heapUsed;
        const memGrowth = memAfter - memBefore;

        // Memory growth should be reasonable (< 100MB for 10 small files)
        const memGrowthMB = memGrowth / (1024 * 1024);
        t.true(memGrowthMB < 100, `Memory grew by ${memGrowthMB.toFixed(2)}MB, should be under 100MB`);
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Code Block Performance
// ============================================================================

test('should process markdown with many code blocks efficiently', async (t) => {
    const dir = await createTempDir('code');
    try {
        // Create 20 code blocks
        const codeBlocks = Array.from({ length: 20 }, (_, i) =>
            `\`\`\`typescript\nfunction example${i}() {\n  return ${i};\n}\n\`\`\``
        ).join('\n\n');
        const content = `# Code Heavy Document\n\n${codeBlocks}`;

        const inputPath = path.join(dir, 'code.md');
        const outputPath = path.join(dir, 'code.pdf');
        await fs.writeFile(inputPath, content);

        const start = Date.now();
        await convertMdToPdf({ path: inputPath }, { dest: outputPath, ...defaultConfig });
        const duration = Date.now() - start;

        // Should complete in under 10 seconds
        t.true(duration < 10000, `Took ${duration}ms, should be under 10000ms`);

        const stats = await fs.stat(outputPath);
        t.true(stats.size > 0);
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Throughput Test
// ============================================================================

test('should maintain reasonable throughput for batch processing', async (t) => {
    const dir = await createTempDir('batch');
    try {
        const fileCount = 5;
        const files: Array<{ input: string; output: string }> = [];

        // Create test files
        for (let i = 0; i < fileCount; i++) {
            const inputPath = path.join(dir, `batch${i}.md`);
            const outputPath = path.join(dir, `batch${i}.pdf`);
            await fs.writeFile(inputPath, `# Batch File ${i}\n\n${'Content paragraph. '.repeat(50)}`);
            files.push({ input: inputPath, output: outputPath });
        }

        const start = Date.now();
        // Process sequentially to measure total time
        for (const file of files) {
            await convertMdToPdf({ path: file.input }, { dest: file.output, ...defaultConfig });
        }
        const duration = Date.now() - start;

        // Average should be reasonable (< 10 seconds per file)
        const avgDuration = duration / fileCount;
        t.true(avgDuration < 10000, `Average ${avgDuration.toFixed(0)}ms per file, should be under 10000ms`);

        // Verify all files created
        for (const file of files) {
            const stats = await fs.stat(file.output);
            t.true(stats.size > 0);
        }
    } finally {
        await cleanup(dir);
    }
});

// ============================================================================
// Stress Test: Minimal Memory Baseline
// ============================================================================

test('small file processing should use minimal memory', async (t) => {
    const dir = await createTempDir('minimal');
    try {
        const inputPath = path.join(dir, 'small.md');
        const outputPath = path.join(dir, 'small.pdf');
        await fs.writeFile(inputPath, '# Small\n\nMinimal content.');

        // Force GC if available
        if (global.gc) {
            global.gc();
        }

        const memBefore = process.memoryUsage().heapUsed;
        await convertMdToPdf({ path: inputPath }, { dest: outputPath, ...defaultConfig });
        const memAfter = process.memoryUsage().heapUsed;

        const memUsed = (memAfter - memBefore) / (1024 * 1024);

        // Memory usage should be reasonable for small file (< 50MB)
        t.true(memUsed < 50, `Used ${memUsed.toFixed(2)}MB, should be under 50MB for small file`);

        const stats = await fs.stat(outputPath);
        t.true(stats.size > 0);
    } finally {
        await cleanup(dir);
    }
});
