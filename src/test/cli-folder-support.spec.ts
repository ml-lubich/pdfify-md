import test from 'ava';
import { getMarkdownFiles } from '../lib/utils/file.js';
import * as path from 'path';
import * as fs from 'fs';

test('getMarkdownFiles should return single file if input is file', async (t) => {
    const result = await getMarkdownFiles('README.md');
    t.true(result.length > 0);
    t.true(result[0].endsWith('README.md'));
});

test('getMarkdownFiles should return empty array for non-existent path', async (t) => {
    const result = await getMarkdownFiles('non-existent-file.md');
    t.deepEqual(result, []);
});

test('getMarkdownFiles should recursively find md files in directory', async (t) => {
    // Create a temp dir structure for testing
    const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-folder-'));
    try {
        const subDir = path.join(tempDir, 'subdir');
        fs.mkdirSync(subDir);
        fs.writeFileSync(path.join(tempDir, 'file1.md'), '# content');
        fs.writeFileSync(path.join(subDir, 'file2.markdown'), '# content');
        fs.writeFileSync(path.join(tempDir, 'ignore.txt'), 'ignore');

        const result = await getMarkdownFiles(tempDir);
        t.is(result.length, 2);
        t.true(result.some(f => f.endsWith('file1.md')));
        t.true(result.some(f => f.endsWith('file2.markdown')));
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
});
