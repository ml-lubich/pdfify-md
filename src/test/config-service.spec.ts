/**
 * Tests for ConfigService
 *
 * Tests configuration merging, validation, and CLI argument handling.
 */

import test from 'ava';
import { ConfigService } from '../lib/services/ConfigService.js';
import { defaultConfig, type Config } from '../lib/config.js';

const configService = new ConfigService();

test('getDefaultConfig should return a copy of default config', (t) => {
	const config = configService.getDefaultConfig();

	t.truthy(config);
	t.is(config.basedir, defaultConfig.basedir);
	t.is(config.highlight_style, defaultConfig.highlight_style);

	// Should be a copy, not a reference
	config.highlight_style = 'test';
	t.not(config.highlight_style, defaultConfig.highlight_style);
});

test('mergeConfigs should merge multiple configs correctly', (t) => {
	const config1 = { document_title: 'Title 1' };
	const config2 = { document_title: 'Title 2', highlight_style: 'monokai' };

	const merged = configService.mergeConfigs(config1, config2);

	t.is(merged.document_title, 'Title 2'); // Later config wins
	t.is(merged.highlight_style, 'monokai');
	t.truthy(merged.basedir); // Should have defaults
});

test('mergeConfigs should merge pdf_options correctly', (t) => {
	const config1 = {
		pdf_options: {
			format: 'a4' as const,
		},
	};
	const config2 = {
		pdf_options: {
			format: 'Letter' as const,
			margin: { top: '10mm' },
		},
	};

	const merged = configService.mergeConfigs(config1, config2);

	t.is(merged.pdf_options.format, 'Letter');
	t.deepEqual(merged.pdf_options.margin, { top: '10mm' });
});

test('mergeConfigs should sanitize array options', (t) => {
	const config = {
		body_class: ['single-class'],
		stylesheet: ['single.css'],
	};

	const merged = configService.mergeConfigs(config);

	t.true(Array.isArray(merged.body_class));
	t.true(Array.isArray(merged.stylesheet));
	t.is(merged.body_class[0], 'single-class');
	t.is(merged.stylesheet[0], 'single.css');
});

test('mergeConfigs should handle string margin conversion', (t) => {
	const config = {
		pdf_options: {
			margin: { top: '10mm', right: '20mm', bottom: '10mm', left: '20mm' },
		},
	};

	const merged = configService.mergeConfigs(config);

	t.not(typeof merged.pdf_options.margin, 'string');
	t.truthy(merged.pdf_options.margin);
	t.is(merged.pdf_options.margin?.top, '10mm');
	t.is(merged.pdf_options.margin?.right, '20mm');
});

test('mergeConfigs should enable displayHeaderFooter when templates provided', (t) => {
	const config = {
		pdf_options: {
			headerTemplate: '<div>Header</div>',
		},
	};

	const merged = configService.mergeConfigs(config);

	t.is(merged.pdf_options.displayHeaderFooter, true);
});

test('mergeConfigs should disable displayHeaderFooter when no templates', (t) => {
	const config = {
		pdf_options: {},
	};

	const merged = configService.mergeConfigs(config);

	t.is(merged.pdf_options.displayHeaderFooter, false);
});

test('validateConfig should throw error for invalid basedir', (t) => {
	const config = { ...defaultConfig, basedir: '' };

	t.throws(
		() => {
			configService.validateConfig(config as Config);
		},
		{ message: /basedir is required/ },
	);
});

test('validateConfig should throw error for invalid port', (t) => {
	const config1 = { ...defaultConfig, port: 0 };
	const config2 = { ...defaultConfig, port: 70_000 };

	t.throws(
		() => {
			configService.validateConfig(config1 as Config);
		},
		{ message: /port must be between/ },
	);

	t.throws(
		() => {
			configService.validateConfig(config2 as Config);
		},
		{ message: /port must be between/ },
	);
});

test('validateConfig should throw error for invalid stylesheet type', (t) => {
	const config = { ...defaultConfig, stylesheet: 'not-an-array' as any };

	t.throws(
		() => {
			configService.validateConfig(config);
		},
		{ message: /stylesheet must be an array/ },
	);
});

test('validateConfig should throw error for invalid body_class type', (t) => {
	const config = { ...defaultConfig, body_class: 'not-an-array' as any };

	t.throws(
		() => {
			configService.validateConfig(config);
		},
		{ message: /body_class must be an array/ },
	);
});

test('mergeCliArgs should convert CLI flags to config keys', (t) => {
	const arguments_ = {
		'--document-title': 'CLI Title',
		'--highlight-style': 'monokai',
		'--port': '3000',
		_: [] as string[],
	};

	const merged = configService.mergeCliArgs(defaultConfig, arguments_);

	t.is(merged.document_title, 'CLI Title');
	t.is(merged.highlight_style, 'monokai');
	t.is(merged.port, 3000);
});

test('mergeCliArgs should parse JSON arguments', (t) => {
	const arguments_ = {
		'--pdf-options': JSON.stringify({ format: 'Letter' }),
		'--marked-options': JSON.stringify({ breaks: true }),
	};

	const merged = configService.mergeCliArgs(defaultConfig, arguments_);

	t.is(merged.pdf_options.format, 'Letter');
	t.is(merged.marked_options.breaks, true);
});

test('mergeCliArgs should handle invalid JSON gracefully', (t) => {
	const arguments_ = {
		'--pdf-options': 'invalid json',
	};

	// Should not throw
	const merged = configService.mergeCliArgs(defaultConfig, arguments_);

	t.truthy(merged);
	t.not(merged.pdf_options.format, undefined);
});

test('mergeCliArgs should ignore non-flag arguments', (t) => {
	const arguments_ = {
		'--document-title': 'Title',
		'not-a-flag': 'value',
		_: ['file.md'],
	};

	const merged = configService.mergeCliArgs(defaultConfig, arguments_);

	t.is(merged.document_title, 'Title');
	t.not((merged as any).not_a_flag, 'value');
});
