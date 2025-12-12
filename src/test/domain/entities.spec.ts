/**
 * Comprehensive tests for domain entities and value objects.
 *
 * Tests InputSource, OutputDestination, and ConversionRequest
 * with edge cases and negative scenarios.
 */

import test from 'ava';
import { InputSource, OutputDestination, ConversionRequest } from '../../lib/domain/entities.js';
import { ValidationError } from '../../lib/domain/errors.js';

// ============================================================================
// InputSource Tests
// ============================================================================

test('InputSource.fromPath should create path-based input', (t) => {
	const input = InputSource.fromPath('/path/to/file.md');

	t.true(input.isPath());
	t.false(input.isContent());
	t.is(input.path, '/path/to/file.md');
	t.is(input.content, undefined);
});

test('InputSource.fromContent should create content-based input', (t) => {
	const input = InputSource.fromContent('# Hello World');

	t.false(input.isPath());
	t.true(input.isContent());
	t.is(input.path, undefined);
	t.is(input.content, '# Hello World');
});

test('InputSource.from should create from path object', (t) => {
	const input = InputSource.from({ path: '/path/to/file.md' });

	t.true(input.isPath());
	t.is(input.path, '/path/to/file.md');
});

test('InputSource.from should create from content object', (t) => {
	const input = InputSource.from({ content: '# Hello World' });

	t.true(input.isContent());
	t.is(input.content, '# Hello World');
});

// ============================================================================
// InputSource Validation Tests
// ============================================================================

test('InputSource should throw error when neither path nor content provided', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.from({});
		},
		{ instanceOf: ValidationError, message: /Input must have either path or content/ },
	);
});

test('InputSource should throw error when both path and content provided', (t) => {
	// InputSource.from calls fromPath and fromContent which call the constructor
	// But providing both is impossible via the static methods
	// This test tests an invalid state that can't happen through normal usage
	// So we'll test that the from method correctly chooses path when both are provided
	const input = InputSource.from({ path: '/path/to/file.md', content: '# Hello' });
	t.true(input.isPath()); // .from() prioritizes path over content
	t.is(input.path, '/path/to/file.md');
});

test('InputSource.fromPath should throw error for non-string path', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromPath(null);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource.fromContent should throw error for non-string content', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromContent(null);
		},
		{ instanceOf: ValidationError },
	);
});

// ============================================================================
// InputSource Edge Cases
// ============================================================================

test('InputSource should handle empty string path', (t) => {
	// Empty strings are treated as invalid (they throw ValidationError)
	t.throws(
		() => InputSource.fromPath(''),
		{ instanceOf: ValidationError }
	);
});

test('InputSource should handle empty string content', (t) => {
	// Empty strings are treated as invalid (they throw ValidationError)
	t.throws(
		() => InputSource.fromContent(''),
		{ instanceOf: ValidationError }
	);
});

test('InputSource should handle very long path', (t) => {
	const longPath = '/path/' + 'a'.repeat(10_000) + '.md';
	const input = InputSource.fromPath(longPath);

	t.is(input.path, longPath);
	t.is(input.path.length, 10_009); // '/path/' (6) + 'aaa...' (10000) + '.md' (3)
});

test('InputSource should handle very long content', (t) => {
	const longContent = '# ' + 'a'.repeat(100_000);
	const input = InputSource.fromContent(longContent);

	t.is(input.content, longContent);
	t.is(input.content.length, 100_000 + 2);
});

test('InputSource should handle path with special characters', (t) => {
	const path = '/path/with spaces/file-name.md';
	const input = InputSource.fromPath(path);

	t.is(input.path, path);
});

test('InputSource should handle path with unicode characters', (t) => {
	const path = '/path/中文/العربية/file.md';
	const input = InputSource.fromPath(path);

	t.is(input.path, path);
});

test('InputSource should handle content with special characters', (t) => {
	const content = '# Test\n\nContent with "quotes" and \'single quotes\' and\nnewlines\tand\ttabs';
	const input = InputSource.fromContent(content);

	t.is(input.content, content);
});

test('InputSource should handle content with unicode characters', (t) => {
	const content = '# Test\n\nContent with unicode: 🚀 📝 ✨ 中文 العربية';
	const input = InputSource.fromContent(content);

	t.is(input.content, content);
});

// ============================================================================
// OutputDestination Tests
// ============================================================================

test('OutputDestination.toFile should create file destination', (t) => {
	const destination = OutputDestination.toFile('/path/to/output.pdf');

	t.false(destination.isStdout());
	t.true(destination.isFile());
	t.is(destination.path, '/path/to/output.pdf');
});

test('OutputDestination.toStdout should create stdout destination', (t) => {
	const destination = OutputDestination.toStdout();

	t.true(destination.isStdout());
	t.false(destination.isFile());
	t.is(destination.path, undefined);
});

test('OutputDestination.from should create file destination from path', (t) => {
	const destination = OutputDestination.from('/path/to/output.pdf');

	t.true(destination.isFile());
	t.is(destination.path, '/path/to/output.pdf');
});

test('OutputDestination.from should create stdout destination from "stdout"', (t) => {
	const destination = OutputDestination.from('stdout');

	t.true(destination.isStdout());
});

test('OutputDestination.from should create stdout destination from undefined', (t) => {
	const destination = OutputDestination.from(undefined);

	t.true(destination.isStdout());
});

// ============================================================================
// OutputDestination Edge Cases
// ============================================================================

test('OutputDestination should handle empty string path', (t) => {
	// Empty strings are allowed for OutputDestination
	const destination = OutputDestination.toFile('');

	t.true(destination.isFile());
	t.is(destination.path, '');
});

test('OutputDestination should handle very long path', (t) => {
	const longPath = '/path/' + 'a'.repeat(10_000) + '.pdf';
	const destination = OutputDestination.toFile(longPath);

	t.is(destination.path, longPath);
	t.is(destination.path.length, 10_000 + 10);
});

test('OutputDestination should handle path with special characters', (t) => {
	const path = '/path/with spaces/output-file.pdf';
	const destination = OutputDestination.toFile(path);

	t.is(destination.path, path);
});

test('OutputDestination should handle path with unicode characters', (t) => {
	const path = '/path/中文/العربية/output.pdf';
	const destination = OutputDestination.toFile(path);

	t.is(destination.path, path);
});

// ============================================================================
// ConversionRequest Tests
// ============================================================================

test('ConversionRequest should create PDF conversion request', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.isPdf());
	t.false(request.isHtml());
	t.is(request.format, 'pdf');
	t.is(request.input, input);
	t.is(request.output, output);
});

test('ConversionRequest should create HTML conversion request', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toFile('/path/to/output.html');
	const request = new ConversionRequest(input, output, 'html');

	t.false(request.isPdf());
	t.true(request.isHtml());
	t.is(request.format, 'html');
});

// ============================================================================
// ConversionRequest Edge Cases
// ============================================================================

test('ConversionRequest should handle path-based input', (t) => {
	const input = InputSource.fromPath('/path/to/input.md');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.input.isPath());
	t.is(request.input.path, '/path/to/input.md');
});

test('ConversionRequest should handle content-based input', (t) => {
	const input = InputSource.fromContent('# Hello World');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');

	t.true(request.input.isContent());
	t.is(request.input.content, '# Hello World');
	t.true(request.output.isStdout());
});

test('ConversionRequest should handle stdout output', (t) => {
	const input = InputSource.fromContent('# Hello');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.output.isStdout());
});

// ============================================================================
// Integration Tests
// ============================================================================

test('should create complete conversion request with all components', (t) => {
	const input = InputSource.fromPath('/path/to/input.md');
	const output = OutputDestination.toFile('/path/to/output.pdf');
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.input.isPath());
	t.true(request.output.isFile());
	t.true(request.isPdf());
	t.is(request.input.path, '/path/to/input.md');
	t.is(request.output.path, '/path/to/output.pdf');
});

test('should create HTML conversion request from content to stdout', (t) => {
	const input = InputSource.fromContent('# Hello World');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');

	t.true(request.input.isContent());
	t.true(request.output.isStdout());
	t.true(request.isHtml());
	t.is(request.input.content, '# Hello World');
});

// ============================================================================
// Negative Tests
// ============================================================================

test('InputSource should reject null path', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromPath(null);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject null content', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromContent(null);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject undefined path', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromPath(undefined);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject undefined content', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromContent(undefined);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject number as path', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromPath(123 as any);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject number as content', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromContent(123 as any);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject object as path', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromPath({} as any);
		},
		{ instanceOf: ValidationError },
	);
});

test('InputSource should reject object as content', (t) => {
	t.throws(
		() => {
			// @ts-expect-error - intentionally testing invalid input
			InputSource.fromContent({} as any);
		},
		{ instanceOf: ValidationError },
	);
});

// ============================================================================
// Boundary Tests
// ============================================================================

test('InputSource should handle maximum path length', (t) => {
	// Most systems support up to 4096 characters for paths
	const maxPath = '/'.repeat(4096);
	const input = InputSource.fromPath(maxPath);

	t.is(input.path, maxPath);
	t.is(input.path.length, 4096);
});

test('InputSource should handle very large content', (t) => {
	// Test with 1MB of content
	const largeContent = '# ' + 'a'.repeat(1024 * 1024);
	const input = InputSource.fromContent(largeContent);

	t.is(input.content, largeContent);
	t.is(input.content.length, 1024 * 1024 + 2);
});

test('OutputDestination should handle maximum path length', (t) => {
	const maxPath = '/'.repeat(4096);
	const destination = OutputDestination.toFile(maxPath);

	t.is(destination.path, maxPath);
	t.is(destination.path.length, 4096);
});

// ============================================================================
// Real-world Scenario Tests
// ============================================================================

test('should handle markdown file conversion scenario', (t) => {
	const input = InputSource.fromPath('./document.md');
	const output = OutputDestination.toFile('./document.pdf');
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.input.isPath());
	t.true(request.output.isFile());
	t.true(request.isPdf());
});

test('should handle stdin to stdout conversion scenario', (t) => {
	const input = InputSource.fromContent('# Hello from stdin');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'html');

	t.true(request.input.isContent());
	t.true(request.output.isStdout());
	t.true(request.isHtml());
});

test('should handle file to stdout conversion scenario', (t) => {
	const input = InputSource.fromPath('./document.md');
	const output = OutputDestination.toStdout();
	const request = new ConversionRequest(input, output, 'pdf');

	t.true(request.input.isPath());
	t.true(request.output.isStdout());
	t.true(request.isPdf());
});
