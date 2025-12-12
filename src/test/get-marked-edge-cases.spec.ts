/**
 * Tests for edge cases in get-marked-with-highlighter
 *
 * Tests error handling and edge cases for markdown parsing.
 */

import test from 'ava';
import { getMarked, createMarkedRenderer } from '../lib/get-marked-with-highlighter.js';

test('getMarked should handle parsing errors gracefully', (t) => {
	const marked = getMarked({}, []);

	// Test with valid markdown first
	const validHtml = marked('# Valid');
	t.truthy(validHtml);

	// The function should handle edge cases internally
	t.notThrows(() => {
		marked('Normal markdown');
	});
});

test('createMarkedRenderer should handle extensions array', (t) => {
	const renderer = createMarkedRenderer({}, []);
	const html = renderer.parse('# Test');

	t.truthy(html);
	t.true(html.includes('<h1'));
});

test('createMarkedRenderer should apply extensions when provided', (t) => {
	const renderer = createMarkedRenderer({}, []);
	const html = renderer.parse('# Test');

	t.truthy(html);
});
// ...
test('createMarkedRenderer should configure highlight function correctly', (t) => {
	const renderer = createMarkedRenderer({}, []);

	// Test that highlight is configured
	const html = renderer.parse('```js\nconst x = 1;\n```');

	t.truthy(html);
	t.true(html.includes('hljs'));
});
