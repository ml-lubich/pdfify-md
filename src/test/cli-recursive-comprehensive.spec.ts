import test from 'ava';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { CliService } from '../lib/cli/CliService.js';
import { defaultConfig } from '../lib/config.js';

/**
 * Comprehensive CLI tests for recursive folder processing with config files
 */

const createTempDir = async (): Promise<string> => {
    const tempDir = join(process.cwd(), `test-cli-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
};

const createNestedStructure = async (baseDir: string) => {
    // Create nested directory structure
    await fs.mkdir(join(baseDir, 'folder1', 'subfolder1'), { recursive: true });
    await fs.mkdir(join(baseDir, 'folder2', 'subfolder2', 'deep'), { recursive: true });

    // Create markdown files at various depths
    await fs.writeFile(join(baseDir, 'root.md'), '# Root File\nContent at root level.');
    await fs.writeFile(join(baseDir, 'folder1', 'level1.md'), '# Level 1\nContent in folder1.');
    await fs.writeFile(join(baseDir, 'folder1', 'subfolder1', 'level2.md'), '# Level 2\nContent in subfolder1.');
    await fs.writeFile(join(baseDir, 'folder2', 'subfolder2', 'deep', 'level3.md'), '# Level 3\nDeeply nested content.');

    // Create non-markdown files to ensure they're ignored
    await fs.writeFile(join(baseDir, 'ignore.txt'), 'Should be ignored');
    await fs.writeFile(join(baseDir, 'folder1', 'README.txt'), 'Should be ignored');
};

test('CLI should recursively process all markdown files in folder', async (t) => {
    const tempDir = await createTempDir();

    try {
        await createNestedStructure(tempDir);

        // Run CLI on the folder
        const cliService = new CliService();
        const args = {
            _: [tempDir],
            '--help': false,
            '--version': false,
        } as any;

        await cliService.run(args, defaultConfig);
        await cliService.cleanup();

        // Verify all PDFs were created
        const rootPdf = await fs.access(join(tempDir, 'root.pdf')).then(() => true).catch(() => false);
        const level1Pdf = await fs.access(join(tempDir, 'folder1', 'level1.pdf')).then(() => true).catch(() => false);
        const level2Pdf = await fs.access(join(tempDir, 'folder1', 'subfolder1', 'level2.pdf')).then(() => true).catch(() => false);
        const level3Pdf = await fs.access(join(tempDir, 'folder2', 'subfolder2', 'deep', 'level3.pdf')).then(() => true).catch(() => false);

        t.true(rootPdf, 'Root PDF should be created');
        t.true(level1Pdf, 'Level 1 PDF should be created');
        t.true(level2Pdf, 'Level 2 PDF should be created');
        t.true(level3Pdf, 'Level 3 PDF should be created');

        // Verify non-markdown files don't have PDFs
        const ignoreTxtPdf = await fs.access(join(tempDir, 'ignore.pdf')).then(() => true).catch(() => false);
        t.false(ignoreTxtPdf, 'Non-markdown files should not generate PDFs');

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test('CLI should apply config file settings to all files in recursive folder', async (t) => {
    const tempDir = await createTempDir();

    try {
        await createNestedStructure(tempDir);

        // Create a config file
        const configPath = join(tempDir, 'test-config.json');
        await fs.writeFile(configPath, JSON.stringify({
            pdf_options: {
                format: 'A4',
                margin: '25mm'
            }
        }));

        // Run CLI with config file
        const cliService = new CliService();
        const args = {
            _: [tempDir],
            '--help': false,
            '--version': false,
            '--config-file': configPath,
        } as any;

        await cliService.run(args, defaultConfig);
        await cliService.cleanup();

        // Verify PDFs exist (config was applied correctly)
        const rootPdf = await fs.access(join(tempDir, 'root.pdf')).then(() => true).catch(() => false);
        const level3Pdf = await fs.access(join(tempDir, 'folder2', 'subfolder2', 'deep', 'level3.pdf')).then(() => true).catch(() => false);

        t.true(rootPdf, 'PDF with config should be created at root');
        t.true(level3Pdf, 'PDF with config should be created in deep folder');

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test('CLI should handle empty directories gracefully', async (t) => {
    const tempDir = await createTempDir();

    try {
        await fs.mkdir(join(tempDir, 'empty1'), { recursive: true });
        await fs.mkdir(join(tempDir, 'empty2', 'nested'), { recursive: true });

        const cliService = new CliService();
        const args = {
            _: [tempDir],
            '--help': false,
            '--version': false,
        } as any;

        // Should not throw error for empty directories
        await t.notThrowsAsync(async () => {
            await cliService.run(args, defaultConfig);
            await cliService.cleanup();
        });

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test('CLI should handle mixed file and folder arguments', async (t) => {
    const tempDir = await createTempDir();

    try {
        // Create structure
        await fs.mkdir(join(tempDir, 'subfolder'), { recursive: true });
        await fs.writeFile(join(tempDir, 'single.md'), '# Single File\nContent.');
        await fs.writeFile(join(tempDir, 'subfolder', 'nested.md'), '# Nested\nContent.');

        const cliService = new CliService();
        const args = {
            _: [
                join(tempDir, 'single.md'),  // Single file
                join(tempDir, 'subfolder')    // Folder
            ],
            '--help': false,
            '--version': false,
        } as any;

        await cliService.run(args, defaultConfig);
        await cliService.cleanup();

        // Both should be processed
        const singlePdf = await fs.access(join(tempDir, 'single.pdf')).then(() => true).catch(() => false);
        const nestedPdf = await fs.access(join(tempDir, 'subfolder', 'nested.pdf')).then(() => true).catch(() => false);

        t.true(singlePdf, 'Single file should be processed');
        t.true(nestedPdf, 'Folder contents should be processed');

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});

test('CLI should respect CLI arguments over config file for all recursive files', async (t) => {
    const tempDir = await createTempDir();

    try {
        await fs.mkdir(join(tempDir, 'sub'), { recursive: true });
        await fs.writeFile(join(tempDir, 'file1.md'), '# File 1');
        await fs.writeFile(join(tempDir, 'sub', 'file2.md'), '# File 2');

        // Config says PDF, but we'll override with --as-html
        const configPath = join(tempDir, 'config.json');
        await fs.writeFile(configPath, JSON.stringify({
            pdf_options: { format: 'A4' }
        }));

        const cliService = new CliService();
        const args = {
            _: [tempDir],
            '--help': false,
            '--version': false,
            '--config-file': configPath,
            '--as-html': true,  // Override to HTML
        } as any;

        await cliService.run(args, defaultConfig);
        await cliService.cleanup();

        // Should produce HTML files, not PDFs
        const file1Html = await fs.access(join(tempDir, 'file1.html')).then(() => true).catch(() => false);
        const file2Html = await fs.access(join(tempDir, 'sub', 'file2.html')).then(() => true).catch(() => false);
        const file1Pdf = await fs.access(join(tempDir, 'file1.pdf')).then(() => true).catch(() => false);

        t.true(file1Html, 'HTML should be created for root file');
        t.true(file2Html, 'HTML should be created for nested file');
        t.false(file1Pdf, 'PDF should not be created when overridden');

    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }
});
