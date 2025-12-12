/**
 * Comprehensive tests for Result type.
 *
 * Tests functional error handling with edge cases and negative scenarios.
 */

import test from 'ava';
import { ok, err, isOk, isErr, unwrap, unwrapOr, unwrapOrElse, Ok, Err } from '../../lib/domain/Result.js';

// ============================================================================
// Basic Functionality Tests
// ============================================================================

test('ok() should create an Ok result', (t) => {
	const result = ok(42);

	t.true(result.isOk());
	t.false(result.isErr());
	t.is(result.value, 42);
	t.true(isOk(result));
	t.false(isErr(result));
});

test('err() should create an Err result', (t) => {
	const error = new Error('Test error');
	const result = err(error);

	t.false(result.isOk());
	t.true(result.isErr());
	t.is(result.error, error);
	t.false(isOk(result));
	t.true(isErr(result));
});

test('unwrap() should return value for Ok result', (t) => {
	const result = ok(42);
	const value = unwrap(result);

	t.is(value, 42);
});

test('unwrap() should throw error for Err result', (t) => {
	const error = new Error('Test error');
	const result = err(error);

	t.throws(() => unwrap(result), { message: 'Test error' });
});

test('unwrapOr() should return value for Ok result', (t) => {
	const result = ok(42);
	const value = unwrapOr(result, 0);

	t.is(value, 42);
});

test('unwrapOr() should return default for Err result', (t) => {
	const error = new Error('Test error');
	const result = err(error);
	const value = unwrapOr(result, 0);

	t.is(value, 0);
});

test('unwrapOrElse() should return value for Ok result', (t) => {
	const result = ok(42);
	const value = unwrapOrElse(result, (e) => {
		throw new Error('Should not be called');
	});

	t.is(value, 42);
});

test('unwrapOrElse() should call function for Err result', (t) => {
	const error = new Error('Test error');
	const result = err(error);
	const value = unwrapOrElse(result, (e) => {
		t.is(e, error);
		return 0;
	});

	t.is(value, 0);
});

// ============================================================================
// Map Operations Tests
// ============================================================================

test('map() should transform Ok value', (t) => {
	const result = ok(42);
	const mapped = result.map((x) => x * 2);

	t.true(mapped.isOk());
	t.is(unwrap(mapped), 84);
});

test('map() should not transform Err value', (t) => {
	const error = new Error('Test error');
	const result = err(error);
	const mapped = result.map((x) => x * 2);

	t.true(mapped.isErr());
	t.is(mapped.error, error);
});

test('mapErr() should transform Err value', (t) => {
	const error = new Error('Test error');
	const result = err(error);
	const mapped = result.mapErr((e) => new Error(`Transformed: ${e.message}`));

	t.true(mapped.isErr());
	t.is(mapped.error.message, 'Transformed: Test error');
});

test('mapErr() should not transform Ok value', (t) => {
	const result = ok(42);
	const mapped = result.mapErr((e) => new Error('Should not be called'));

	t.true(mapped.isOk());
	t.is(unwrap(mapped), 42);
});

// ============================================================================
// Edge Cases - Null and Undefined
// ============================================================================

test('ok() should handle null values', (t) => {
	const result = ok(null);

	t.true(result.isOk());
	t.is(result.value, null);
	t.is(unwrap(result), null);
});

test('ok() should handle undefined values', (t) => {
	const result = ok(undefined);

	t.true(result.isOk());
	t.is(result.value, undefined);
	t.is(unwrap(result), undefined);
});

test('err() should handle null error', (t) => {
	const result = err(null as any);

	t.true(result.isErr());
	t.is(result.error, null);
});

test('err() should handle undefined error', (t) => {
	const result = err(undefined as any);

	t.true(result.isErr());
	t.is(result.error, undefined);
});

// ============================================================================
// Edge Cases - Empty Strings and Zero
// ============================================================================

test('ok() should handle empty strings', (t) => {
	const result = ok('');

	t.true(result.isOk());
	t.is(result.value, '');
	t.is(unwrap(result), '');
});

test('ok() should handle zero', (t) => {
	const result = ok(0);

	t.true(result.isOk());
	t.is(result.value, 0);
	t.is(unwrap(result), 0);
});

test('ok() should handle false', (t) => {
	const result = ok(false);

	t.true(result.isOk());
	t.is(result.value, false);
	t.is(unwrap(result), false);
});

// ============================================================================
// Edge Cases - Complex Objects
// ============================================================================

test('ok() should handle objects', (t) => {
	const object = { a: 1, b: 'test' };
	const result = ok(object);

	t.true(result.isOk());
	t.deepEqual(result.value, object);
	t.deepEqual(unwrap(result), object);
});

test('ok() should handle arrays', (t) => {
	const array = [1, 2, 3];
	const result = ok(array);

	t.true(result.isOk());
	t.deepEqual(result.value, array);
	t.deepEqual(unwrap(result), array);
});

test('ok() should handle nested structures', (t) => {
	const nested = { a: { b: { c: 42 } } };
	const result = ok(nested);

	t.true(result.isOk());
	t.deepEqual(result.value, nested);
	t.deepEqual(unwrap(result), nested);
});

// ============================================================================
// Edge Cases - Functions
// ============================================================================

test('ok() should handle functions', (t) => {
	const function_ = () => 42;
	const result = ok(function_);

	t.true(result.isOk());
	t.is(typeof result.value, 'function');
	t.is(result.value(), 42);
});

test('map() should handle functions that throw', (t) => {
	const result = ok(42);

	t.throws(
		() => {
			result.map((x) => {
				throw new Error('Map error');
			});
		},
		{ message: 'Map error' },
	);
});

// ============================================================================
// Edge Cases - Chaining
// ============================================================================

test('should chain multiple map operations', (t) => {
	const result = ok(2)
		.map((x) => x * 2)
		.map((x) => x + 1)
		.map((x) => x.toString());

	t.true(result.isOk());
	t.is(unwrap(result), '5');
});

test('should short-circuit map operations on Err', (t) => {
	const error = new Error('Original error');
	const result = err(error)
		.map((x) => x * 2)
		.map((x) => x + 1)
		.map((x) => x.toString());

	t.true(result.isErr());
	t.is(result.error, error);
});

// ============================================================================
// Edge Cases - Error Types
// ============================================================================

test('err() should handle different error types', (t) => {
	const typesError = new TypeError('Type error');
	const result1 = err(typesError);
	t.true(result1.isErr());
	t.is(result1.error, typesError);

	const referenceError = new ReferenceError('Reference error');
	const result2 = err(referenceError);
	t.true(result2.isErr());
	t.is(result2.error, referenceError);

	const stringError = 'String error';
	const result3 = err(stringError);
	t.true(result3.isErr());
	t.is(result3.error, stringError);
});

test('unwrap() should preserve error type', (t) => {
	const typesError = new TypeError('Type error');
	const result = err(typesError);

	t.throws(() => unwrap(result), { instanceOf: TypeError });
	t.throws(() => unwrap(result), { message: 'Type error' });
});

// ============================================================================
// Edge Cases - unwrapOr with falsy defaults
// ============================================================================

test('unwrapOr() should handle falsy defaults', (t) => {
	const result = err(new Error('Test error'));

	t.is(unwrapOr(result, 0), 0);
	t.is(unwrapOr(result, ''), '');
	t.is(unwrapOr(result, false), false);
	t.is(unwrapOr(result, null), null);
});

test('unwrapOr() should return Ok value even if default is truthy', (t) => {
	const result = ok(0);

	t.is(unwrapOr(result, 42), 0); // Should return 0, not default
});

// ============================================================================
// Edge Cases - unwrapOrElse with side effects
// ============================================================================

test('unwrapOrElse() should not call function for Ok result', (t) => {
	const result = ok(42);
	let called = false;

	const value = unwrapOrElse(result, () => {
		called = true;
		return 0;
	});

	t.false(called);
	t.is(value, 42);
});

test('unwrapOrElse() should call function for Err result (alternative)', (t) => {
	const error = new Error('Test error');
	const result = err(error);
	let called = false;

	const value = unwrapOrElse(result, (e) => {
		called = true;
		t.is(e, error);
		return 0;
	});

	t.true(called);
	t.is(value, 0);
});

// ============================================================================
// Negative Tests - Invalid Usage
// ============================================================================

test('should handle unwrap on Err result (negative test)', (t) => {
	const error = new Error('Test error');
	const result = err(error);

	t.throws(() => result.unwrap(), { message: 'Test error' });
	t.throws(() => unwrap(result), { message: 'Test error' });
});

test('should handle accessing value on Err result (negative test)', (t) => {
	const error = new Error('Test error');
	const result = err(error);

	// TypeScript should prevent this, but runtime check
	t.true(result.isErr());
	t.notThrows(() => {
		// @ts-expect-error - intentionally testing error case
		const _ = (result as any).value;
	});
});

test('should handle accessing error on Ok result (negative test)', (t) => {
	const result = ok(42);

	// TypeScript should prevent this, but runtime check
	t.true(result.isOk());
	t.notThrows(() => {
		// @ts-expect-error - intentionally testing error case
		const _ = (result as any).error;
	});
});

// ============================================================================
// Performance Tests - Large Data
// ============================================================================

test('should handle large arrays', (t) => {
	const largeArray = Array.from({ length: 10_000 }, (_, i) => i);
	const result = ok(largeArray);

	t.true(result.isOk());
	t.is(unwrap(result).length, 10_000);
});

test('should handle large strings', (t) => {
	const largeString = 'a'.repeat(100_000);
	const result = ok(largeString);

	t.true(result.isOk());
	t.is(unwrap(result).length, 100_000);
});

// ============================================================================
// Type Guards Tests
// ============================================================================

test('isOk() should work as type guard', (t) => {
	const result: ReturnType<typeof ok> | ReturnType<typeof err> = ok(42);

	if (isOk(result)) {
		// TypeScript should know this is Ok<number>
		t.is(result.value, 42);
		// @ts-expect-error - error should not exist on Ok
		const _ = result.error;
	}
});

test('isErr() should work as type guard', (t) => {
	const error = new Error('Test error');
	const result: ReturnType<typeof ok> | ReturnType<typeof err> = err(error);

	if (isErr(result)) {
		// TypeScript should know this is Err<Error>
		t.is(result.error, error);
		// @ts-expect-error - value should not exist on Err
		const _ = result.value;
	}
});

// ============================================================================
// Integration Tests - Real-world Scenarios
// ============================================================================

test('should handle file read success scenario', (t) => {
	const fileContent = 'Hello, World!';
	const result = ok(fileContent);

	if (result.isOk()) {
		const content = result.value;
		t.is(content, fileContent);
	} else {
		t.fail('Should be Ok result');
	}
});

test('should handle file read error scenario', (t) => {
	const error = new Error('File not found');
	const result = err(error);

	if (result.isErr()) {
		const errorMessage = result.error.message;
		t.is(errorMessage, 'File not found');
		const fallback = unwrapOrElse(result, (e) => 'Default content');
		t.is(fallback, 'Default content');
	} else {
		t.fail('Should be Err result');
	}
});

test('should handle validation success scenario', (t) => {
	const validate = (value: number): ReturnType<typeof ok> | ReturnType<typeof err> => {
		if (value > 0) {
			return ok(value);
		}

		return err(new Error('Value must be positive'));
	};

	const result = validate(42);
	t.true(result.isOk());
	t.is(unwrap(result), 42);
});

test('should handle validation error scenario', (t) => {
	const validate = (value: number): ReturnType<typeof ok> | ReturnType<typeof err> => {
		if (value > 0) {
			return ok(value);
		}

		return err(new Error('Value must be positive'));
	};

	const result = validate(-1);
	t.true(result.isErr());
	t.is(result.error.message, 'Value must be positive');
});
