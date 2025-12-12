/**
 * Comprehensive tests for domain errors.
 *
 * Tests error types, properties, and error handling.
 */

import test from 'ava';
import {
	DomainError,
	ValidationError,
	FileError,
	ConfigurationError,
	MarkdownParseError,
	MermaidProcessError,
	OutputGenerationError,
	ServerError,
} from '../../lib/domain/errors.js';

// ============================================================================
// ValidationError Tests
// ============================================================================

test('ValidationError should create error with message', (t) => {
	const error = new ValidationError('Invalid input');

	t.true(error instanceof Error);
	t.true(error instanceof DomainError);
	t.is(error.message, 'Invalid input');
	t.is(error.code, 'VALIDATION_ERROR');
	t.truthy(error.timestamp);
});

test('ValidationError should include cause error', (t) => {
	const cause = new Error('Original error');
	const error = new ValidationError('Invalid input', cause);

	t.is(error.cause, cause);
	t.is(error.message, 'Invalid input');
});

test('ValidationError should have correct error name', (t) => {
	const error = new ValidationError('Test');

	t.is(error.name, 'ValidationError');
});

// ============================================================================
// FileError Tests
// ============================================================================

test('FileError should create error with message and path', (t) => {
	const error = new FileError('File not found', '/path/to/file');

	t.is(error.message, 'File not found');
	t.is(error.path, '/path/to/file');
	t.is(error.code, 'FILE_ERROR');
});

test('FileError should work without path', (t) => {
	const error = new FileError('File operation failed');

	t.is(error.message, 'File operation failed');
	t.is(error.path, undefined);
	t.is(error.code, 'FILE_ERROR');
});

test('FileError should include cause error', (t) => {
	const cause = new Error('ENOENT');
	const error = new FileError('File not found', '/path/to/file', cause);

	t.is(error.cause, cause);
	t.is(error.path, '/path/to/file');
});

// ============================================================================
// ConfigurationError Tests
// ============================================================================

test('ConfigurationError should create error with message', (t) => {
	const error = new ConfigurationError('Invalid configuration');

	t.is(error.message, 'Invalid configuration');
	t.is(error.code, 'CONFIGURATION_ERROR');
});

test('ConfigurationError should include cause error', (t) => {
	const cause = new Error('Parse error');
	const error = new ConfigurationError('Invalid configuration', cause);

	t.is(error.cause, cause);
});

// ============================================================================
// MarkdownParseError Tests
// ============================================================================

test('MarkdownParseError should create error with message', (t) => {
	const error = new MarkdownParseError('Failed to parse markdown');

	t.is(error.message, 'Failed to parse markdown');
	t.is(error.code, 'MARKDOWN_PARSE_ERROR');
});

test('MarkdownParseError should include cause error', (t) => {
	const cause = new Error('Syntax error');
	const error = new MarkdownParseError('Failed to parse markdown', cause);

	t.is(error.cause, cause);
});

// ============================================================================
// MermaidProcessError Tests
// ============================================================================

test('MermaidProcessError should create error with message and chart index', (t) => {
	const error = new MermaidProcessError('Failed to process chart', 0);

	t.is(error.message, 'Failed to process chart');
	t.is(error.chartIndex, 0);
	t.is(error.code, 'MERMAID_PROCESS_ERROR');
});

test('MermaidProcessError should work without chart index', (t) => {
	const error = new MermaidProcessError('Failed to process charts');

	t.is(error.message, 'Failed to process charts');
	t.is(error.chartIndex, undefined);
});

test('MermaidProcessError should include cause error', (t) => {
	const cause = new Error('Rendering error');
	const error = new MermaidProcessError('Failed to process chart', 1, cause);

	t.is(error.cause, cause);
	t.is(error.chartIndex, 1);
});

// ============================================================================
// OutputGenerationError Tests
// ============================================================================

test('OutputGenerationError should create error with message', (t) => {
	const error = new OutputGenerationError('Failed to generate output');

	t.is(error.message, 'Failed to generate output');
	t.is(error.code, 'OUTPUT_GENERATION_ERROR');
});

test('OutputGenerationError should include cause error', (t) => {
	const cause = new Error('PDF generation failed');
	const error = new OutputGenerationError('Failed to generate output', cause);

	t.is(error.cause, cause);
});

// ============================================================================
// ServerError Tests
// ============================================================================

test('ServerError should create error with message and port', (t) => {
	const error = new ServerError('Server failed to start', 3000);

	t.is(error.message, 'Server failed to start');
	t.is(error.port, 3000);
	t.is(error.code, 'SERVER_ERROR');
});

test('ServerError should work without port', (t) => {
	const error = new ServerError('Server error');

	t.is(error.message, 'Server error');
	t.is(error.port, undefined);
});

test('ServerError should include cause error', (t) => {
	const cause = new Error('EADDRINUSE');
	const error = new ServerError('Server failed to start', 3000, cause);

	t.is(error.cause, cause);
	t.is(error.port, 3000);
});

// ============================================================================
// DomainError Base Class Tests
// ============================================================================

test('DomainError should have timestamp', (t) => {
	const before = new Date();
	const error = new ValidationError('Test');
	const after = new Date();

	t.true(error.timestamp >= before);
	t.true(error.timestamp <= after);
});

test('DomainError should have stack trace', (t) => {
	const error = new ValidationError('Test');

	t.truthy(error.stack);
	t.true(typeof error.stack === 'string');
	t.true(error.stack.includes('ValidationError'));
});

test('DomainError should preserve cause error stack', (t) => {
	const cause = new Error('Original error');
	const error = new ValidationError('Test', cause);

	t.is(error.cause, cause);
	t.truthy(cause.stack);
});

// ============================================================================
// Edge Cases - Empty Messages
// ============================================================================

test('DomainError should handle empty message', (t) => {
	const error = new ValidationError('');

	t.is(error.message, '');
	t.is(error.code, 'VALIDATION_ERROR');
});

test('DomainError should handle very long messages', (t) => {
	const longMessage = 'a'.repeat(10_000);
	const error = new ValidationError(longMessage);

	t.is(error.message, longMessage);
	t.is(error.message.length, 10_000);
});

// ============================================================================
// Edge Cases - Special Characters
// ============================================================================

test('DomainError should handle special characters in message', (t) => {
	const message = 'Error with "quotes" and \'single quotes\' and\nnewlines\tand\ttabs';
	const error = new ValidationError(message);

	t.is(error.message, message);
});

test('DomainError should handle unicode characters', (t) => {
	const message = 'Error with unicode: 🚀 📝 ✨ 中文 العربية';
	const error = new ValidationError(message);

	t.is(error.message, message);
});

// ============================================================================
// Edge Cases - Null and Undefined
// ============================================================================

test('DomainError should handle undefined cause', (t) => {
	const error = new ValidationError('Test', undefined);

	t.is(error.cause, undefined);
	t.is(error.message, 'Test');
});

test('DomainError should handle null cause', (t) => {
	// @ts-expect-error - intentionally testing edge case
	const error = new ValidationError('Test', null);

	// @ts-expect-error - cause might be null
	t.is(error.cause, null);
});

// ============================================================================
// Negative Tests - Error Throwing
// ============================================================================

test('ValidationError should be throwable', (t) => {
	t.throws(
		() => {
			throw new ValidationError('Test error');
		},
		{ instanceOf: ValidationError, message: 'Test error' },
	);
});

test('FileError should be throwable', (t) => {
	t.throws(
		() => {
			throw new FileError('File not found', '/path/to/file');
		},
		{ instanceOf: FileError, message: 'File not found' },
	);
});

test('ConfigurationError should be throwable', (t) => {
	t.throws(
		() => {
			throw new ConfigurationError('Invalid config');
		},
		{ instanceOf: ConfigurationError, message: 'Invalid config' },
	);
});

test('MarkdownParseError should be throwable', (t) => {
	t.throws(
		() => {
			throw new MarkdownParseError('Parse failed');
		},
		{ instanceOf: MarkdownParseError, message: 'Parse failed' },
	);
});

test('MermaidProcessError should be throwable', (t) => {
	t.throws(
		() => {
			throw new MermaidProcessError('Process failed', 0);
		},
		{ instanceOf: MermaidProcessError, message: 'Process failed' },
	);
});

test('OutputGenerationError should be throwable', (t) => {
	t.throws(
		() => {
			throw new OutputGenerationError('Generation failed');
		},
		{ instanceOf: OutputGenerationError, message: 'Generation failed' },
	);
});

test('ServerError should be throwable', (t) => {
	t.throws(
		() => {
			throw new ServerError('Server failed', 3000);
		},
		{ instanceOf: ServerError, message: 'Server failed' },
	);
});

// ============================================================================
// Error Inheritance Tests
// ============================================================================

test('All domain errors should inherit from DomainError', (t) => {
	const errors = [
		new ValidationError('Test'),
		new FileError('Test'),
		new ConfigurationError('Test'),
		new MarkdownParseError('Test'),
		new MermaidProcessError('Test'),
		new OutputGenerationError('Test'),
		new ServerError('Test'),
	];

	for (const error of errors) {
		t.true(error instanceof DomainError);
		t.true(error instanceof Error);
	}
});

test('Domain errors should have unique codes', (t) => {
	const codes = new Set([
		new ValidationError('').code,
		new FileError('').code,
		new ConfigurationError('').code,
		new MarkdownParseError('').code,
		new MermaidProcessError('').code,
		new OutputGenerationError('').code,
		new ServerError('').code,
	]);

	t.is(codes.size, 7); // All codes should be unique
	const error = new FileError('File not found', '/path/to/missing/file.md', new Error('ENOENT'));

	t.is(error.code, 'FILE_ERROR');
	t.is(error.path, '/path/to/missing/file.md');
	t.truthy(error.cause);
	t.is(error.cause?.message, 'ENOENT');
});

test('should handle invalid configuration scenario', (t) => {
	const error = new ConfigurationError('Invalid port number', new Error('Port must be between 1 and 65535'));

	t.is(error.code, 'CONFIGURATION_ERROR');
	t.truthy(error.cause);
	t.is(error.cause?.message, 'Port must be between 1 and 65535');
});

test('should handle Mermaid chart processing failure', (t) => {
	const error = new MermaidProcessError('Failed to render chart', 2, new Error('Syntax error in mermaid diagram'));

	t.is(error.code, 'MERMAID_PROCESS_ERROR');
	t.is(error.chartIndex, 2);
	t.truthy(error.cause);
	t.is(error.cause?.message, 'Syntax error in mermaid diagram');
});

test('should handle server port conflict', (t) => {
	const error = new ServerError('Port already in use', 3000, new Error('EADDRINUSE'));

	t.is(error.code, 'SERVER_ERROR');
	t.is(error.port, 3000);
	t.truthy(error.cause);
	t.is(error.cause?.message, 'EADDRINUSE');
});
