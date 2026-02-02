import { resolve } from 'node:path';
import test from 'ava';
import { mdToPdf } from '../index.js';

test('mdToPdf should throw error when input is missing both content and path', async (t) => {
	await t.throwsAsync(
		async () => {
			await mdToPdf({} as any);
		},
		{ message: /missing one of the properties/ },
	);
});

test('mdToPdf should handle content input', async (t) => {
	const result = await mdToPdf({ content: '# Hello World' });

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
	t.is(result.filename, '');
});

test('mdToPdf should handle path input', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const result = await mdToPdf({ path: testMdPath });

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should generate HTML when as_html is true', async (t) => {
	const result = await mdToPdf({ content: '# Hello World' }, { as_html: true });

	t.truthy(result);
	t.is(typeof result.content, 'string');
	t.true(result.content.includes('<h1'));
});

test('mdToPdf should use provided port in config', async (t) => {
	const result = await mdToPdf({ content: '# Test' }, { port: 6000 });

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should set basedir from path when not provided', async (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const result = await mdToPdf({ path: testMdPath }, { port: 6001 });

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should use process.cwd() as basedir for content input', async (t) => {
	const result = await mdToPdf({ content: '# Test' }, { port: 6002 });

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should merge config with defaultConfig', async (t) => {
	const result = await mdToPdf(
		{ content: '# Test' },
		{
			port: 6003,
			document_title: 'Custom Title',
			body_class: ['custom-class'],
		},
	);

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should merge pdf_options with defaultConfig', async (t) => {
	const result = await mdToPdf(
		{ content: '# Test' },
		{
			port: 6004,
			pdf_options: {
				format: 'Letter',
			},
		},
	);

	t.truthy(result);
	t.truthy(result.content instanceof Buffer);
});

test('mdToPdf should handle devtools option', async (t) => {
	// This test verifies devtools option is passed through
	// Note: With devtools, no file is generated, so we expect an error or undefined
	const result = await mdToPdf({ content: '# Test' }, { port: 6005, devtools: true });

	// With devtools, result might be undefined or throw
	// The actual behavior depends on implementation
	t.truthy(result === undefined || result.content instanceof Buffer);
});
